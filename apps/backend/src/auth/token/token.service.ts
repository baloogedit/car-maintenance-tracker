import {Inject, Injectable, UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {User} from '@prisma/client';
import {randomBytes} from 'crypto';

import {type AuthConfig, authConfig} from '../../shared/config/auth.config';
import {REFRESH_TOKEN_BYTES} from '../../shared/constants/auth.constants';
import {UserRole} from '../../shared/enums/user-role.enum';
import {JwtPayload} from '../../shared/interfaces/jwt-payload.interface';
import {PrismaService} from '../../shared/modules/db/prisma.service';
import {sha256} from '../../shared/utils/hash.util';
import {AuthTokensDto} from '../dto/output/auth-tokens.dto';

// A tokenek kiadasa, frissitese (rotacio) es visszavonasa.
//
// Access token: rovid eletu JWT, a payload az JwtPayload.
// Refresh token: veletlen, atlatszatlan string (nem JWT); az adatbazisba csak a
// SHA-256 hash-e kerul.
@Injectable()
export class TokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    @Inject(authConfig.KEY) private readonly config: AuthConfig,
  ) {}

  async issue(user: User, deviceId?: string): Promise<AuthTokensDto> {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role as UserRole,
      companyId: user.companyId,
    };
    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: this.config.accessTtlSeconds,
    });
    const refreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(refreshToken),
        deviceId,
        expiresAt: new Date(Date.now() + this.config.refreshTtlSeconds * 1000),
      },
    });
    return {accessToken, refreshToken, accessExpiresIn: this.config.accessTtlSeconds};
  }

  // Rotacio: a regi token visszavonva, ugyanarra az eszkozre uj token jon letre.
  // Ha egy mar visszavont tokent kuldenek ujra, az lopasra utal: a felhasznalo
  // osszes refresh tokenje visszavonodik, es ujra be kell lepnie.
  async rotate(refreshToken: string): Promise<AuthTokensDto> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: {tokenHash: sha256(refreshToken)},
      include: {user: true},
    });
    if (!stored || stored.user.isDeleted) {
      throw new UnauthorizedException();
    }
    if (stored.revoked) {
      await this.revokeAllForUser(stored.userId);
      throw new UnauthorizedException('A munkamenet ervenytelen, jelentkezz be ujra.');
    }
    if (stored.expiresAt <= new Date()) {
      throw new UnauthorizedException();
    }
    // Feltetelesen vonjuk vissza: ha ket keres egyszerre frissit ugyanazzal a
    // tokennel, csak az egyik nyer, a masik ujrafelhasznalasnak szamit.
    const {count} = await this.prisma.refreshToken.updateMany({
      where: {id: stored.id, revoked: false},
      data: {revoked: true},
    });
    if (count === 0) {
      throw new UnauthorizedException();
    }
    return this.issue(stored.user, stored.deviceId ?? undefined);
  }

  // Csak ezt az egy tokent vonja vissza (a tobbi eszkoz bent marad).
  async revoke(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {tokenHash: sha256(refreshToken), revoked: false},
      data: {revoked: true},
    });
  }

  private async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {userId, revoked: false},
      data: {revoked: true},
    });
  }
}
