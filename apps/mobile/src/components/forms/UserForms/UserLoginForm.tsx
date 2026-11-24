import {Button} from '@/components/atoms/Button';
import {ErrorText} from '@/components/atoms/ErrorText';
import {FormInput} from '@/components/forms/FormInput';
import {useLoginForm} from '@/hooks/useLoginForm';

export function UserLoginForm() {
  const {control, onSubmit, isSubmitting, serverError} = useLoginForm();
  return (
    <>
      <FormInput
        control={control}
        name="email"
        label="E-mail"
        placeholder="nev@pelda.hu"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />
      <FormInput
        control={control}
        name="password"
        label="Jelszó"
        secureTextEntry
        autoComplete="password"
        onSubmitEditing={onSubmit}
      />
      <ErrorText message={serverError} />
      <Button title="Belépés" onPress={onSubmit} loading={isSubmitting} />
    </>
  );
}
