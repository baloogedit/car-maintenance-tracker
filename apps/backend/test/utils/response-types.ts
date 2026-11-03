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
