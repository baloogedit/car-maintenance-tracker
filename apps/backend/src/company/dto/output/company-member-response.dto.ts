import {ApiProperty} from '@nestjs/swagger';

import {UserRole} from '../../../shared/enums/user-role.enum';

export class CompanyMemberResponseDto {
  @ApiProperty({format: 'uuid'})
  id: string;

  @ApiProperty({example: 'gabor@seed2.teszt.hu'})
  email: string;

  @ApiProperty({example: 'Gabor'})
  firstName: string;

  @ApiProperty({type: String, nullable: true, example: 'Varga'})
  lastName: string | null;

  @ApiProperty({enum: [UserRole.COMPANY_ADMIN, UserRole.COMPANY_MEMBER]})
  role: string;
}
