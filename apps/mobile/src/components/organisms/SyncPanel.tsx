import {AppText} from '@/components/atoms/AppText';
import {Button} from '@/components/atoms/Button';
import {Card} from '@/components/atoms/Card';
import {ErrorText} from '@/components/atoms/ErrorText';
import {Label} from '@/components/atoms/Label';
import {InfoRow} from '@/components/molecules/InfoRow';
import {SyncStatusPill} from '@/components/molecules/SyncStatusPill';
import {useSyncNow} from '@/hooks/useSyncNow';
import {useSyncStore} from '@/store/useSyncStore';
import {formatDateTime} from '@/utils/formatters';

// Profil > Privat: a szinkron allapota es kezi inditasa.
export function SyncPanel() {
  const pending = useSyncStore((state) => state.pendingCount);
  const failed = useSyncStore((state) => state.failedCount);
  const lastSyncAt = useSyncStore((state) => state.lastSyncAt);
  const lastError = useSyncStore((state) => state.lastError);
  const {refreshing, syncNow, retryFailedNow} = useSyncNow();

  return (
    <Card>
      <Label>Szinkronizálás</Label>
      <SyncStatusPill />
      <InfoRow
        label="Utolsó szinkron"
        value={lastSyncAt ? formatDateTime(lastSyncAt) : 'még nem volt'}
      />
      <InfoRow label="Függőben" value={pending} />
      {failed > 0 ? <InfoRow label="Elutasított" value={failed} /> : null}
      <ErrorText message={lastError} />
      <AppText variant="muted">
        Az adatok a telefonon tárolódnak, internet nélkül is működik. Ha van kapcsolat, az app
        magától szinkronizál.
      </AppText>
      <Button
        title="Szinkronizálás most"
        variant="secondary"
        loading={refreshing}
        onPress={syncNow}
      />
      {failed > 0 ? (
        <Button title="Elutasítottak újraküldése" variant="secondary" onPress={retryFailedNow} />
      ) : null}
    </Card>
  );
}
