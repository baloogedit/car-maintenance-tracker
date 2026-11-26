import {router} from 'expo-router';
import {useState} from 'react';
import {View} from 'react-native';

import {AppText} from '@/components/atoms/AppText';
import {Button} from '@/components/atoms/Button';
import {Card} from '@/components/atoms/Card';
import {ErrorText} from '@/components/atoms/ErrorText';
import {SegmentedControl, type SegmentOption} from '@/components/molecules/SegmentedControl';
import {SyncStatusPill} from '@/components/molecules/SyncStatusPill';
import {VehicleCard} from '@/components/molecules/VehicleCard';
import {ScreenContainer} from '@/components/organisms/ScreenContainer';
import {listVehicles} from '@/db/repositories/vehicleRepository';
import {useLocalQuery} from '@/hooks/useLocalQuery';
import {useSyncNow} from '@/hooks/useSyncNow';
import {useCurrentUser} from '@/store/useAuthStore';

type VehicleFilter = 'own' | 'company';

const FILTER_OPTIONS: SegmentOption<VehicleFilter>[] = [
  {value: 'company', label: 'Céges'},
  {value: 'own', label: 'Saját'},
];

export default function VehiclesScreen() {
  const user = useCurrentUser();
  // A lista a helyi SQLite-bol jon (offline is), a lehuzas szinkront indit.
  const {data: vehicles, error} = useLocalQuery(listVehicles);
  const {refreshing, syncNow} = useSyncNow();
  const [filter, setFilter] = useState<VehicleFilter>('company');

  // A valaszto csak ceges felhasznalonak jelenik meg. Ceges = a ceg osszes jarmuve,
  // Sajat = a sajat maganjarmuveim (amiket a ceg nem lat).
  const hasCompany = !!user.companyId;
  const shown = (vehicles ?? []).filter((v) => {
    if (!hasCompany) {
      return true;
    }
    return filter === 'company' ? v.companyId !== null : v.companyId === null;
  });

  const openForm = () => router.push('/vehicle-form');

  return (
    <ScreenContainer
      title="Járművek"
      refreshing={refreshing}
      onRefresh={syncNow}
      headerRight={
        <View style={{minWidth: 96}}>
          <Button title="+ Új" onPress={openForm} />
        </View>
      }
    >
      <SyncStatusPill />
      {hasCompany ? (
        <SegmentedControl options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
      ) : null}
      <ErrorText message={error} />

      {vehicles && shown.length === 0 ? (
        <Card>
          <AppText variant="subtitle">
            {hasCompany && filter === 'company'
              ? 'A cégnek még nincs járműve'
              : 'Még nincs járműved'}
          </AppText>
          <AppText variant="muted">
            Vedd fel az első járművet, és kezdd el a nyilvántartást.
          </AppText>
          <Button title="Jármű hozzáadása" onPress={openForm} />
        </Card>
      ) : null}

      {shown.map((vehicle) => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          onPress={() =>
            router.push({pathname: '/vehicle/[vehicleId]', params: {vehicleId: vehicle.id}})
          }
        />
      ))}
    </ScreenContainer>
  );
}
