import {ApiProperty} from '@nestjs/swagger';

export class CompanyResponseDto {
  @ApiProperty({format: 'uuid'})
  id: string;

  @ApiProperty({example: 'Gyors Futar Bt.'})
  name: string;

  @ApiProperty({type: String, nullable: true, example: 'RO12345678'})
  taxId: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Csak az admin latja; a tagoknak null',
    example: 'K7QM4XTP',
  })
  joinCode: string | null;
}
