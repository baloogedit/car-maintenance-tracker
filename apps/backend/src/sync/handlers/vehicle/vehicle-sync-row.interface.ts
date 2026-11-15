// A Vehicle sor a nyers SQL lekerdezesbol ($queryRaw): a version-t a Prisma
// Client nem olvassa (Unsupported tipus), ezert CAST(version AS bigint)-kent jon.
export interface VehicleSyncRow {
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
  purchaseDate: Date | null;
  clientUpdatedAt: Date;
  deletedAt: Date | null;
  lastModifiedByDeviceId: string | null;
  createdAt: Date;
  version: bigint;
}
