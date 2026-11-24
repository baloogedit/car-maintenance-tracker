import {Button} from '@/components/atoms/Button';
import {ErrorText} from '@/components/atoms/ErrorText';
import {FormInput} from '@/components/forms/FormInput';
import {PASSWORD_MIN_LENGTH} from '@/constants/validation.constants';
import {useRegistrationForm} from '@/hooks/useRegistrationForm';

export function UserRegistrationForm() {
  const {control, onSubmit, isSubmitting, serverError} = useRegistrationForm();
  return (
    <>
      <FormInput control={control} name="firstName" label="Keresztnév" autoComplete="given-name" />
      <FormInput
        control={control}
        name="lastName"
        label="Vezetéknév (nem kötelező)"
        autoComplete="family-name"
      />
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
        placeholder={`legalább ${PASSWORD_MIN_LENGTH} karakter`}
        secureTextEntry
        autoComplete="new-password"
      />
      <ErrorText message={serverError} />
      <Button title="Regisztráció" onPress={onSubmit} loading={isSubmitting} />
    </>
  );
}
