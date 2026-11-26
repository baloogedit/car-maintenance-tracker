import {type Control, Controller, type FieldValues, type Path} from 'react-hook-form';

import {TextField, type TextFieldProps} from '@/components/molecules/TextField';

interface FormInputProps<T extends FieldValues, TOut extends FieldValues = T> extends Omit<
  TextFieldProps,
  'value' | 'error'
> {
  // a harmadik tipusparameter a zod altal atalakitott (bekuldott) ertekek tipusa
  control: Control<T, unknown, TOut>;
  name: Path<T>;
}

// TextField a react-hook-form-hoz kotve: az erteket es a hibat a form kezeli.
export function FormInput<T extends FieldValues, TOut extends FieldValues = T>({
  control,
  name,
  ...fieldProps
}: FormInputProps<T, TOut>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({field: {value, onChange, onBlur}, fieldState: {error}}) => (
        <TextField
          {...fieldProps}
          value={value as string}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message}
        />
      )}
    />
  );
}
