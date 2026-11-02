import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {IsNotEmpty, IsOptional, IsString, MaxLength} from 'class-validator';

import {DEVICE_ID_MAX_LENGTH} from '../../../shared/constants/auth.constants';
import {
  COMPANY_NAME_MAX_LENGTH,
  TAX_ID_MAX_LENGTH,
} from '../../../shared/constants/company.constants';

export class CreateCompanyDto {
  @ApiProperty({example: 'Gyors Futar Bt.'})
  @IsString()
  @IsNotEmpty()
  @MaxLength(COMPANY_NAME_MAX_LENGTH)
  name: string;

  @ApiPropertyOptional({example: 'RO12345678'})
  @IsOptional()
  @IsString()
  @MaxLength(TAX_ID_MAX_LENGTH)
  taxId?: string;

  @ApiPropertyOptional({description: 'Az eszkoz azonositoja (az uj refresh tokenhez)'})
  @IsOptional()
  @IsString()
  @MaxLength(DEVICE_ID_MAX_LENGTH)
  deviceId?: string;
}
