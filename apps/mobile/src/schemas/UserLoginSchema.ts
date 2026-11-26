import {z} from 'zod';

import {VALIDATION_MESSAGES as M} from '@/constants/validationMessages';

export const UserLoginSchema = z.object({
  email: z.string().trim().min(1, M.required).pipe(z.email(M.email)),
  password: z.string().min(1, M.required),
});

export type UserLoginValues = z.input<typeof UserLoginSchema>;
