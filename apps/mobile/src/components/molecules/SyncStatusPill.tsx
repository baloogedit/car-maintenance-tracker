import {StyleSheet, Text, View} from 'react-native';

import {Radius, Spacing} from '@/constants/theme';
import {useTheme} from '@/hooks/useTheme';
import {useSyncStore} from '@/store/useSyncStore';

// Kis jelzo a lista fejleceben: latszik, hogy minden fent van-e a szerveren.
// Sorrend: hiba > offline > szinkronizal > fuggo valtozasok > szinkronizalva.
export function SyncStatusPill() {
  const theme = useTheme();
  const status = useSyncStore((state) => state.status);
  const pending = useSyncStore((state) => state.pendingCount);
  const failed = useSyncStore((state) => state.failedCount);

  let label = 'Szinkronizálva';
  let dot: string = theme.primary;
  if (status === 'error' || failed > 0) {
    label = failed > 0 ? `${failed} hibás` : 'Szinkron hiba';
    dot = theme.danger;
  } else if (status === 'offline') {
    label = pending > 0 ? `Offline · ${pending} függőben` : 'Offline';
    dot = theme.placeholder;
  } else if (status === 'syncing') {
    label = 'Szinkronizálás…';
    dot = theme.secondary;
  } else if (pending > 0) {
    label = `${pending} függőben`;
    dot = theme.secondary;
  }

  return (
    <View style={[styles.pill, {backgroundColor: theme.surfaceMuted}]}>
      <View style={[styles.dot, {backgroundColor: dot}]} />
      <Text style={[styles.text, {color: theme.textSecondary}]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  dot: {width: 8, height: 8, borderRadius: Radius.full},
  text: {fontSize: 12, fontWeight: '600'},
});
