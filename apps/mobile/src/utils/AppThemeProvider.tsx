import {DarkTheme, DefaultTheme, ThemeProvider} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {type ReactNode, useMemo} from 'react';

import {useColorSchemeName, useTheme} from '@/hooks/useTheme';

// A navigacio (fejlec, kepernyo hatter) is a mi szineinket kapja, es az
// allapotsor ikonjai a temahoz igazodnak.
export function AppThemeProvider({children}: {children: ReactNode}) {
  const scheme = useColorSchemeName();
  const theme = useTheme();

  const navigationTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.primary,
        background: theme.background,
        card: theme.surface,
        text: theme.text,
        border: theme.line,
      },
    };
  }, [scheme, theme]);

  return (
    <ThemeProvider value={navigationTheme}>
      {children}
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
