import {Vehicle} from '@prisma/client';
import {Request} from 'express';

import {JwtPayload} from './jwt-payload.interface';

// A guardok altal kiegeszitett Express keres:
//   user    - a JwtGuard teszi ra (minden vedett vegponton)
//   vehicle - a VehicleAccessGuard teszi ra (csak a :vehicleId utvonalakon)
export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
  vehicle?: Vehicle;
}
