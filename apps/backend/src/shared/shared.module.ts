import {Global, Module} from '@nestjs/common';

import {AccessModule} from './modules/access/access.module';
import {DbModule} from './modules/db/db.module';

// A tobb feature altal hasznalt infrastruktura (adatbazis, jogosultsag) egy helyen.
// Globalis, igy a feature moduloknak nem kell kulon importalniuk.
@Global()
@Module({
  imports: [DbModule, AccessModule],
  exports: [DbModule, AccessModule],
})
export class SharedModule {}
