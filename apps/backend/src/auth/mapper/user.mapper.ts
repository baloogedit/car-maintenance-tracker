import {User} from '@prisma/client';

import {UserResponseDto} from '../dto/output/user-response.dto';

// Prisma User -> kifele kuldheto profil. Ide kerul minden, ami a felhasznalobol
// a valaszba mehet; a passwordHash soha.
export function toUserResponse(user: User): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    companyId: user.companyId,
  };
}
