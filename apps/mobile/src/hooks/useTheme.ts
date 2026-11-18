import {Colors, type ColorScheme, type ThemeColors} from '@/constants/theme';
import {useThemeStore} from '@/store/useThemeStore';

import {useColorScheme} from './useColorScheme';

// Az aktualis szinseme: a kezzel valasztott mod, vagy 'system' eseten a telefone.
export function useColorSchemeName(): ColorScheme {
  const mode = useThemeStore((state) => state.mode);
  const systemScheme = useColorScheme();
  if (mode !== 'system') {
    return mode;
  }
  return systemScheme === 'dark' ? 'dark' : 'light';
}

// A komponensek ezzel kerik le a szineket: const theme = useTheme(); theme.primary
export function useTheme(): ThemeColors {
  return Colors[useColorSchemeName()];
}
