import {create} from 'zustand';

// A szinkron allapota a fejlecben levo jelzohoz es a Profil kartyajahoz.
// - dbReady: megnyilt-e a felhasznalo helyi adatbazisa
// - dataVersion: minden helyi adatvaltozasnal (iras, pull) no -> a listak ujraolvasnak
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

interface SyncState {
  dbReady: boolean;
  status: SyncStatus;
  pendingCount: number;
  failedCount: number;
  lastSyncAt: string | null;
  lastError: string | null;
  dataVersion: number;
  setDbReady: (ready: boolean) => void;
  setStatus: (status: SyncStatus, error?: string | null) => void;
  setCounts: (pending: number, failed: number) => void;
  setLastSyncAt: (iso: string | null) => void;
  bumpDataVersion: () => void;
  reset: () => void;
}

const initial = {
  dbReady: false,
  status: 'idle' as SyncStatus,
  pendingCount: 0,
  failedCount: 0,
  lastSyncAt: null,
  lastError: null,
  dataVersion: 0,
};

export const useSyncStore = create<SyncState>()((set) => ({
  ...initial,
  setDbReady: (dbReady) => set({dbReady}),
  setStatus: (status, error = null) => set({status, lastError: error}),
  setCounts: (pendingCount, failedCount) => set({pendingCount, failedCount}),
  setLastSyncAt: (lastSyncAt) => set({lastSyncAt}),
  bumpDataVersion: () => set((state) => ({dataVersion: state.dataVersion + 1})),
  reset: () => set(initial),
}));
