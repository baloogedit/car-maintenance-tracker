import {Injectable, UnauthorizedException} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import {BCRYPT_SALT_ROUNDS} from '../shared/constants/auth.constants';
import {UserRole} from '../shared/enums/user-role.enum';
import {PrismaService} from '../shared/modules/db/prisma.service';
import {LoginDto} from './dto/input/login.dto';
import {RegisterDto} from './dto/input/register.dto';
import {AuthResponseDto} from './dto/output/auth-response.dto';
import {AuthTokensDto} from './dto/output/auth-tokens.dto';
import {UserResponseDto} from './dto/output/user-response.dto';
import {toUserResponse} from './mapper/user.mapper';
import {TokenService} from './token/token.service';

// A felhasznalo azonositasa (regisztracio, belepes, profil). A tokenekkel
// kapcsolatos munkat a TokenService vegzi.
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  // Regisztracio mindig maganszemelykent; cegbe lepes kesobb, kulon vegponton.
  // Foglalt e-mail eseten a PrismaExceptionFilter 409-et ad (P2002).
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash: await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS),
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: UserRole.PRIVATE,
      },
    });
    return {user: toUserResponse(user), ...(await this.tokens.issue(user, dto.deviceId))};
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({where: {email: dto.email.toLowerCase()}});
    // ugyanaz a hiba rossz e-mailre es rossz jelszora, hogy ne lehessen e-mail cimeket kitalalni
    if (!user || user.isDeleted || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Hibas e-mail cim vagy jelszo.');
    }
    return {user: toUserResponse(user), ...(await this.tokens.issue(user, dto.deviceId))};
  }

  refresh(refreshToken: string): Promise<AuthTokensDto> {
    return this.tokens.rotate(refreshToken);
  }

  logout(refreshToken: string): Promise<void> {
    return this.tokens.revoke(refreshToken);
  }

  async me(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({where: {id: userId}});
    if (!user || user.isDeleted) {
      throw new UnauthorizedException();
    }
    return toUserResponse(user);
  }
}
