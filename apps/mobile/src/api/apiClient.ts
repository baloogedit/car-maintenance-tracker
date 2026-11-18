import {API_BASE_URL} from '@/constants/apiConfig';
import {useAuthStore} from '@/store/useAuthStore';
import type {AuthTokens} from '@/types/auth.types';

// Kozos HTTP kliens: Bearer tokent tesz a keresre, es ha az access token lejart
// (401), egyszer uj tokenpart ker a refresh tokennel, majd ujrakuldi a kerest.
// Ha a refresh sem sikerul, a munkamenet lejart -> kijelentkeztetes.

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean; // false = publikus vegpont (login, register, refresh, logout)
}

let refreshInFlight: Promise<boolean> | null = null;

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {auth = true} = options;
  let response = await send(path, options);

  if (response.status === 401 && auth) {
    const refreshed = await refreshTokens();
    if (!refreshed) {
      await useAuthStore.getState().clearSession();
      throw new ApiError(401, 'A munkamenet lejárt, jelentkezz be újra.');
    }
    response = await send(path, options);
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

async function send(path: string, {method = 'GET', body, auth = true}: RequestOptions) {
  const headers: Record<string, string> = {Accept: 'application/json'};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const accessToken = useAuthStore.getState().tokens?.accessToken;
  if (auth && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, `A szerver nem érhető el (${API_BASE_URL}).`);
  }
}

// Egyszerre tobb 401-es keres is johet: ilyenkor csak egy refresh fusson, mert a
// refresh token egyszer hasznalhato (a masodik hasznalat mindent visszavonna).
function refreshTokens(): Promise<boolean> {
  refreshInFlight ??= doRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function doRefresh(): Promise<boolean> {
  const refreshToken = useAuthStore.getState().tokens?.refreshToken;
  if (!refreshToken) {
    return false;
  }
  try {
    const response = await send('/auth/refresh', {
      method: 'POST',
      body: {refreshToken},
      auth: false,
    });
    if (!response.ok) {
      return false;
    }
    await useAuthStore.getState().setTokens((await response.json()) as AuthTokens);
    return true;
  } catch {
    return false;
  }
}

// A NestJS hibavalasza: {statusCode, message: string | string[], error}.
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as {message?: string | string[]};
    if (Array.isArray(data.message)) {
      return data.message.join('\n');
    }
    if (data.message) {
      return data.message;
    }
  } catch {
    // nem JSON valasz
  }
  return `Hiba történt (${response.status}).`;
}
