import {ApiProperty} from '@nestjs/swagger';

import {AuthTokensDto} from './auth-tokens.dto';
import {UserResponseDto} from './user-response.dto';

// A regisztracio es a belepes valasza: a profil es a tokenek egyutt.
export class AuthResponseDto extends AuthTokensDto {
  @ApiProperty({type: UserResponseDto})
  user: UserResponseDto;
}
