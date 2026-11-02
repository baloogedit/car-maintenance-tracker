import {CanActivate, ExecutionContext, ForbiddenException, Injectable} from '@nestjs/common';
import {Reflector} from '@nestjs/core';

import {ROLES_KEY} from '../constants/roles.constants';
import {UserRole} from '../enums/user-role.enum';
import {AuthenticatedRequest} from '../interfaces/authenticated-request.interface';

// A @Roles(...) dekoratorral megjelolt utvonalakon ellenorzi, hogy a belepett
// felhasznalo szerepkore szerepel-e a listaban. Ha nem, 403.
// A JwtGuard utan fut, ezert a request.user mar ki van toltve.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) return true;

    const {user} = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!roles.includes(user.role)) {
      throw new ForbiddenException('Ehhez a muvelethez nincs jogosultsagod.');
    }
    return true;
  }
}
