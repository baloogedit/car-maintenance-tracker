import {StyleSheet, Text, View} from 'react-native';

import {Radius, Spacing} from '@/constants/theme';
import {useTheme} from '@/hooks/useTheme';

type Tone = 'primary' | 'secondary' | 'neutral';

export function Badge({label, tone = 'secondary'}: {label: string; tone?: Tone}) {
  const theme = useTheme();
  const colors = {
    primary: {background: theme.primarySoft, text: theme.primaryText},
    secondary: {background: theme.secondarySoft, text: theme.secondaryText},
    neutral: {background: theme.surfaceMuted, text: theme.textSecondary},
  }[tone];
  return (
    <View style={[styles.badge, {backgroundColor: colors.background}]}>
      <Text style={[styles.text, {color: colors.text}]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  text: {fontSize: 12, fontWeight: '700'},
});
