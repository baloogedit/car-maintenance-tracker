import {CanActivate, ExecutionContext, Injectable, UnauthorizedException} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {JwtService} from '@nestjs/jwt';

import {IS_PUBLIC_KEY} from '../constants/public-route.constants';
import {UserRole} from '../enums/user-role.enum';
import {AuthenticatedRequest} from '../interfaces/authenticated-request.interface';
import {JwtPayload} from '../interfaces/jwt-payload.interface';
import {PrismaService} from '../modules/db/prisma.service';

// Globalis guard (APP_GUARD): az "Authorization: Bearer <access token>" fejlecet
// ellenorzi. A @Public() vegpontokat atengedi.
//
// A szerepkort es a ceget NEM a tokenbol veszi, hanem az adatbazisbol: igy a cegbol kilepett
// vagy eltavolitott felhasznalo a meg ervenyes (legfeljebb 30 perces)
// access tokenjevel sem latja tovabb a ceg adatait, es a torolt felhasznalo azonnal kizarodik.
// Ez keresenkent egy rovid lekerdezes.
@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException();
    }
    const user = await this.prisma.user.findUnique({
      where: {id: payload.sub},
      select: {id: true, role: true, companyId: true, isDeleted: true},
    });
    if (!user || user.isDeleted) {
      throw new UnauthorizedException();
    }
    request.user = {sub: user.id, role: user.role as UserRole, companyId: user.companyId};
    return true;
  }
}

function extractBearerToken(request: AuthenticatedRequest): string | undefined {
  const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
  return scheme === 'Bearer' && token ? token : undefined;
}
