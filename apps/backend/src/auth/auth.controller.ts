import {Body, Controller, Get, HttpCode, HttpStatus, Post} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import {CurrentUser} from '../shared/decorators/current-user.decorator';
import {Public} from '../shared/decorators/public.decorator';
import type {JwtPayload} from '../shared/interfaces/jwt-payload.interface';
import {AuthService} from './auth.service';
import {LoginDto} from './dto/input/login.dto';
import {RefreshTokenDto} from './dto/input/refresh-token.dto';
import {RegisterDto} from './dto/input/register.dto';
import {AuthResponseDto} from './dto/output/auth-response.dto';
import {AuthTokensDto} from './dto/output/auth-tokens.dto';
import {UserResponseDto} from './dto/output/user-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @ApiCreatedResponse({type: AuthResponseDto})
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @ApiOkResponse({type: AuthResponseDto})
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Post('refresh')
  @ApiOkResponse({type: AuthTokensDto})
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  // Lejart access tokennel is ki lehessen lepni, ezert publikus: a refresh token azonosit.
  @Public()
  @Post('logout')
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Body() dto: RefreshTokenDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOkResponse({type: UserResponseDto})
  me(@CurrentUser() user: JwtPayload) {
    return this.auth.me(user.sub);
  }
}
