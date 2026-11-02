import {CanActivate, ExecutionContext, Injectable, UnauthorizedException} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {JwtService} from '@nestjs/jwt';

import {IS_PUBLIC_KEY} from '../constants/public-route.constants';
import {AuthenticatedRequest} from '../interfaces/authenticated-request.interface';
import {JwtPayload} from '../interfaces/jwt-payload.interface';

// Globalis guard (APP_GUARD): az "Authorization: Bearer <access token>" fejlecet
// ellenorzi, es a payload-ot a request.user-re teszi. A @Public() vegpontokat atengedi.
@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
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
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      request.user = {sub: payload.sub, role: payload.role, companyId: payload.companyId};
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}

function extractBearerToken(request: AuthenticatedRequest): string | undefined {
  const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
  return scheme === 'Bearer' && token ? token : undefined;
}
