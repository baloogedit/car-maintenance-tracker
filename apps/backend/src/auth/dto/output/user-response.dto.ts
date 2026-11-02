import {ApiProperty} from '@nestjs/swagger';

import {UserRole} from '../../../shared/enums/user-role.enum';

// A felhasznalo kifele mutathato adatai (jelszo hash es belso mezok nelkul).
// Osztaly, nem interfesz, mert a Swagger csak osztalybol tud valasz-semat rajzolni.
export class UserResponseDto {
  @ApiProperty({format: 'uuid'})
  id: string;

  @ApiProperty({example: 'magan@teszt.hu'})
  email: string;

  @ApiProperty({example: 'Anna'})
  firstName: string;

  @ApiProperty({type: String, nullable: true, example: 'Kiss'})
  lastName: string | null;

  @ApiProperty({enum: UserRole})
  role: string;

  @ApiProperty({type: String, format: 'uuid', nullable: true})
  companyId: string | null;
}
