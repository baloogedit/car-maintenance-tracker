import {zodResolver} from '@hookform/resolvers/zod';
import {useCallback} from 'react';
import {useForm} from 'react-hook-form';

import {companyApi} from '@/api/companyApi';
import {CreateCompanySchema} from '@/schemas/CreateCompanySchema';
import {JoinCompanySchema} from '@/schemas/JoinCompanySchema';
import {useAuthStore} from '@/store/useAuthStore';
import type {CreateCompanyRequest} from '@/types/company.types';

import {useFormSubmit} from './useFormSubmit';

// Cegalapitas: a letrehozo lesz az admin. A backend uj tokenpart ad (mas szerepkorrel),
// ezert a teljes munkamenetet frissitjuk.
export function useCreateCompanyForm() {
  const setSession = useAuthStore((state) => state.setSession);
  const form = useForm({
    resolver: zodResolver(CreateCompanySchema),
    defaultValues: {name: '', taxId: ''},
  });
  const action = useCallback(
    async (values: CreateCompanyRequest) => {
      await setSession(await companyApi.create(values));
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

// Csatlakozas tagkent az admintol kapott koddal.
export function useJoinCompanyForm() {
  const setSession = useAuthStore((state) => state.setSession);
  const form = useForm({
    resolver: zodResolver(JoinCompanySchema),
    defaultValues: {joinCode: ''},
  });
  const action = useCallback(
    async ({joinCode}: {joinCode: string}) => {
      await setSession(await companyApi.join(joinCode));
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
