import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {Type} from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  LICENSE_PLATE_MAX_LENGTH,
  VEHICLE_MAX_YEAR,
  VEHICLE_MIN_YEAR,
  VEHICLE_TEXT_MAX_LENGTH,
  VIN_LENGTH,
} from '../../../shared/constants/vehicle.constants';
import {FuelType} from '../../../shared/enums/fuel-type.enum';

export class CreateVehicleDto {
  @ApiPropertyOptional({
    description:
      'Offline letrehozasnal a mobil app altal generalt UUID; ha nincs, a szerver general',
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({example: 'Volkswagen'})
  @IsString()
  @IsNotEmpty()
  @MaxLength(VEHICLE_TEXT_MAX_LENGTH)
  make: string;

  @ApiProperty({example: 'Golf'})
  @IsString()
  @IsNotEmpty()
  @MaxLength(VEHICLE_TEXT_MAX_LENGTH)
  model: string;

  @ApiProperty({example: 2016})
  @IsInt()
  @Min(VEHICLE_MIN_YEAR)
  @Max(VEHICLE_MAX_YEAR)
  year: number;

  @ApiPropertyOptional({example: 'WVWZZZAUZGW000001'})
  @IsOptional()
  @IsString()
  @Length(VIN_LENGTH, VIN_LENGTH)
  vin?: string;

  @ApiPropertyOptional({example: 'B-123-ABC'})
  @IsOptional()
  @IsString()
  @MaxLength(LICENSE_PLATE_MAX_LENGTH)
  licensePlate?: string;

  @ApiPropertyOptional({example: '1.6 TDI'})
  @IsOptional()
  @IsString()
  @MaxLength(VEHICLE_TEXT_MAX_LENGTH)
  engineType?: string;

  @ApiPropertyOptional({enum: FuelType, default: FuelType.GASOLINE})
  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

  @ApiPropertyOptional({example: 182000})
  @IsOptional()
  @IsInt()
  @Min(0)
  currentMileage?: number;

  @ApiPropertyOptional({example: '2019-05-10'})
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  purchaseDate?: Date;

  @ApiPropertyOptional({
    description:
      'Csak ceges felhasznalonal szamit: true (alapertelmezes) = ceges jarmu, ' +
      'false = sajat maganjarmu, amit a ceg nem lat.',
  })
  @IsOptional()
  @IsBoolean()
  isCompanyVehicle?: boolean;
}
