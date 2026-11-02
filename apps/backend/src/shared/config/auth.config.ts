import {ConfigType, registerAs} from '@nestjs/config';

import {parseDuration} from '../utils/parse-duration.util';

// Az auth beallitasai egy helyen, tipusosan. Az idotartamokat egyszer,
// indulaskor valtjuk masodpercre; a service-ek mar a kesz szamot kapjak.
export const authConfig = registerAs('auth', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
  accessTtlSeconds: parseDuration(process.env.JWT_ACCESS_EXPIRES_IN ?? '15m'),
  refreshTtlSeconds: parseDuration(process.env.JWT_REFRESH_EXPIRES_IN ?? '60d'),
}));

export type AuthConfig = ConfigType<typeof authConfig>;
