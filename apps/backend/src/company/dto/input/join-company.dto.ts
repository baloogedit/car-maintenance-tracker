import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {Transform} from 'class-transformer';
import {IsNotEmpty, IsOptional, IsString, MaxLength} from 'class-validator';

import {DEVICE_ID_MAX_LENGTH} from '../../../shared/constants/auth.constants';
import {JOIN_CODE_MAX_LENGTH} from '../../../shared/constants/company.constants';

export class JoinCompanyDto {
  @ApiProperty({example: 'K7QM4XTP', description: 'A ceg adminjatol kapott csatlakozasi kod'})
  // a bemasolt kod elejen/vegen gyakran van szokoz
  @Transform(({value}: {value: unknown}) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(JOIN_CODE_MAX_LENGTH)
  joinCode: string;

  @ApiPropertyOptional({description: 'Az eszkoz azonositoja (az uj refresh tokenhez)'})
  @IsOptional()
  @IsString()
  @MaxLength(DEVICE_ID_MAX_LENGTH)
  deviceId?: string;
}
