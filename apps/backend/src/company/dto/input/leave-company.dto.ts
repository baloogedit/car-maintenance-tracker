import {ApiPropertyOptional} from '@nestjs/swagger';
import {IsOptional, IsString, MaxLength} from 'class-validator';

import {DEVICE_ID_MAX_LENGTH} from '../../../shared/constants/auth.constants';

export class LeaveCompanyDto {
  @ApiPropertyOptional({description: 'Az eszkoz azonositoja (az uj refresh tokenhez)'})
  @IsOptional()
  @IsString()
  @MaxLength(DEVICE_ID_MAX_LENGTH)
  deviceId?: string;
}
