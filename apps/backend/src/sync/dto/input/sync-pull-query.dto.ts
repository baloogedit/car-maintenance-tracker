import {ApiPropertyOptional} from '@nestjs/swagger';
import {Type} from 'class-transformer';
import {IsInt, IsOptional, IsString, Max, MaxLength, Min} from 'class-validator';

import {
  SYNC_PULL_DEFAULT_LIMIT,
  SYNC_PULL_MAX_LIMIT,
} from '../../../shared/constants/sync.constants';

export class SyncPullQueryDto {
  @ApiPropertyOptional({default: 0, description: 'Az elozo pull cursor erteke; elso alkalommal 0'})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  since?: number;

  @ApiPropertyOptional({default: SYNC_PULL_DEFAULT_LIMIT, maximum: SYNC_PULL_MAX_LIMIT})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(SYNC_PULL_MAX_LIMIT)
  limit?: number;

  @ApiPropertyOptional({
    description:
      'Az elozo pull valaszaban kapott scope. Ha azota megvaltozott (cegbe lepes, ' +
      'kilepes), a valasz resetRequired: true',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  scope?: string;
}
