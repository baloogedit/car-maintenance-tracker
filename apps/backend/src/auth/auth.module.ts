import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {APP_GUARD} from '@nestjs/core';
import {JwtModule} from '@nestjs/jwt';

import {type AuthConfig, authConfig} from '../shared/config/auth.config';
import {JwtGuard} from '../shared/guards/jwt.guard';
import {AuthController} from './auth.controller';
import {AuthService} from './auth.service';
import {TokenService} from './token/token.service';

@Module({
  imports: [
    ConfigModule.forFeature(authConfig),
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(authConfig)],
      inject: [authConfig.KEY],
      useFactory: (config: AuthConfig) => ({secret: config.accessSecret}),
    }),
  ],
  controllers: [AuthController],
  // APP_GUARD: a JwtGuard minden vegpontra ervenyes, kiveve a @Public()-kat.
  providers: [AuthService, TokenService, {provide: APP_GUARD, useClass: JwtGuard}],
  // a company modul is ad ki tokent (szerepkor valtozasakor)
  exports: [TokenService],
})
export class AuthModule {}
