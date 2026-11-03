import {Module} from '@nestjs/common';

import {AuthModule} from '../auth/auth.module';
import {CompanyController} from './company.controller';
import {CompanyService} from './company.service';
import {CompanyMembershipService} from './membership/company-membership.service';
import {CompanyMembershipController} from './membership/membership.controller';

@Module({
  // az AuthModule adja a TokenService-t (uj tokenpar a szerepkor valtozasa utan)
  imports: [AuthModule],
  controllers: [CompanyController, CompanyMembershipController],
  providers: [CompanyService, CompanyMembershipService],
})
export class CompanyModule {}
