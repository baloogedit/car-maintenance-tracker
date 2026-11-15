import {OmitType} from '@nestjs/swagger';

import {CreateVehicleDto} from '../../../vehicle/dto/input/create-vehicle.dto';

// A Vehicle UPSERT mutation data mezoje: ugyanazok a mezok es szabalyok, mint a
// REST letrehozasnal (az id a mutation szintjen jon). Az UPSERT a teljes sort
// kuldi: a hianyzo opcionalis mezo null (vagy az alapertelmezes) lesz.
// Az isCompanyVehicle csak beszurasnal szamit, kesobb nem modosithato.
export class VehicleSyncDataDto extends OmitType(CreateVehicleDto, ['id'] as const) {}
