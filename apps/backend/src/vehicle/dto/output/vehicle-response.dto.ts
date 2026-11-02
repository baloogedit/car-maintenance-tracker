import {ApiProperty} from '@nestjs/swagger';

import {FuelType} from '../../../shared/enums/fuel-type.enum';

// A jarmu kifele mutathato adatai. A deletedAt nincs benne, mert torolt jarmu
// nem kerul a valaszba; a szinkronhoz szukseges mezok a /sync vegpontokon jonnek majd.
export class VehicleResponseDto {
  @ApiProperty({format: 'uuid'})
  id: string;

  @ApiProperty({format: 'uuid'})
  ownerUserId: string;

  @ApiProperty({type: String, format: 'uuid', nullable: true})
  companyId: string | null;

  @ApiProperty({example: 'Volkswagen'})
  make: string;

  @ApiProperty({example: 'Golf'})
  model: string;

  @ApiProperty({example: 2016})
  year: number;

  @ApiProperty({type: String, nullable: true, example: 'WVWZZZAUZGW000001'})
  vin: string | null;

  @ApiProperty({type: String, nullable: true, example: 'B-123-ABC'})
  licensePlate: string | null;

  @ApiProperty({type: String, nullable: true, example: '1.6 TDI'})
  engineType: string | null;

  @ApiProperty({enum: FuelType})
  fuelType: string;

  @ApiProperty({example: 182000})
  currentMileage: number;

  @ApiProperty({type: Date, nullable: true})
  purchaseDate: Date | null;

  @ApiProperty()
  clientUpdatedAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
