import {StyleSheet, type TextInputProps, View} from 'react-native';

import {ErrorText} from '@/components/atoms/ErrorText';
import {Input} from '@/components/atoms/Input';
import {Label} from '@/components/atoms/Label';
import {Spacing} from '@/constants/theme';

export interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

// Felirat + beviteli mezo + hibauzenet egyben.
export function TextField({label, error, ...inputProps}: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Label>{label}</Label>
      <Input hasError={!!error} {...inputProps} />
      <ErrorText message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {gap: Spacing.one},
});
