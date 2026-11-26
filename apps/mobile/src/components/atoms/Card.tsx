import type {ReactNode} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import {Radius, Spacing} from '@/constants/theme';
import {useTheme} from '@/hooks/useTheme';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
}

export function Card({children, onPress}: CardProps) {
  const theme = useTheme();
  const style = [styles.card, {backgroundColor: theme.surface, borderColor: theme.line}];
  if (!onPress) {
    return <View style={style}>{children}</View>;
  }
  return (
    <Pressable onPress={onPress} style={({pressed}) => [style, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.medium,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  pressed: {opacity: 0.7},
});
