import {ApiProperty} from '@nestjs/swagger';

import {SyncChangesDto} from './sync-changes.dto';

export class SyncPullResponseDto {
  @ApiProperty({type: SyncChangesDto})
  changes: SyncChangesDto;

  @ApiProperty({description: 'A kovetkezo pull since erteke'})
  cursor: number;

  @ApiProperty({description: 'true: azonnal ujra kell hivni a cursor-ral'})
  hasMore: boolean;

  @ApiProperty({
    description: 'true: a helyi adat eldobando (a fuggo valtozasok kivetelevel), since=0',
  })
  resetRequired: boolean;

  @ApiProperty({description: 'A kovetkezo pull scope parametere'})
  scope: string;

  @ApiProperty()
  serverNow: Date;
}
