import {type Control, Controller, type FieldValues, type Path} from 'react-hook-form';

import {ChoiceChips} from '@/components/molecules/ChoiceChips';

interface FormChoiceChipsProps<
  T extends FieldValues,
  V extends string,
  TOut extends FieldValues = T,
> {
  // a harmadik tipusparameter a zod altal atalakitott (bekuldott) ertekek tipusa
  control: Control<T, unknown, TOut>;
  name: Path<T>;
  label: string;
  options: {value: V; label: string}[];
}

export function FormChoiceChips<
  T extends FieldValues,
  V extends string,
  TOut extends FieldValues = T,
>({control, name, label, options}: FormChoiceChipsProps<T, V, TOut>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({field: {value, onChange}}) => (
        <ChoiceChips label={label} options={options} value={value as V} onChange={onChange} />
      )}
    />
  );
}
