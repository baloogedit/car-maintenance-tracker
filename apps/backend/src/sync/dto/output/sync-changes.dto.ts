import {ApiProperty} from '@nestjs/swagger';

import {SyncChangeDto} from './sync-change.dto';

// A pull valasz changes mezoje: tablankent a valtozott sorok, version szerint
// novekvo sorrendben. Minden szinkronizalt tabla kulcsa mindig szerepel (ures
// tombbel is). Bovitesnel: FuelLog: SyncChangeDto[] stb.
export class SyncChangesDto {
  @ApiProperty({type: [SyncChangeDto]})
  Vehicle: SyncChangeDto[];
}
