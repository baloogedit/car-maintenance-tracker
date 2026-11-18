// Szerepalapu szinek vilagos es sotet modra. A komponensek csak ezeket hasznaljak
// (useTheme()), igy a paletta egy helyen csereltheto.
import '@/global.css';

import {emerald, red, sky, slate} from './palette';

export const Colors = {
  light: {
    background: slate[50],
    surface: '#ffffff',
    surfaceMuted: slate[100],
    line: slate[200],
    text: slate[900],
    textSecondary: slate[500],
    placeholder: slate[400],
    primary: emerald[600],
    onPrimary: '#ffffff',
    primarySoft: emerald[50],
    primaryText: emerald[700],
    secondary: sky[600],
    secondarySoft: sky[100],
    secondaryText: sky[700],
    danger: red[600],
  },
  dark: {
    background: slate[950],
    surface: slate[900],
    surfaceMuted: slate[800],
    line: slate[800],
    text: slate[50],
    textSecondary: slate[400],
    placeholder: slate[500],
    primary: emerald[500],
    onPrimary: emerald[950],
    primarySoft: emerald[950],
    primaryText: emerald[400],
    secondary: sky[400],
    secondarySoft: sky[950],
    secondaryText: sky[300],
    danger: red[400],
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = (typeof Colors)[ColorScheme];

export const Spacing = {
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 24,
  six: 32,
} as const;

export const Radius = {
  small: 8,
  medium: 12,
  full: 999,
} as const;