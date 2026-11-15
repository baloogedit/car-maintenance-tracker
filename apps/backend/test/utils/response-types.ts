// A valaszok alakja a tesztekben (a supertest body tipusa any, ezert castoljuk).
export interface SessionBody {
  accessToken: string;
  refreshToken: string;
  user: {id: string; role: string};
}

export interface VehicleBody {
  id: string;
  ownerUserId: string;
  companyId: string | null;
  currentMileage: number;
}

export interface CompanyBody {
  id: string;
  name: string;
  joinCode: string | null;
}

export interface MemberBody {
  id: string;
  email: string;
  role: string;
}

export interface SyncChangeBody {
  id: string;
  version: number;
  clientUpdatedAt: string;
  deletedAt: string | null;
  data?: Record<string, unknown>;
}

export interface PushBody {
  serverNow: string;
  results: {
    mutationId: string;
    status: string;
    originalStatus?: string;
    version?: number | null;
    error?: {code: string; message: string};
    current?: SyncChangeBody;
  }[];
}

export interface PullBody {
  changes: {Vehicle: SyncChangeBody[]};
  cursor: number;
  hasMore: boolean;
  resetRequired: boolean;
  scope: string;
  serverNow: string;
}
