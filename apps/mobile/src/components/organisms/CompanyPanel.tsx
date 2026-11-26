import {AppText} from '@/components/atoms/AppText';
import {Button} from '@/components/atoms/Button';
import {Card} from '@/components/atoms/Card';
import {ErrorText} from '@/components/atoms/ErrorText';
import {Label} from '@/components/atoms/Label';
import {CreateCompanyForm} from '@/components/forms/CompanyForms/CreateCompanyForm';
import {JoinCompanyForm} from '@/components/forms/CompanyForms/JoinCompanyForm';
import {InfoRow} from '@/components/molecules/InfoRow';
import {MemberRow} from '@/components/molecules/MemberRow';
import {ROLE_LABELS} from '@/constants/UserRoles';
import {useCompanyPage} from '@/hooks/useCompanyPage';

// Profil > Ceg: maganszemelynek csatlakozas / cegalapitas, ceges felhasznalonak a
// ceg adatai, adminnak a kod es a taglista is.
export function CompanyPanel() {
  const page = useCompanyPage();
  const {user, isAdmin, company} = page;

  if (!user.companyId) {
    return (
      <>
        <AppText variant="muted">
          Most magánszemélyként használod az appot. Csatlakozz egy céghez az admintól kapott kóddal,
          vagy hozz létre egy újat (te leszel az adminja).
        </AppText>
        <JoinCompanyForm />
        <CreateCompanyForm />
      </>
    );
  }

  return (
    <>
      <ErrorText message={page.error} />
      {company ? (
        <Card>
          <AppText variant="subtitle">{company.name}</AppText>
          <InfoRow label="Adószám" value={company.taxId} />
          <InfoRow label="Szerepköröd" value={ROLE_LABELS[user.role]} />
        </Card>
      ) : null}

      {isAdmin && company?.joinCode ? (
        <Card>
          <Label>Csatlakozási kód</Label>
          <AppText variant="title" selectable style={{letterSpacing: 3}}>
            {company.joinCode}
          </AppText>
          <AppText variant="muted">Ezzel a kóddal csatlakozhatnak a munkatársak.</AppText>
          <Button title="Kód megosztása" variant="secondary" onPress={page.shareJoinCode} />
          <Button title="Új kód generálása" variant="secondary" onPress={page.regenerateJoinCode} />
        </Card>
      ) : null}

      {isAdmin ? (
        <Card>
          <Label>{`Tagok (${page.members.length})`}</Label>
          {page.members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              isMe={member.id === user.id}
              onToggleRole={() => page.toggleMemberRole(member)}
              onRemove={() => page.removeMember(member)}
            />
          ))}
        </Card>
      ) : null}

      <Button
        title="Kilépés a cégből"
        variant="danger"
        onPress={page.leaveCompany}
        loading={page.leaving}
      />
    </>
  );
}
