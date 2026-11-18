// A backend auth DTO-inak tukre (lasd /api/docs).

export type UserRole = 'PRIVATE' | 'COMPANY_ADMIN' | 'COMPANY_MEMBER';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  role: UserRole;
  companyId: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
}

// Belepes, regisztracio, ceg letrehozasa / csatlakozas / kilepes valasza.
export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}
