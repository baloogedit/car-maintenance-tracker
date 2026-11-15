import {ApiProperty} from '@nestjs/swagger';

import {SyncErrorCode} from '../../../shared/enums/sync-error-code.enum';

export class SyncErrorDto {
  @ApiProperty({enum: SyncErrorCode})
  code: SyncErrorCode;

  @ApiProperty()
  message: string;
}
