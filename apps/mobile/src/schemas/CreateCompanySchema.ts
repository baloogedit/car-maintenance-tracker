import {z} from 'zod';

import {COMPANY_NAME_MAX_LENGTH, TAX_ID_MAX_LENGTH} from '@/constants/validation.constants';
import {VALIDATION_MESSAGES as M} from '@/constants/validationMessages';

import {optionalText} from './schemaUtils';

export const CreateCompanySchema = z.object({
  name: z.string().trim().min(1, M.required).max(COMPANY_NAME_MAX_LENGTH, M.tooLong),
  taxId: optionalText(TAX_ID_MAX_LENGTH),
});

export type CreateCompanyValues = z.input<typeof CreateCompanySchema>;
