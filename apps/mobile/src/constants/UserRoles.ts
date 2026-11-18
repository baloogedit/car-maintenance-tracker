import type {UserRole} from '@/types/auth.types';

export const ROLE_LABELS: Record<UserRole, string> = {
  PRIVATE: 'Magánszemély',
  COMPANY_ADMIN: 'Céges admin',
  COMPANY_MEMBER: 'Céges tag',
};
