import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';

import {SyncMutationStatus} from '../../../shared/enums/sync-mutation-status.enum';
import {SyncChangeDto} from './sync-change.dto';
import {SyncErrorDto} from './sync-error.dto';

export class SyncMutationResultDto {
  @ApiProperty({format: 'uuid'})
  mutationId: string;

  @ApiProperty({enum: SyncMutationStatus})
  status: SyncMutationStatus;

  @ApiPropertyOptional({
    enum: SyncMutationStatus,
    description: 'Csak DUPLICATE-nel: az eredeti feldolgozas eredmenye',
  })
  originalStatus?: SyncMutationStatus;

  @ApiPropertyOptional({type: Number, nullable: true, description: 'APPLIED: a sor uj version-je'})
  version?: number | null;

  @ApiPropertyOptional({type: SyncErrorDto, description: 'REJECTED_INVALID: a hiba oka'})
  error?: SyncErrorDto;

  @ApiPropertyOptional({type: SyncChangeDto, description: 'REJECTED_STALE: a szerver peldanya'})
  current?: SyncChangeDto;
}
