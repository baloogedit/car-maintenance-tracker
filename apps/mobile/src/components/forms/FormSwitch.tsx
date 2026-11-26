import {type Control, Controller, type FieldValues, type Path} from 'react-hook-form';

import {SwitchRow} from '@/components/molecules/SwitchRow';

interface FormSwitchProps<T extends FieldValues, TOut extends FieldValues = T> {
  // a harmadik tipusparameter a zod altal atalakitott (bekuldott) ertekek tipusa
  control: Control<T, unknown, TOut>;
  name: Path<T>;
  title: string;
  // a leiras a kapcsolo allapotatol fugghet
  description: (value: boolean) => string;
}

export function FormSwitch<T extends FieldValues, TOut extends FieldValues = T>({
  control,
  name,
  title,
  description,
}: FormSwitchProps<T, TOut>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({field: {value, onChange}}) => (
        <SwitchRow
          title={title}
          description={description(value as boolean)}
          value={value as boolean}
          onChange={onChange}
        />
      )}
    />
  );
}
