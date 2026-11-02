import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength} from 'class-validator';

import {DEVICE_ID_MAX_LENGTH} from '../../../shared/constants/auth.constants';

export class LoginDto {
  @ApiProperty({example: 'magan@teszt.hu'})
  @IsEmail()
  email: string;

  @ApiProperty({example: 'Teszt1234!'})
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({description: 'Az eszkoz azonositoja (a mobil app generalja)'})
  @IsOptional()
  @IsString()
  @MaxLength(DEVICE_ID_MAX_LENGTH)
  deviceId?: string;
}
