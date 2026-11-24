import {z} from 'zod';

import {JOIN_CODE_MAX_LENGTH} from '@/constants/validation.constants';
import {VALIDATION_MESSAGES as M} from '@/constants/validationMessages';

export const JoinCompanySchema = z.object({
  joinCode: z.string().trim().min(1, M.required).max(JOIN_CODE_MAX_LENGTH, M.tooLong),
});

export type JoinCompanyValues = z.input<typeof JoinCompanySchema>;
