import {Injectable} from '@nestjs/common';
import {Prisma} from '@prisma/client';

import {FuelType} from '../../../shared/enums/fuel-type.enum';
import {SyncEntity} from '../../../shared/enums/sync-entity.enum';
import {SyncErrorCode} from '../../../shared/enums/sync-error-code.enum';
import {JwtPayload} from '../../../shared/interfaces/jwt-payload.interface';
import {
  canEditVehicle,
  canSeeVehicle,
  isNewVehicleForCompany,
  visibleVehiclesSql,
} from '../../../shared/policies/vehicle-access.policy';
import {validateDto} from '../../../shared/utils/validate-dto.util';
import {VehicleDeletionService} from '../../../vehicle/deletion/vehicle-deletion.service';
import {VehicleSyncDataDto} from '../../dto/input/vehicle-sync-data.dto';
import {SyncChangeDto} from '../../dto/output/sync-change.dto';
import {toVehicleSyncChange} from '../../mapper/vehicle-sync.mapper';
import {
  ExistingSyncRow,
  SyncDb,
  SyncEntityHandler,
  SyncInsertRejection,
  SyncPulledRow,
  SyncPullRange,
  SyncWriteContext,
} from '../sync-entity-handler.interface';
import {VehicleSyncRow} from './vehicle-sync-row.interface';

// A Vehicle tabla oszlopai a nyers lekerdezesekhez (alias: v). A rowversion
// binary(8); bigint-te alakitva novekvo szamkent olvashato.
const VEHICLE_COLUMNS = Prisma.sql`
  v.id, v.ownerUserId, v.companyId, v.make, v.model, v.year, v.vin, v.licensePlate,
  v.engineType, v.fuelType, v.currentMileage, v.purchaseDate, v.clientUpdatedAt,
  v.deletedAt, v.lastModifiedByDeviceId, v.created_at AS createdAt,
  CAST(v.version AS bigint) AS version`;

@Injectable()
export class VehicleSyncHandler implements SyncEntityHandler<VehicleSyncDataDto> {
  readonly entity = SyncEntity.Vehicle;

  constructor(private readonly deletion: VehicleDeletionService) {}

  parseData(data: Record<string, unknown>) {
    return validateDto(VehicleSyncDataDto, data);
  }

  async findExisting(db: SyncDb, user: JwtPayload, id: string): Promise<ExistingSyncRow | null> {
    const row = await this.findRow(db, id);
    if (!row) return null;
    let denied: ExistingSyncRow['denied'] = null;
    if (!canSeeVehicle(user, row)) denied = SyncErrorCode.NOT_FOUND;
    else if (!canEditVehicle(user, row)) denied = SyncErrorCode.FORBIDDEN;
    return {
      version: row.version,
      clientUpdatedAt: row.clientUpdatedAt,
      lastModifiedByDeviceId: row.lastModifiedByDeviceId,
      deletedAt: row.deletedAt,
      denied,
    };
  }

  // Uj jarmuvet barki felvehet (a sajatjakent), ezert nincs mit ellenorizni.
  checkInsert(): Promise<SyncInsertRejection | null> {
    return Promise.resolve(null);
  }

  async insert(db: SyncDb, ctx: SyncWriteContext, id: string, data: VehicleSyncDataDto) {
    await db.vehicle.create({
      data: {
        id,
        ...toVehicleFields(data),
        ownerUserId: ctx.user.sub,
        companyId: isNewVehicleForCompany(ctx.user, data.isCompanyVehicle)
          ? ctx.user.companyId
          : null,
        clientUpdatedAt: ctx.effectiveUpdatedAt,
        lastModifiedByDeviceId: ctx.deviceId,
      },
    });
  }

  // A tulajdonos es a ceg nem modosithato szinkronnal (az isCompanyVehicle itt nem szamit).
  async update(db: SyncDb, ctx: SyncWriteContext, id: string, data: VehicleSyncDataDto) {
    await db.vehicle.update({
      where: {id},
      data: {
        ...toVehicleFields(data),
        clientUpdatedAt: ctx.effectiveUpdatedAt,
        lastModifiedByDeviceId: ctx.deviceId,
      },
    });
  }

  // Ugyanaz a kaszkados soft delete, mint a REST DELETE-nel, de a push tranzakciojaban.
  async softDelete(db: SyncDb, ctx: SyncWriteContext, id: string) {
    await this.deletion.softDeleteWithEntries(id, {
      tx: db,
      at: ctx.effectiveUpdatedAt,
      deviceId: ctx.deviceId,
    });
  }

  async findChange(db: SyncDb, id: string): Promise<SyncChangeDto | null> {
    const row = await this.findRow(db, id);
    return row ? toVehicleSyncChange(row) : null;
  }

  async pull(db: SyncDb, user: JwtPayload, range: SyncPullRange): Promise<SyncPulledRow[]> {
    // A bigint -> binary(8) alakitas big-endian, ezert a rowversion-nel helyesen
    // osszehasonlithato, es a (ownerUserId, version) index hasznalhato.
    const rows = await db.$queryRaw<VehicleSyncRow[]>`
      SELECT TOP (${range.take}) ${VEHICLE_COLUMNS}
      FROM [dbo].[Vehicle] v
      WHERE v.version > CAST(${range.since} AS binary(8))
        AND v.version < CAST(${range.upper} AS binary(8))
        AND ${visibleVehiclesSql(user)}
      ORDER BY v.version`;
    return rows.map((row) => ({
      entity: this.entity,
      version: row.version,
      change: toVehicleSyncChange(row),
    }));
  }

  private async findRow(db: SyncDb, id: string): Promise<VehicleSyncRow | null> {
    const rows = await db.$queryRaw<VehicleSyncRow[]>`
      SELECT ${VEHICLE_COLUMNS} FROM [dbo].[Vehicle] v WHERE v.id = ${id}`;
    return rows[0] ?? null;
  }
}

// Az UPSERT a teljes sort kuldi: a hianyzo opcionalis mezo null / alapertelmezes.
function toVehicleFields(data: VehicleSyncDataDto) {
  return {
    make: data.make,
    model: data.model,
    year: data.year,
    vin: data.vin ?? null,
    licensePlate: data.licensePlate ?? null,
    engineType: data.engineType ?? null,
    fuelType: data.fuelType ?? FuelType.GASOLINE,
    currentMileage: data.currentMileage ?? 0,
    purchaseDate: data.purchaseDate ?? null,
  };
}
