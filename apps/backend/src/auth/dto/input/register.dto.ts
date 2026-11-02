import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength} from 'class-validator';

import {
  DEVICE_ID_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '../../../shared/constants/auth.constants';

export class RegisterDto {
  @ApiProperty({example: 'uj.felhasznalo@teszt.hu'})
  @IsEmail()
  email: string;

  @ApiProperty({example: 'Teszt1234!', minLength: PASSWORD_MIN_LENGTH})
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  password: string;

  @ApiProperty({example: 'Anna'})
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiPropertyOptional({example: 'Kiss'})
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({description: 'Az eszkoz azonositoja (a mobil app generalja)'})
  @IsOptional()
  @IsString()
  @MaxLength(DEVICE_ID_MAX_LENGTH)
  deviceId?: string;
}
