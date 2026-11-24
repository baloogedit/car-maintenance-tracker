import {StyleSheet, View} from 'react-native';

import {AppText} from '@/components/atoms/AppText';
import {Spacing} from '@/constants/theme';

export function InfoRow({label, value}: {label: string; value: string | number | null}) {
  return (
    <View style={styles.row}>
      <AppText variant="muted">{label}</AppText>
      <AppText style={styles.value}>{value ?? '–'}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.four},
  value: {flexShrink: 1, textAlign: 'right'},
});
