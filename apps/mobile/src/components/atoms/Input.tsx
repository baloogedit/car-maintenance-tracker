import {StyleSheet, TextInput, type TextInputProps} from 'react-native';

import {Radius, Spacing} from '@/constants/theme';
import {useTheme} from '@/hooks/useTheme';

export function Input({style, hasError, ...rest}: TextInputProps & {hasError?: boolean}) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.placeholder}
      style={[
        styles.input,
        {
          color: theme.text,
          backgroundColor: theme.surface,
          borderColor: hasError ? theme.danger : theme.line,
        },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
});
