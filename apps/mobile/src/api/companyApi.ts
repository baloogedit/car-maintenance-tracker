import type {AuthResponse} from '@/types/auth.types';
import type {
  Company,
  CompanyMember,
  CompanyRole,
  CreateCompanyRequest,
} from '@/types/company.types';
import {getDeviceId} from '@/utils/deviceId';

import {apiRequest} from './apiClient';

export const companyApi = {
  // A letrehozas, a csatlakozas es a kilepes uj tokenpart ad (mas szerepkorrel).
  create: async (data: CreateCompanyRequest) =>
    apiRequest<AuthResponse>('/companies', {
      method: 'POST',
      body: {...data, deviceId: await getDeviceId()},
    }),

  join: async (joinCode: string) =>
    apiRequest<AuthResponse>('/companies/join', {
      method: 'POST',
      body: {joinCode, deviceId: await getDeviceId()},
    }),

  leave: async () =>
    apiRequest<AuthResponse>('/companies/me/leave', {
      method: 'POST',
      body: {deviceId: await getDeviceId()},
    }),

  getMine: () => apiRequest<Company>('/companies/me'),

  regenerateJoinCode: () =>
    apiRequest<{joinCode: string}>('/companies/me/join-code', {method: 'POST'}),

  // Csak adminnak:
  listMembers: () => apiRequest<CompanyMember[]>('/companies/me/members'),

  changeMemberRole: (userId: string, role: CompanyRole) =>
    apiRequest<CompanyMember>(`/companies/me/members/${userId}`, {
      method: 'PATCH',
      body: {role},
    }),

  removeMember: (userId: string) =>
    apiRequest<void>(`/companies/me/members/${userId}`, {method: 'DELETE'}),
};
