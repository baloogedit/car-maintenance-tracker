import {router} from 'expo-router';

import {AppText} from '@/components/atoms/AppText';
import {Button} from '@/components/atoms/Button';
import {UserLoginForm} from '@/components/forms/UserForms/UserLoginForm';
import {ScreenContainer} from '@/components/organisms/ScreenContainer';

export default function LoginScreen() {
  return (
    <ScreenContainer>
      <AppText variant="muted">Jelentkezz be a járműveid és a céges flotta kezeléséhez.</AppText>
      <UserLoginForm />
      <Button
        title="Új fiók létrehozása"
        variant="secondary"
        onPress={() => router.push('/register')}
      />
    </ScreenContainer>
  );
}
