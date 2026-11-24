import {AppText} from '@/components/atoms/AppText';
import {Button} from '@/components/atoms/Button';
import {Card} from '@/components/atoms/Card';
import {ErrorText} from '@/components/atoms/ErrorText';
import {FormInput} from '@/components/forms/FormInput';
import {useCreateCompanyForm} from '@/hooks/useCompanyForms';

export function CreateCompanyForm() {
  const {control, onSubmit, isSubmitting, serverError} = useCreateCompanyForm();
  return (
    <Card>
      <AppText variant="subtitle">Új cég létrehozása</AppText>
      <FormInput control={control} name="name" label="Cégnév" placeholder="Gyors Futár Bt." />
      <FormInput
        control={control}
        name="taxId"
        label="Adószám (nem kötelező)"
        placeholder="RO12345678"
        autoCapitalize="characters"
      />
      <ErrorText message={serverError} />
      <Button
        title="Cég létrehozása"
        variant="secondary"
        onPress={onSubmit}
        loading={isSubmitting}
      />
    </Card>
  );
}
