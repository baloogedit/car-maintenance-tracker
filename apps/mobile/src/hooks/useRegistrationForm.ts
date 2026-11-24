import {zodResolver} from '@hookform/resolvers/zod';
import {useCallback} from 'react';
import {useForm} from 'react-hook-form';

import {authApi} from '@/api/authApi';
import {UserRegisterSchema} from '@/schemas/UserRegisterSchema';
import {useAuthStore} from '@/store/useAuthStore';
import type {RegisterRequest} from '@/types/auth.types';

import {useFormSubmit} from './useFormSubmit';

export function useRegistrationForm() {
  const setSession = useAuthStore((state) => state.setSession);
  const form = useForm({
    resolver: zodResolver(UserRegisterSchema),
    defaultValues: {firstName: '', lastName: '', email: '', password: ''},
  });

  const action = useCallback(
    async (values: RegisterRequest) => {
      await setSession(await authApi.register(values));
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
