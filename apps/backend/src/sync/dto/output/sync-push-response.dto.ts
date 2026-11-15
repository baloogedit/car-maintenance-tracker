import {ApiProperty} from '@nestjs/swagger';

import {SyncMutationResultDto} from './sync-mutation-result.dto';

export class SyncPushResponseDto {
  @ApiProperty()
  serverNow: Date;

  @ApiProperty({type: [SyncMutationResultDto], description: 'Mutationonkent egy eredmeny'})
  results: SyncMutationResultDto[];
}
