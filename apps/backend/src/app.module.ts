import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';

import {AuthModule} from './auth/auth.module';
import {CompanyModule} from './company/company.module';
import {HealthModule} from './health/health.module';
import {validateEnv} from './shared/config/env.validation';
import {SharedModule} from './shared/shared.module';
import {VehicleModule} from './vehicle/vehicle.module';

// A modulfa gyokere. Uj funkcio = uj feature modul a sajat mappajaban,
// amit itt kell felvenni az imports listaba.
@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true, validate: validateEnv}),
    SharedModule,
    AuthModule,
    CompanyModule,
    HealthModule,
    VehicleModule,
  ],
})
export class AppModule {}
