import {OmitType, PartialType} from '@nestjs/swagger';

import {CreateVehicleDto} from './create-vehicle.dto';

// Modositasnal minden mezo opcionalis. Az id es az, hogy a jarmu ceges-e, nem
// modosithato (a whitelist eldobja).
export class UpdateVehicleDto extends PartialType(
  OmitType(CreateVehicleDto, ['id', 'isCompanyVehicle'] as const),
) {}
