import {StyleSheet, Text} from 'react-native';

import {useTheme} from '@/hooks/useTheme';

// Kis, nagybetus felirat mezok es szekciok folott.
export function Label({children}: {children: string}) {
  const theme = useTheme();
  return <Text style={[styles.label, {color: theme.textSecondary}]}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {fontSize: 13, lineHeight: 18, fontWeight: '600', textTransform: 'uppercase'},
});
