import {ApiProperty} from '@nestjs/swagger';
import {Type} from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDate,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import {DEVICE_ID_MAX_LENGTH} from '../../../shared/constants/auth.constants';
import {SYNC_PUSH_MAX_MUTATIONS} from '../../../shared/constants/sync.constants';
import {SyncMutationDto} from './sync-mutation.dto';

export class SyncPushRequestDto {
  @ApiProperty({maxLength: DEVICE_ID_MAX_LENGTH, description: 'Az eszkoz allando azonositoja'})
  @IsString()
  @IsNotEmpty()
  @MaxLength(DEVICE_ID_MAX_LENGTH)
  deviceId: string;

  @ApiProperty({description: 'A kliens oraja a kuldes pillanataban (oraelteres korrekciohoz)'})
  @Type(() => Date)
  @IsDate()
  clientNow: Date;

  @ApiProperty({type: [SyncMutationDto], maxItems: SYNC_PUSH_MAX_MUTATIONS})
  @IsArray()
  @ArrayMaxSize(SYNC_PUSH_MAX_MUTATIONS)
  @ValidateNested({each: true})
  @Type(() => SyncMutationDto)
  mutations: SyncMutationDto[];
}
