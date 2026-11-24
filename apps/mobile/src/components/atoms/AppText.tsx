import {StyleSheet, Text, type TextProps} from 'react-native';

import {useTheme} from '@/hooks/useTheme';

type Variant = 'title' | 'subtitle' | 'body' | 'muted';

export function AppText({variant = 'body', style, ...rest}: TextProps & {variant?: Variant}) {
  const theme = useTheme();
  const color = variant === 'muted' ? theme.textSecondary : theme.text;
  return <Text style={[{color}, styles[variant], style]} {...rest} />;
}

const styles = StyleSheet.create({
  title: {fontSize: 28, lineHeight: 34, fontWeight: '700'},
  subtitle: {fontSize: 18, lineHeight: 24, fontWeight: '600'},
  body: {fontSize: 16, lineHeight: 22},
  muted: {fontSize: 14, lineHeight: 20},
});
