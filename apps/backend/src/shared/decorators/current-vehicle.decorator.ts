import {createParamDecorator, ExecutionContext} from '@nestjs/common';
import {Vehicle} from '@prisma/client';

import {AuthenticatedRequest} from '../interfaces/authenticated-request.interface';

// A VehicleAccessGuard altal mar betoltott (es jogosultsag-ellenorzott) jarmu.
// Csak olyan vegponton hasznalhato, amelyen a VehicleAccessGuard is fut.
export const CurrentVehicle = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Vehicle =>
    ctx.switchToHttp().getRequest<AuthenticatedRequest>().vehicle!,
);
