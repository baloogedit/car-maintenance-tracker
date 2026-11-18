import {ApiError} from '@/api/apiClient';

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return 'Váratlan hiba történt.';
}
