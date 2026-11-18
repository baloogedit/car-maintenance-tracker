import type {PullResponse, PushRequest, PushResponse} from '@/types/sync.types';

import {apiRequest} from './apiClient';

export const syncApi = {
  push: (data: PushRequest) => apiRequest<PushResponse>('/sync/push', {method: 'POST', body: data}),

  pull: (since: number, limit: number, scope: string | null) => {
    const params = new URLSearchParams({since: String(since), limit: String(limit)});
    if (scope) {
      params.set('scope', scope);
    }
    return apiRequest<PullResponse>(`/sync/pull?${params.toString()}`);
  },
};
