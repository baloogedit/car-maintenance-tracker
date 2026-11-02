import {Vehicle} from '@prisma/client';

import {VehicleResponseDto} from '../dto/output/vehicle-response.dto';

// Prisma Vehicle -> valasz. Csak azt adjuk ki, ami a VehicleResponseDto-ban szerepel,
// igy egy uj (belso) oszlop nem kerul veletlenul a valaszba.
export function toVehicleResponse(vehicle: Vehicle): VehicleResponseDto {
  return {
    id: vehicle.id,
    ownerUserId: vehicle.ownerUserId,
    companyId: vehicle.companyId,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    vin: vehicle.vin,
    licensePlate: vehicle.licensePlate,
    engineType: vehicle.engineType,
    fuelType: vehicle.fuelType,
    currentMileage: vehicle.currentMileage,
    purchaseDate: vehicle.purchaseDate,
    clientUpdatedAt: vehicle.clientUpdatedAt,
    createdAt: vehicle.createdAt,
    updatedAt: vehicle.updatedAt,
  };
}
