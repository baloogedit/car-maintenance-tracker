import {AppText} from '@/components/atoms/AppText';
import {UserRegistrationForm} from '@/components/forms/UserForms/UserRegistrationForm';
import {ScreenContainer} from '@/components/organisms/ScreenContainer';

export default function RegisterScreen() {
  return (
    <ScreenContainer>
      <AppText variant="muted">
        Magánszemélyként regisztrálsz. Céghez csatlakozni vagy céget létrehozni belépés után a
        Profil fül Cég részén tudsz.
      </AppText>
      <UserRegistrationForm />
    </ScreenContainer>
  );
}
