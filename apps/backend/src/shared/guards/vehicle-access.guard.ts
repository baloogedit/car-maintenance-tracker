import {CanActivate, ExecutionContext, Injectable} from '@nestjs/common';

import {AuthenticatedRequest} from '../interfaces/authenticated-request.interface';
import {AccessService} from '../modules/access/access.service';

// Minden ":vehicleId" parameteres utvonalra: ha a jarmu nem lathato a
// felhasznalonak, 404; kulonben a jarmuvet a request.vehicle-re teszi, igy a
// controller/service nem kerdezi le ujra. A kesobbi beagyazott utvonalak
// (/vehicles/:vehicleId/fuel-logs stb.) is ezt hasznaljak.
@Injectable()
export class VehicleAccessGuard implements CanActivate {
  constructor(private readonly access: AccessService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const vehicleId = request.params.vehicleId;
    if (typeof vehicleId !== 'string') return true;
    request.vehicle = await this.access.getVisibleVehicle(request.user, vehicleId);
    return true;
  }
}
