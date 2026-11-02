import {ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import {Vehicle} from '@prisma/client';

import {JwtPayload} from '../../interfaces/jwt-payload.interface';
import {
  AuthoredEntry,
  canEditEntry,
  canEditVehicle,
  VehicleOwnership,
  visibleVehiclesWhere,
} from '../../policies/vehicle-access.policy';
import {PrismaService} from '../db/prisma.service';

// A szabalyok (policies/) alkalmazasa: adatbazisbol betolt, es szabalysertesnel
// HTTP hibat dob. Nem lathato jarmure 404 (nem 403), hogy ne deruljon ki, hogy letezik.
@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  async getVisibleVehicle(user: JwtPayload, vehicleId: string): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {AND: [{id: vehicleId}, visibleVehiclesWhere(user)]},
    });
    if (!vehicle) {
      throw new NotFoundException('A jarmu nem talalhato.');
    }
    return vehicle;
  }

  assertCanEditVehicle(user: JwtPayload, vehicle: VehicleOwnership): void {
    if (!canEditVehicle(user, vehicle)) {
      throw new ForbiddenException('Ezt a jarmuvet nem modosithatod.');
    }
  }

  assertCanEditEntry(user: JwtPayload, vehicle: VehicleOwnership, entry: AuthoredEntry): void {
    if (!canEditEntry(user, vehicle, entry)) {
      throw new ForbiddenException('Csak a sajat bejegyzeseidet modosithatod.');
    }
  }
}
