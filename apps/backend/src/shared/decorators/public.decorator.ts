import {SetMetadata} from '@nestjs/common';

import {IS_PUBLIC_KEY} from '../constants/public-route.constants';

// A JwtGuard globalis: minden vegpont belepest ker, kiveve amit @Public()-kal
// jelolunk (regisztracio, belepes, refresh, health).
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
