import {zodResolver} from '@hookform/resolvers/zod';
import {useCallback} from 'react';
import {useForm} from 'react-hook-form';

import {authApi} from '@/api/authApi';
import {UserLoginSchema} from '@/schemas/UserLoginSchema';
import {useAuthStore} from '@/store/useAuthStore';

import {useFormSubmit} from './useFormSubmit';

export function useLoginForm() {
  const setSession = useAuthStore((state) => state.setSession);
  const form = useForm({
    resolver: zodResolver(UserLoginSchema),
    defaultValues: {email: '', password: ''},
  });

  // Sikeres belepes utan az (auth) layout atiranyit a fooldalra.
  const action = useCallback(
    async (values: {email: string; password: string}) => {
      await setSession(await authApi.login(values));
    },
    [setSession],
  );
  const {serverError, submit} = useFormSubmit(action);

  return {
    control: form.control,
    isSubmitting: form.formState.isSubmitting,
    serverError,
    onSubmit: () => void form.handleSubmit(submit)(),
  };
}
