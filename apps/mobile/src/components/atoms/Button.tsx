import {ActivityIndicator, Pressable, StyleSheet, Text} from 'react-native';

import {Radius, Spacing} from '@/constants/theme';
import {useTheme} from '@/hooks/useTheme';

type Variant = 'primary' | 'secondary' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: ButtonProps) {
  const theme = useTheme();
  // primary = emerald, secondary = sky, danger = piros keret
  const colors = {
    primary: {background: theme.primary, text: theme.onPrimary, border: theme.primary},
    secondary: {
      background: theme.secondarySoft,
      text: theme.secondaryText,
      border: theme.secondarySoft,
    },
    danger: {background: 'transparent', text: theme.danger, border: theme.danger},
  }[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      onPress={onPress}
      style={({pressed}) => [
        styles.button,
        {backgroundColor: colors.background, borderColor: colors.border},
        (pressed || inactive) && styles.dimmed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text style={[styles.text, {color: colors.text}]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: Radius.medium,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  text: {fontSize: 16, fontWeight: '600'},
  dimmed: {opacity: 0.6},
});
