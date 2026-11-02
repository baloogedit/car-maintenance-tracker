import {ApiProperty} from '@nestjs/swagger';

export class JoinCodeResponseDto {
  @ApiProperty({example: 'K7QM4XTP'})
  joinCode: string;
}
