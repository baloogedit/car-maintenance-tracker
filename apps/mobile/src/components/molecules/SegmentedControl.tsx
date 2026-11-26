import {Pressable, StyleSheet, Text, View} from 'react-native';

import {Radius, Spacing} from '@/constants/theme';
import {useTheme} from '@/hooks/useTheme';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

// Ket-harom reszes valaszto (pl. Sajat / Ceges a jarmuveknel, Privat / Ceg a profilban).
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const theme = useTheme();
  return (
    <View style={[styles.track, {backgroundColor: theme.surfaceMuted}]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{selected}}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && {backgroundColor: theme.surface}]}
          >
            <Text
              style={[styles.label, {color: selected ? theme.primaryText : theme.textSecondary}]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {flexDirection: 'row', borderRadius: Radius.medium, padding: 3},
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.small + 2,
  },
  label: {fontSize: 15, fontWeight: '600'},
});
