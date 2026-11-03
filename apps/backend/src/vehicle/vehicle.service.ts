import {Injectable} from '@nestjs/common';
import {Vehicle} from '@prisma/client';

import {JwtPayload} from '../shared/interfaces/jwt-payload.interface';
import {AccessService} from '../shared/modules/access/access.service';
import {PrismaService} from '../shared/modules/db/prisma.service';
import {
  isNewVehicleForCompany,
  visibleVehiclesWhere,
} from '../shared/policies/vehicle-access.policy';
import {VehicleDeletionService} from './deletion/vehicle-deletion.service';
import {CreateVehicleDto} from './dto/input/create-vehicle.dto';
import {UpdateVehicleDto} from './dto/input/update-vehicle.dto';
import {VehicleResponseDto} from './dto/output/vehicle-response.dto';
import {toVehicleResponse} from './mapper/vehicle.mapper';

@Injectable()
export class VehicleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly deletion: VehicleDeletionService,
  ) {}

  async findAll(user: JwtPayload): Promise<VehicleResponseDto[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: visibleVehiclesWhere(user),
      orderBy: [{make: 'asc'}, {model: 'asc'}],
    });
    return vehicles.map(toVehicleResponse);
  }

  findOne(vehicle: Vehicle): VehicleResponseDto {
    return toVehicleResponse(vehicle);
  }

  /// Ceges felhasznalo jarmuve alapbol a cegehez tartozik (igy a ceg tobbi tagja
  // is latja), de kerheti, hogy sajat maganjarmu legyen (isCompanyVehicle: false).
  async create(user: JwtPayload, dto: CreateVehicleDto): Promise<VehicleResponseDto> {
    const {isCompanyVehicle, ...data} = dto;
    const vehicle = await this.prisma.vehicle.create({
      data: {
        ...data,
        ownerUserId: user.sub,
        companyId: isNewVehicleForCompany(user, isCompanyVehicle) ? user.companyId : null,
        clientUpdatedAt: new Date(),
      },
    });
    return toVehicleResponse(vehicle);
  }

  async update(
    user: JwtPayload,
    vehicle: Vehicle,
    dto: UpdateVehicleDto,
  ): Promise<VehicleResponseDto> {
    this.access.assertCanEditVehicle(user, vehicle);
    const updated = await this.prisma.vehicle.update({
      where: {id: vehicle.id},
      data: {...dto, clientUpdatedAt: new Date()},
    });
    return toVehicleResponse(updated);
  }

  async remove(user: JwtPayload, vehicle: Vehicle): Promise<void> {
    this.access.assertCanEditVehicle(user, vehicle);
    await this.deletion.softDeleteWithEntries(vehicle.id);
  }
}
