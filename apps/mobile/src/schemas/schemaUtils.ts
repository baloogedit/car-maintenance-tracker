import {z} from 'zod';

import {VALIDATION_MESSAGES as M} from '@/constants/validationMessages';

// Nem kotelezo szoveg: az ures mezobol undefined lesz (a backend igy nem kap "").
export const optionalText = (maxLength = 100) =>
  z
    .string()
    .trim()
    .max(maxLength, M.tooLong)
    .transform((value) => value || undefined);
