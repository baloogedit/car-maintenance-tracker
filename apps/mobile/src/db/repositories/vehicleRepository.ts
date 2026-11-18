import {randomUUID} from 'expo-crypto';
import type {SQLiteDatabase} from 'expo-sqlite';

import type {User} from '@/types/auth.types';
import type {ServerRow, VehicleSyncData} from '@/types/sync.types';
import type {FuelType, Vehicle, VehicleInput} from '@/types/vehicle.types';

import {getDb, writeTransaction} from '../database';
import {enqueue, hasEntryFor} from './outboxRepository';

// A jarmuvek helyi tarolasa. A kepernyok CSAK ezen keresztul olvasnak es irnak; a
// szerverrel a szinkron (sync/syncEngine.ts) tartja a kapcsolatot.

interface VehicleRow {
  id: string;
  ownerUserId: string;
  companyId: string | null;
  make: string;
  model: string;
  year: number;
  vin: string | null;
  licensePlate: string | null;
  engineType: string | null;
  fuelType: string;
  currentMileage: number;
  purchaseDate: string | null;
  createdAt: string;
  clientUpdatedAt: string;
  version: number | null;
  deletedAt: string | null;
  synced: number; // SQLite-ban nincs boolean: 0 / 1
}

function toVehicle(row: VehicleRow): Vehicle {
  const {deletedAt: _deletedAt, synced, fuelType, ...rest} = row;
  return {...rest, fuelType: fuelType as FuelType, synced: synced === 1};
}

// A push "data" resze: a jarmu szerkesztheto mezoi.
function toPayload(row: VehicleRow): Record<string, unknown> {
  return {
    make: row.make,
    model: row.model,
    year: row.year,
    vin: row.vin,
    licensePlate: row.licensePlate,
    engineType: row.engineType,
    fuelType: row.fuelType,
    currentMileage: row.currentMileage,
    purchaseDate: row.purchaseDate,
    // csak beszurasnal szamit: a ceges felhasznalo maganjarmuvet is felvehet
    isCompanyVehicle: row.companyId !== null,
  };
}

// ---------- olvasas ----------

export async function listVehicles(): Promise<Vehicle[]> {
  const rows = await getDb().getAllAsync<VehicleRow>(
    'SELECT * FROM vehicle WHERE deletedAt IS NULL ORDER BY make, model',
  );
  return rows.map(toVehicle);
}

export async function getVehicle(id: string): Promise<Vehicle | null> {
  const row = await getDb().getFirstAsync<VehicleRow>(
    'SELECT * FROM vehicle WHERE id = ? AND deletedAt IS NULL',
    id,
  );
  return row ? toVehicle(row) : null;
}

// ---------- helyi iras (offline is mukodik) ----------

export async function createVehicle(input: VehicleInput, user: User): Promise<string> {
  const now = new Date().toISOString();
  const row: VehicleRow = {
    id: randomUUID(), // az id-t a telefon adja, igy offline is letrehozhato
    ownerUserId: user.id,
    // ceges felhasznalonal alapbol ceges; a kapcsoloval maganjarmu is lehet
    companyId: user.companyId && input.isCompanyVehicle ? user.companyId : null,
    make: input.make,
    model: input.model,
    year: input.year,
    vin: input.vin ?? null,
    licensePlate: input.licensePlate ?? null,
    engineType: input.engineType ?? null,
    fuelType: input.fuelType,
    currentMileage: input.currentMileage ?? 0,
    purchaseDate: null,
    createdAt: now,
    clientUpdatedAt: now,
    version: null,
    deletedAt: null,
    synced: 0,
  };
  await writeTransaction(async (db) => {
    await insertRow(db, row);
    await enqueue(db, {
      entity: 'Vehicle',
      entityId: row.id,
      op: 'UPSERT',
      baseVersion: null,
      clientUpdatedAt: now,
      payload: toPayload(row),
    });
  });
  return row.id;
}

export async function updateVehicle(id: string, input: VehicleInput): Promise<void> {
  const now = new Date().toISOString();
  await writeTransaction(async (db) => {
    const current = await db.getFirstAsync<VehicleRow>('SELECT * FROM vehicle WHERE id = ?', id);
    if (!current || current.deletedAt) {
      throw new Error('A jármű nem található.');
    }
    const row: VehicleRow = {
      ...current,
      make: input.make,
      model: input.model,
      year: input.year,
      vin: input.vin ?? null,
      licensePlate: input.licensePlate ?? null,
      engineType: input.engineType ?? null,
      fuelType: input.fuelType,
      currentMileage: input.currentMileage ?? current.currentMileage,
      clientUpdatedAt: now,
      synced: 0,
    };
    await db.runAsync(
      `UPDATE vehicle SET make = ?, model = ?, year = ?, vin = ?, licensePlate = ?, engineType = ?,
         fuelType = ?, currentMileage = ?, clientUpdatedAt = ?, synced = 0
       WHERE id = ?`,
      row.make,
      row.model,
      row.year,
      row.vin,
      row.licensePlate,
      row.engineType,
      row.fuelType,
      row.currentMileage,
      now,
      id,
    );
    await enqueue(db, {
      entity: 'Vehicle',
      entityId: id,
      op: 'UPSERT',
      baseVersion: current.version,
      clientUpdatedAt: now,
      payload: toPayload(row),
    });
  });
}

export async function deleteVehicle(id: string): Promise<void> {
  const now = new Date().toISOString();
  await writeTransaction(async (db) => {
    const current = await db.getFirstAsync<VehicleRow>('SELECT * FROM vehicle WHERE id = ?', id);
    if (!current) {
      return;
    }
    const result = await enqueue(db, {
      entity: 'Vehicle',
      entityId: id,
      op: 'DELETE',
      baseVersion: current.version,
      clientUpdatedAt: now,
      payload: null,
    });
    if (result === 'dropped') {
      // a szerver sosem tudott rola: helyben is vegleg torolheto
      await db.runAsync('DELETE FROM vehicle WHERE id = ?', id);
    } else {
      // tombstone: a torles is szinkronizalodik
      await db.runAsync(
        'UPDATE vehicle SET deletedAt = ?, clientUpdatedAt = ?, synced = 0 WHERE id = ?',
        now,
        now,
        id,
      );
    }
  });
}

// ---------- a szinkron hivja (mar nyitott tranzakcioban) ----------

// Szerver felol jott sor beirasa (pull, vagy REJECTED_STALE eseten a szerver valtozata).
// Ha a sornak van meg fel nem kuldott helyi valtozasa, a helyi marad: a kovetkezo push
// donti el a szerveren (LWW), igy a pull nem dobja el a felhasznalo munkajat.
export async function applyServerVehicle(db: SQLiteDatabase, server: ServerRow): Promise<void> {
  if (await hasEntryFor(db, 'Vehicle', server.id)) {
    return;
  }
  if (server.deletedAt || !server.data) {
    await db.runAsync(
      'UPDATE vehicle SET deletedAt = ?, version = ?, synced = 1 WHERE id = ?',
      server.deletedAt ?? new Date().toISOString(),
      server.version,
      server.id,
    );
    return;
  }
  const data = server.data as unknown as VehicleSyncData;
  await insertRow(db, {
    id: server.id,
    ownerUserId: data.ownerUserId,
    companyId: data.companyId,
    make: data.make,
    model: data.model,
    year: data.year,
    vin: data.vin,
    licensePlate: data.licensePlate,
    engineType: data.engineType,
    fuelType: data.fuelType,
    currentMileage: data.currentMileage,
    purchaseDate: data.purchaseDate,
    createdAt: data.createdAt,
    clientUpdatedAt: server.clientUpdatedAt ?? new Date().toISOString(),
    version: server.version,
    deletedAt: null,
    synced: 1,
  });
}

// Sikeres push utan: uj szerver verzio. Szinkronizalt csak akkor lesz, ha kozben
// nem jott ujabb helyi valtozas (annak mar uj outbox bejegyzese van).
export async function markVehicleSynced(
  db: SQLiteDatabase,
  id: string,
  version: number,
): Promise<void> {
  const pending = await hasEntryFor(db, 'Vehicle', id);
  await db.runAsync(
    'UPDATE vehicle SET version = ?, synced = ? WHERE id = ?',
    version,
    pending ? 0 : 1,
    id,
  );
}

// Teljes ujraszinkron elott (pl. cegvaltas): a szinkronizalt sorok torlodnek, a fel
// nem kuldott helyi valtozasok megmaradnak.
export async function clearSyncedVehicles(db: SQLiteDatabase): Promise<void> {
  await db.runAsync(
    "DELETE FROM vehicle WHERE id NOT IN (SELECT entityId FROM outbox WHERE entity = 'Vehicle')",
  );
}

async function insertRow(db: SQLiteDatabase, row: VehicleRow): Promise<void> {
  await db.runAsync(
    `INSERT INTO vehicle (id, ownerUserId, companyId, make, model, year, vin, licensePlate,
       engineType, fuelType, currentMileage, purchaseDate, createdAt, clientUpdatedAt, version,
       deletedAt, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       ownerUserId = excluded.ownerUserId, companyId = excluded.companyId,
       make = excluded.make, model = excluded.model, year = excluded.year, vin = excluded.vin,
       licensePlate = excluded.licensePlate, engineType = excluded.engineType,
       fuelType = excluded.fuelType, currentMileage = excluded.currentMileage,
       purchaseDate = excluded.purchaseDate, clientUpdatedAt = excluded.clientUpdatedAt,
       version = excluded.version, deletedAt = excluded.deletedAt, synced = excluded.synced`,
    row.id,
    row.ownerUserId,
    row.companyId,
    row.make,
    row.model,
    row.year,
    row.vin,
    row.licensePlate,
    row.engineType,
    row.fuelType,
    row.currentMileage,
    row.purchaseDate,
    row.createdAt,
    row.clientUpdatedAt,
    row.version,
    row.deletedAt,
    row.synced,
  );
}
