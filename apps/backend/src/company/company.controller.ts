import {Body, Controller, Get, HttpCode, HttpStatus, Post} from '@nestjs/common';
import {ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags} from '@nestjs/swagger';

import {AuthResponseDto} from '../auth/dto/output/auth-response.dto';
import {CurrentUser} from '../shared/decorators/current-user.decorator';
import {Roles} from '../shared/decorators/roles.decorator';
import {UserRole} from '../shared/enums/user-role.enum';
import type {JwtPayload} from '../shared/interfaces/jwt-payload.interface';
import {CompanyService} from './company.service';
import {CreateCompanyDto} from './dto/input/create-company.dto';
import {JoinCompanyDto} from './dto/input/join-company.dto';
import {CompanyResponseDto} from './dto/output/company-response.dto';
import {JoinCodeResponseDto} from './dto/output/join-code-response.dto';

@ApiTags('companies')
@ApiBearerAuth()
@Controller('companies')
export class CompanyController {
  constructor(private readonly companies: CompanyService) {}

  // A letrehozo lesz az admin. Uj tokenpart ad vissza (mar COMPANY_ADMIN szerepkorrel).
  @Post()
  @Roles(UserRole.PRIVATE)
  @ApiCreatedResponse({type: AuthResponseDto})
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCompanyDto) {
    return this.companies.create(user, dto);
  }

  // Csatlakozas tagkent a ceg kodjaval. Uj tokenpart ad vissza (COMPANY_MEMBER).
  @Post('join')
  @Roles(UserRole.PRIVATE)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({type: AuthResponseDto})
  join(@CurrentUser() user: JwtPayload, @Body() dto: JoinCompanyDto) {
    return this.companies.join(user, dto);
  }

  @Get('me')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.COMPANY_MEMBER)
  @ApiOkResponse({type: CompanyResponseDto})
  findMine(@CurrentUser() user: JwtPayload) {
    return this.companies.findMine(user);
  }

  @Post('me/join-code')
  @Roles(UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({type: JoinCodeResponseDto})
  regenerateJoinCode(@CurrentUser() user: JwtPayload) {
    return this.companies.regenerateJoinCode(user);
  }
}
