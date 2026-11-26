import {Pressable, StyleSheet, Text, View} from 'react-native';

import {Label} from '@/components/atoms/Label';
import {Radius, Spacing} from '@/constants/theme';
import {useTheme} from '@/hooks/useTheme';

interface ChoiceChipsProps<T extends string> {
  label: string;
  options: {value: T; label: string}[];
  value: T;
  onChange: (value: T) => void;
}

// Egy-valasztasos "chip" sor (pl. uzemanyag tipusa).
export function ChoiceChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: ChoiceChipsProps<T>) {
  const theme = useTheme();
  return (
    <View style={styles.wrapper}>
      <Label>{label}</Label>
      <View style={styles.row}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{selected}}
              onPress={() => onChange(option.value)}
              style={[
                styles.chip,
                {
                  borderColor: selected ? theme.primary : theme.line,
                  backgroundColor: selected ? theme.primarySoft : theme.surface,
                },
              ]}
            >
              <Text style={[styles.text, {color: selected ? theme.primaryText : theme.text}]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {gap: Spacing.one},
  row: {flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two},
  chip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  text: {fontWeight: '600'},
});
