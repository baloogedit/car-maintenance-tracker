import {Module} from '@nestjs/common';

import {AuthModule} from '../auth/auth.module';
import {CompanyController} from './company.controller';
import {CompanyService} from './company.service';

@Module({
  // az AuthModule adja a TokenService-t (uj tokenpar a szerepkor valtozasa utan)
  imports: [AuthModule],
  controllers: [CompanyController],
  providers: [CompanyService],
})
export class CompanyModule {}
