import type {
  AuthResponse,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  User,
} from '@/types/auth.types';
import {getDeviceId} from '@/utils/deviceId';

import {apiRequest} from './apiClient';

export const authApi = {
  // A deviceId-t az API reteg teszi hozza, igy a refresh token eszkozhoz kotott
  // (a szinkron is ezzel az azonositoval kuld).
  register: async (data: RegisterRequest) =>
    apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: {...data, deviceId: await getDeviceId()},
      auth: false,
    }),

  login: async (data: LoginRequest) =>
    apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: {...data, deviceId: await getDeviceId()},
      auth: false,
    }),

  refresh: (refreshToken: string) =>
    apiRequest<AuthTokens>('/auth/refresh', {
      method: 'POST',
      body: {refreshToken},
      auth: false,
    }),

  logout: (refreshToken: string) =>
    apiRequest<void>('/auth/logout', {method: 'POST', body: {refreshToken}, auth: false}),

  me: () => apiRequest<User>('/auth/me'),
};
