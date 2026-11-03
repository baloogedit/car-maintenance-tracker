import {ConflictException, ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import {Prisma, User} from '@prisma/client';

import {AuthResponseDto} from '../../auth/dto/output/auth-response.dto';
import {toUserResponse} from '../../auth/mapper/user.mapper';
import {TokenService} from '../../auth/token/token.service';
import {UserRole} from '../../shared/enums/user-role.enum';
import {JwtPayload} from '../../shared/interfaces/jwt-payload.interface';
import {PrismaService} from '../../shared/modules/db/prisma.service';
import {CompanyRole} from '../dto/input/change-member-role.dto';
import {CompanyMemberResponseDto} from '../dto/output/company-member-response.dto';
import {toCompanyMemberResponse} from '../mapper/company.mapper';

// A cegtagsag kezelese: kilepes, taglista, szerepkorvaltas, eltavolitas.
//
// Szabalyok:
//   - a tag barmikor kilephet; az admin csak akkor, ha marad masik admin
//   - az utolso admin nem fokozhato le es nem tavolithato el
//   - a kilepo CEGES jarmuvei a cegnel maradnak, uj tulajdonosuk egy admin;
//     a maganjarmuvei vele mennek; a bejegyzesei (createdByUserId) megmaradnak
//
// Az "utolso admin" ellenorzese es a modositas egy SERIALIZABLE tranzakcioban
// fut, hogy ket admin egyideju kilepese ne hagyja admin nelkul a ceget.
@Injectable()
export class CompanyMembershipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  async leave(user: JwtPayload, deviceId?: string): Promise<AuthResponseDto> {
    const companyId = requireCompany(user);
    const updated = await this.serializable(async (tx) => {
      const newOwnerId = await this.otherAdminId(tx, companyId, user.sub);
      // a ceges jarmuvei ennek az adminnak adodnak at, ezert ha nincs masik admin
      // (mert o az egyetlen), nem lephet ki
      if (!newOwnerId) {
        throw new ConflictException(
          'Te vagy a ceg egyetlen adminja. Kilepes elott nevezz ki egy masik admint.',
        );
      }
      return this.detach(tx, user.sub, companyId, newOwnerId);
    });
    return {user: toUserResponse(updated), ...(await this.tokens.issue(updated, deviceId))};
  }

  async listMembers(user: JwtPayload): Promise<CompanyMemberResponseDto[]> {
    const members = await this.prisma.user.findMany({
      where: {companyId: requireCompany(user), isDeleted: false},
      orderBy: [{role: 'asc'}, {firstName: 'asc'}],
    });
    return members.map(toCompanyMemberResponse);
  }

  async changeRole(
    user: JwtPayload,
    memberId: string,
    role: CompanyRole,
  ): Promise<CompanyMemberResponseDto> {
    const companyId = requireCompany(user);
    const updated = await this.serializable(async (tx) => {
      const member = await this.findMember(tx, companyId, memberId);
      if (isAdmin(member) && role !== UserRole.COMPANY_ADMIN) {
        await this.assertNotLastAdmin(tx, companyId, member.id);
      }
      return tx.user.update({where: {id: member.id}, data: {role}});
    });
    return toCompanyMemberResponse(updated);
  }

  // Az admin sajat magat nem tavolithatja el, arra a kilepes valo.
  async removeMember(user: JwtPayload, memberId: string): Promise<void> {
    const companyId = requireCompany(user);
    if (memberId === user.sub) {
      throw new ForbiddenException('Sajat magadat a kilepessel tudod eltavolitani.');
    }
    await this.serializable(async (tx) => {
      const member = await this.findMember(tx, companyId, memberId);
      if (isAdmin(member)) {
        await this.assertNotLastAdmin(tx, companyId, member.id);
      }
      await this.detach(tx, member.id, companyId, user.sub);
    });
    // minden eszkozon ki kell lepnie; az access tokenje a JwtGuard miatt mar most sem
    // ad hozzaferest a ceghez
    await this.tokens.revokeAllForUser(memberId);
  }

  // A felhasznalo levalasztasa a cegrol: a ceges jarmuvei az uj tulajdonoshoz
  // kerulnek, o maga ujra maganszemely lesz.
  private async detach(
    tx: Prisma.TransactionClient,
    userId: string,
    companyId: string,
    newOwnerId: string,
  ): Promise<User> {
    await tx.vehicle.updateMany({
      where: {ownerUserId: userId, companyId},
      data: {ownerUserId: newOwnerId, clientUpdatedAt: new Date()},
    });
    return tx.user.update({
      where: {id: userId},
      data: {role: UserRole.PRIVATE, companyId: null},
    });
  }

  private async findMember(
    tx: Prisma.TransactionClient,
    companyId: string,
    memberId: string,
  ): Promise<User> {
    const member = await tx.user.findFirst({
      where: {id: memberId, companyId, isDeleted: false},
    });
    if (!member) {
      throw new NotFoundException('A tag nem talalhato.');
    }
    return member;
  }

  private async otherAdminId(
    tx: Prisma.TransactionClient,
    companyId: string,
    exceptUserId: string,
  ): Promise<string | null> {
    const admin = await tx.user.findFirst({
      where: {
        companyId,
        role: UserRole.COMPANY_ADMIN,
        isDeleted: false,
        id: {not: exceptUserId},
      },
      orderBy: {createdAt: 'asc'},
      select: {id: true},
    });
    return admin?.id ?? null;
  }

  private async assertNotLastAdmin(
    tx: Prisma.TransactionClient,
    companyId: string,
    adminId: string,
  ): Promise<void> {
    if (!(await this.otherAdminId(tx, companyId, adminId))) {
      throw new ConflictException('A cegnek legalabb egy adminja kell, hogy maradjon.');
    }
  }

  private serializable<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }
}

function isAdmin(user: User): boolean {
  return (user.role as UserRole) === UserRole.COMPANY_ADMIN;
}

// A @Roles() mar biztositja, hogy ceges felhasznalo hivja; ez csak a tipus miatt kell.
function requireCompany(user: JwtPayload): string {
  if (!user.companyId) {
    throw new ForbiddenException();
  }
  return user.companyId;
}
