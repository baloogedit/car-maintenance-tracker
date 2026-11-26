import {AppText} from '@/components/atoms/AppText';
import {Button} from '@/components/atoms/Button';
import {Card} from '@/components/atoms/Card';
import {ErrorText} from '@/components/atoms/ErrorText';
import {FormInput} from '@/components/forms/FormInput';
import {useJoinCompanyForm} from '@/hooks/useCompanyForms';

export function JoinCompanyForm() {
  const {control, onSubmit, isSubmitting, serverError} = useJoinCompanyForm();
  return (
    <Card>
      <AppText variant="subtitle">Csatlakozás céghez</AppText>
      <FormInput
        control={control}
        name="joinCode"
        label="Csatlakozási kód"
        placeholder="az admintól kapott kód"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <ErrorText message={serverError} />
      <Button title="Csatlakozás" onPress={onSubmit} loading={isSubmitting} />
    </Card>
  );
}
