import {createParamDecorator, ExecutionContext} from '@nestjs/common';

import {AuthenticatedRequest} from '../interfaces/authenticated-request.interface';
import {JwtPayload} from '../interfaces/jwt-payload.interface';

// A belepett felhasznalo (a JwtGuard tette a keresre).
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload =>
    ctx.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
