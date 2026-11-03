import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {ApiBearerAuth, ApiNoContentResponse, ApiOkResponse, ApiTags} from '@nestjs/swagger';

import {AuthResponseDto} from '../../auth/dto/output/auth-response.dto';
import {CurrentUser} from '../../shared/decorators/current-user.decorator';
import {Roles} from '../../shared/decorators/roles.decorator';
import {UserRole} from '../../shared/enums/user-role.enum';
import type {JwtPayload} from '../../shared/interfaces/jwt-payload.interface';
import {ChangeMemberRoleDto} from '../dto/input/change-member-role.dto';
import {LeaveCompanyDto} from '../dto/input/leave-company.dto';
import {CompanyMemberResponseDto} from '../dto/output/company-member-response.dto';
import {CompanyMembershipService} from './company-membership.service';

@ApiTags('companies')
@ApiBearerAuth()
@Controller('companies/me')
export class CompanyMembershipController {
  constructor(private readonly membership: CompanyMembershipService) {}

  // Kilepes utan maganszemely lesz; uj tokenpart ad vissza (PRIVATE szerepkorrel).
  @Post('leave')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.COMPANY_MEMBER)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({type: AuthResponseDto})
  leave(@CurrentUser() user: JwtPayload, @Body() dto: LeaveCompanyDto) {
    return this.membership.leave(user, dto.deviceId);
  }

  @Get('members')
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOkResponse({type: [CompanyMemberResponseDto]})
  listMembers(@CurrentUser() user: JwtPayload) {
    return this.membership.listMembers(user);
  }

  @Patch('members/:userId')
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOkResponse({type: CompanyMemberResponseDto})
  changeRole(
    @CurrentUser() user: JwtPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: ChangeMemberRoleDto,
  ) {
    return this.membership.changeRole(user, userId, dto.role);
  }

  @Delete('members/:userId')
  @Roles(UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  removeMember(@CurrentUser() user: JwtPayload, @Param('userId', ParseUUIDPipe) userId: string) {
    return this.membership.removeMember(user, userId);
  }
}
