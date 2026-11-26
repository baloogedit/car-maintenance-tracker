import {AppText} from '@/components/atoms/AppText';
import {Button} from '@/components/atoms/Button';
import {Card} from '@/components/atoms/Card';
import {Label} from '@/components/atoms/Label';
import {InfoRow} from '@/components/molecules/InfoRow';
import {ThemeSelector} from '@/components/molecules/ThemeSelector';
import {API_BASE_URL} from '@/constants/apiConfig';
import {ROLE_LABELS} from '@/constants/UserRoles';
import {useLogout} from '@/hooks/useLogout';
import {useCurrentUser} from '@/store/useAuthStore';
import {fullName} from '@/utils/formatters';

import {SyncPanel} from './SyncPanel';

// Profil > Privat: szemelyes adatok, szinkron, tema, kijelentkezes.
export function PrivateProfilePanel() {
  const user = useCurrentUser();
  const logout = useLogout();
  return (
    <>
      <Card>
        <AppText variant="subtitle">{fullName(user)}</AppText>
        <InfoRow label="E-mail" value={user.email} />
        <InfoRow label="Szerepkör" value={ROLE_LABELS[user.role]} />
      </Card>
      <SyncPanel />
      <Card>
        <ThemeSelector />
      </Card>
      <Card>
        <Label>Szerver</Label>
        <AppText variant="muted" selectable>
          {API_BASE_URL}
        </AppText>
      </Card>
      <Button title="Kijelentkezés" variant="danger" onPress={logout} />
    </>
  );
}
