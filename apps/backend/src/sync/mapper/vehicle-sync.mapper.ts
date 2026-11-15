import {SyncChangeDto} from '../dto/output/sync-change.dto';
import {VehicleSyncRow} from '../handlers/vehicle/vehicle-sync-row.interface';

// Vehicle sor -> pull valtozas. Tombstone-nal csak az azonosito mezok mennek
// (a torolt jarmu adatait a kliens ugyis eldobja).
export function toVehicleSyncChange(row: VehicleSyncRow): SyncChangeDto {
  const change: SyncChangeDto = {
    id: row.id,
    version: Number(row.version),
    clientUpdatedAt: row.clientUpdatedAt,
    deletedAt: row.deletedAt,
  };
  if (row.deletedAt) return change;
  change.data = {
    ownerUserId: row.ownerUserId,
    companyId: row.companyId,
    make: row.make,
    model: row.model,
    year: row.year,
    vin: row.vin,
    licensePlate: row.licensePlate,
    engineType: row.engineType,
    fuelType: row.fuelType,
    currentMileage: row.currentMileage,
    purchaseDate: row.purchaseDate,
    createdAt: row.createdAt,
  };
  return change;
}
