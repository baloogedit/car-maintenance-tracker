import {StyleSheet, Switch, View} from 'react-native';

import {AppText} from '@/components/atoms/AppText';
import {Spacing} from '@/constants/theme';
import {useTheme} from '@/hooks/useTheme';

interface SwitchRowProps {
  title: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function SwitchRow({title, description, value, onChange}: SwitchRowProps) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <AppText>{title}</AppText>
        {description ? <AppText variant="muted">{description}</AppText> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{true: theme.primary, false: theme.line}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: Spacing.three},
  text: {flex: 1},
});
