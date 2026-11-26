import {create} from 'zustand';

// 'system' = a telefon beallitasat koveti; a Profil fulon kezzel is valthato.
export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()((set) => ({
  mode: 'system',
  setMode: (mode) => set({mode}),
}));
