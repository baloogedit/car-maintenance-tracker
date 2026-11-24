import {z} from 'zod';

import {PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH} from '@/constants/validation.constants';
import {VALIDATION_MESSAGES as M} from '@/constants/validationMessages';

import {optionalText} from './schemaUtils';

export const UserRegisterSchema = z.object({
  firstName: z.string().trim().min(1, M.required),
  lastName: optionalText(),
  email: z.string().trim().min(1, M.required).pipe(z.email(M.email)),
  password: z.string().min(PASSWORD_MIN_LENGTH, M.passwordMin).max(PASSWORD_MAX_LENGTH, M.tooLong),
});

export type UserRegisterValues = z.input<typeof UserRegisterSchema>;
