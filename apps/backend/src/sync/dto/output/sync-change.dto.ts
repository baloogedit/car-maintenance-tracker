import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';

// Egy sor a pull valaszban (es a REJECTED_STALE eredmeny current mezojeben).
// Tombstone-nal (deletedAt nem null) nincs data.
export class SyncChangeDto {
  @ApiProperty({format: 'uuid'})
  id: string;

  @ApiProperty({description: 'Szerver version (rowversion szamkent)'})
  version: number;

  @ApiProperty()
  clientUpdatedAt: Date;

  @ApiProperty({type: Date, nullable: true})
  deletedAt: Date | null;

  @ApiPropertyOptional({type: 'object', additionalProperties: true})
  data?: Record<string, unknown>;
}
