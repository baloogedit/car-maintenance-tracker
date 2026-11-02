import {ApiProperty} from '@nestjs/swagger';

// A refresh vegpont valasza: uj tokenpar.
export class AuthTokensDto {
  @ApiProperty({description: 'Rovid eletu JWT, az Authorization: Bearer fejlecbe kell'})
  accessToken: string;

  @ApiProperty({description: 'Hosszu eletu, egyszer hasznalhato token a /auth/refresh-hez'})
  refreshToken: string;

  @ApiProperty({description: 'Az access token elettartama masodpercben', example: 900})
  accessExpiresIn: number;
}
