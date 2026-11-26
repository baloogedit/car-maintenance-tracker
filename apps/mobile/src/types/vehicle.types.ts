export type FuelType = 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'LPG';

// Egy jarmu, ahogy a kepernyok latjak (a helyi SQLite-bol).
export interface Vehicle {
  id: string;
  ownerUserId: string;
  companyId: string | null;
  make: string;
  model: string;
  year: number;
  vin: string | null;
  licensePlate: string | null;
  engineType: string | null;
  fuelType: FuelType;
  currentMileage: number;
  purchaseDate: string | null;
  createdAt: string;
  clientUpdatedAt: string;
  version: number | null; // null = meg sosem jart a szerveren
  synced: boolean; // false = van fel nem kuldott valtozasa
}

// Az urlap kimenete (a VehicleSchema alakitja at).
export interface VehicleInput {
  make: string;
  model: string;
  year: number;
  vin?: string;
  licensePlate?: string;
  engineType?: string;
  fuelType: FuelType;
  currentMileage?: number;
  isCompanyVehicle: boolean; // csak uj jarmunel es ceges felhasznalonal szamit
}
