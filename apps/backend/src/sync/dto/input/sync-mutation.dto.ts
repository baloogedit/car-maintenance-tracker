import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {Type} from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';

import {SyncEntity} from '../../../shared/enums/sync-entity.enum';
import {SyncOperation} from '../../../shared/enums/sync-operation.enum';

// Egy kliens oldali outbox bejegyzes. A data tartalmat itt csak objektumkent
// ellenorizzuk: a tablankent eltero mezoket a handler validalja (pl.
// VehicleSyncDataDto), es a hibat az adott mutation eredmenyeben adja vissza
// (REJECTED_INVALID), nem az egesz kerest utasitja el.
export class SyncMutationDto {
  @ApiProperty({format: 'uuid', description: 'A kliens generalja; ujrakuldesnel ugyanaz'})
  @IsUUID()
  mutationId: string;

  @ApiProperty({enum: SyncEntity})
  @IsEnum(SyncEntity)
  entity: SyncEntity;

  @ApiProperty({enum: SyncOperation})
  @IsEnum(SyncOperation)
  op: SyncOperation;

  @ApiProperty({format: 'uuid', description: 'A sor azonositoja (a kliens generalja)'})
  @IsUUID()
  id: string;

  @ApiProperty({
    type: Number,
    nullable: true,
    description:
      'A kliens altal utoljara latott szerver version; null, ha a sor meg sosem ment fel',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  baseVersion: number | null;

  @ApiProperty({description: 'A helyi modositas ideje (a kliens oraja szerint, ISO 8601)'})
  @Type(() => Date)
  @IsDate()
  clientUpdatedAt: Date;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: 'UPSERT-nel kotelezo: a sor osszes, kliens altal irhato mezoje',
  })
  @ValidateIf((m: SyncMutationDto) => m.op === SyncOperation.UPSERT)
  @IsObject()
  data?: Record<string, unknown>;
}
