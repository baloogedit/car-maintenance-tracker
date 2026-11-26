import {StyleSheet, View} from 'react-native';

import {Label} from '@/components/atoms/Label';
import {Spacing} from '@/constants/theme';
import {type ThemeMode, useThemeStore} from '@/store/useThemeStore';

import {SegmentedControl, type SegmentOption} from './SegmentedControl';

const THEME_OPTIONS: SegmentOption<ThemeMode>[] = [
  {value: 'system', label: 'Rendszer'},
  {value: 'light', label: 'Világos'},
  {value: 'dark', label: 'Sötét'},
];

export function ThemeSelector() {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  return (
    <View style={styles.wrapper}>
      <Label>Megjelenés</Label>
      <SegmentedControl options={THEME_OPTIONS} value={mode} onChange={setMode} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {gap: Spacing.two},
});
