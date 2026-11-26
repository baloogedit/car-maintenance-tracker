import {router, Stack, useLocalSearchParams} from 'expo-router';

import {AppText} from '@/components/atoms/AppText';
import {Badge} from '@/components/atoms/Badge';
import {Button} from '@/components/atoms/Button';
import {Card} from '@/components/atoms/Card';
import {ErrorText} from '@/components/atoms/ErrorText';
import {Label} from '@/components/atoms/Label';
import {InfoRow} from '@/components/molecules/InfoRow';
import {ScreenContainer} from '@/components/organisms/ScreenContainer';
import {FUEL_TYPE_LABELS} from '@/constants/FuelTypes';
import {useVehicleDetails} from '@/hooks/useVehicleDetails';
import {formatDate, formatMileage, vehicleTitle} from '@/utils/formatters';

export default function VehicleDetailScreen() {
  const {vehicleId} = useLocalSearchParams<{vehicleId: string}>();
  const {vehicle, companyName, error, canEdit, deleting, deleteVehicle} =
    useVehicleDetails(vehicleId);

  return (
    <ScreenContainer>
      <Stack.Screen options={{title: vehicle ? vehicleTitle(vehicle) : 'Jármű'}} />
      <ErrorText message={error} />
      {vehicle ? (
        <>
          <Card>
            <AppText variant="title">{vehicleTitle(vehicle)}</AppText>
            {vehicle.companyId ? (
              <Badge label={companyName ? `Céges · ${companyName}` : 'Céges'} />
            ) : (
              <Badge label="Magánjármű" tone="neutral" />
            )}
            <AppText variant="subtitle">{formatMileage(vehicle.currentMileage)}</AppText>
            {vehicle.synced ? null : (
              <AppText variant="muted">
                Még nincs a szerveren, a következő szinkronnal felkerül.
              </AppText>
            )}
          </Card>
          <Card>
            <InfoRow label="Rendszám" value={vehicle.licensePlate} />
            <InfoRow label="Évjárat" value={vehicle.year} />
            <InfoRow label="Üzemanyag" value={FUEL_TYPE_LABELS[vehicle.fuelType]} />
            <InfoRow label="Motor" value={vehicle.engineType} />
            <InfoRow label="Alvázszám (VIN)" value={vehicle.vin} />
            <InfoRow label="Felvéve" value={formatDate(vehicle.createdAt)} />
          </Card>
          <Card>
            <Label>Hamarosan</Label>
            <AppText variant="muted">
              Tankolások, szervizek, biztosítás és rovinieta, előrejelzések, OBD2 diagnózis.
            </AppText>
          </Card>
          {canEdit ? (
            <>
              <Button
                title="Szerkesztés"
                variant="secondary"
                onPress={() => router.push({pathname: '/vehicle-form', params: {id: vehicle.id}})}
              />
              <Button
                title="Jármű törlése"
                variant="danger"
                loading={deleting}
                onPress={deleteVehicle}
              />
            </>
          ) : (
            <AppText variant="muted">
              Ezt a járművet csak a tulajdonosa vagy a cég adminja szerkesztheti.
            </AppText>
          )}
        </>
      ) : null}
    </ScreenContainer>
  );
}
