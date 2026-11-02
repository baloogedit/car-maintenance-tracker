import {ConflictException, Injectable, NotFoundException} from '@nestjs/common';
import {Prisma, User} from '@prisma/client';

import {AuthResponseDto} from '../auth/dto/output/auth-response.dto';
import {toUserResponse} from '../auth/mapper/user.mapper';
import {TokenService} from '../auth/token/token.service';
import {JOIN_CODE_MAX_ATTEMPTS} from '../shared/constants/company.constants';
import {UserRole} from '../shared/enums/user-role.enum';
import {JwtPayload} from '../shared/interfaces/jwt-payload.interface';
import {PrismaService} from '../shared/modules/db/prisma.service';
import {generateJoinCode} from '../shared/utils/join-code.util';
import {CreateCompanyDto} from './dto/input/create-company.dto';
import {JoinCompanyDto} from './dto/input/join-company.dto';
import {CompanyResponseDto} from './dto/output/company-response.dto';
import {JoinCodeResponseDto} from './dto/output/join-code-response.dto';
import {toCompanyResponse} from './mapper/company.mapper';

// Ceg letrehozasa, csatlakozas koddal, a sajat ceg adatai, uj kod generalasa.
//
// A szerepkor benne van az access tokenben, ezert a letrehozas es a csatlakozas
// utan uj tokenpart adunk vissza: az app ezzel azonnal az uj jogosultsaggal fut.
// A felhasznalo korabbi maganjarmuvei maganjarmuvek maradnak (companyId = null).
@Injectable()
export class CompanyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  async create(user: JwtPayload, dto: CreateCompanyDto): Promise<AuthResponseDto> {
    const updated = await this.withFreshJoinCode((joinCode) =>
      this.prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: {name: dto.name, taxId: dto.taxId, joinCode},
        });
        return this.attachToCompany(tx, user.sub, company.id, UserRole.COMPANY_ADMIN);
      }),
    );
    return this.sessionFor(updated, dto.deviceId);
  }

  async join(user: JwtPayload, dto: JoinCompanyDto): Promise<AuthResponseDto> {
    // Az SQL Server alapertelmezett rendezese nem kis- es nagybetu-erzekeny,
    // igy a kisbetuvel begepelt kod is megtalalja a ceget.
    const company = await this.prisma.company.findFirst({
      where: {joinCode: dto.joinCode, isDeleted: false},
    });
    if (!company) {
      throw new NotFoundException('Ervenytelen csatlakozasi kod.');
    }
    const updated = await this.prisma.$transaction((tx) =>
      this.attachToCompany(tx, user.sub, company.id, UserRole.COMPANY_MEMBER),
    );
    return this.sessionFor(updated, dto.deviceId);
  }

  async findMine(user: JwtPayload): Promise<CompanyResponseDto> {
    const company = user.companyId
      ? await this.prisma.company.findFirst({where: {id: user.companyId, isDeleted: false}})
      : null;
    if (!company) {
      throw new NotFoundException('A ceg nem talalhato.');
    }
    return toCompanyResponse(company, user.role === UserRole.COMPANY_ADMIN);
  }

  // Ha a kod illetektelen kezbe kerult: az uj kod utan a regivel mar nem lehet
  // csatlakozni. A mar bent levo tagokat nem erinti.
  async regenerateJoinCode(user: JwtPayload): Promise<JoinCodeResponseDto> {
    const company = await this.withFreshJoinCode((joinCode) =>
      this.prisma.company.update({where: {id: user.companyId!}, data: {joinCode}}),
    );
    return {joinCode: company.joinCode};
  }

  // Csak akkor lep be, ha a felhasznalo meg tenyleg maganszemely. A token meg
  // mutathat PRIVATE szerepkort, mikozben a felhasznalo mar egy cegben van
  // (pl. ket eszkozrol egyszerre), ezert az adatbazisban is ellenorizzuk.
  private async attachToCompany(
    tx: Prisma.TransactionClient,
    userId: string,
    companyId: string,
    role: UserRole,
  ): Promise<User> {
    const {count} = await tx.user.updateMany({
      where: {id: userId, role: UserRole.PRIVATE, companyId: null, isDeleted: false},
      data: {companyId, role},
    });
    if (count === 0) {
      throw new ConflictException('Mar egy ceg tagja vagy.');
    }
    return tx.user.findUniqueOrThrow({where: {id: userId}});
  }

  // Uj kodot general, es ha (nagyon ritkan) mar foglalt, ujraprobalja.
  // Minden mas hibat (pl. foglalt adoszam) tovabbad, azt a PrismaExceptionFilter
  // forditja 409-re.
  private async withFreshJoinCode<T>(action: (joinCode: string) => Promise<T>): Promise<T> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await action(generateJoinCode());
      } catch (error) {
        if (attempt >= JOIN_CODE_MAX_ATTEMPTS || !isJoinCodeConflict(error)) throw error;
      }
    }
  }

  private async sessionFor(user: User, deviceId?: string): Promise<AuthResponseDto> {
    return {user: toUserResponse(user), ...(await this.tokens.issue(user, deviceId))};
  }
}

function isJoinCodeConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002' &&
    JSON.stringify(error.meta?.target ?? '').includes('joinCode')
  );
}
