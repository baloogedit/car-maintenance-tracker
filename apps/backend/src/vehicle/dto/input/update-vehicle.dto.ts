import {OmitType, PartialType} from '@nestjs/swagger';

import {CreateVehicleDto} from './create-vehicle.dto';

// Modositasnal minden mezo opcionalis; az id nem modosithato (a whitelist eldobja).
export class UpdateVehicleDto extends PartialType(OmitType(CreateVehicleDto, ['id'] as const)) {}
