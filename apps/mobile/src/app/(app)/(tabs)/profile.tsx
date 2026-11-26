import {useState} from 'react';

import {SegmentedControl, type SegmentOption} from '@/components/molecules/SegmentedControl';
import {CompanyPanel} from '@/components/organisms/CompanyPanel';
import {PrivateProfilePanel} from '@/components/organisms/PrivateProfilePanel';
import {ScreenContainer} from '@/components/organisms/ScreenContainer';
import {useCurrentUser} from '@/store/useAuthStore';

type ProfileSection = 'private' | 'company';

const SECTION_OPTIONS: SegmentOption<ProfileSection>[] = [
  {value: 'private', label: 'Privát'},
  {value: 'company', label: 'Cég'},
];

export default function ProfileScreen() {
  const user = useCurrentUser();
  const [section, setSection] = useState<ProfileSection>('private');
  // Cegvaltaskor (csatlakozas, kilepes) a key miatt uj panel jon letre, friss adatokkal.
  const companyPanelKey = user.companyId ?? 'no-company';
  return (
    <ScreenContainer title="Profil">
      <SegmentedControl options={SECTION_OPTIONS} value={section} onChange={setSection} />
      {section === 'private' ? <PrivateProfilePanel /> : <CompanyPanel key={companyPanelKey} />}
    </ScreenContainer>
  );
}
