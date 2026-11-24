import {Stack, useLocalSearchParams} from 'expo-router';

import {VehicleForm} from '@/components/forms/VehicleForms/VehicleForm';
import {ScreenContainer} from '@/components/organisms/ScreenContainer';

// Uj jarmu, vagy ?id=... eseten a meglevo szerkesztese (modalkent nyilik).
export default function VehicleFormScreen() {
  const {id} = useLocalSearchParams<{id?: string}>();
  return (
    <ScreenContainer>
      <Stack.Screen options={{title: id ? 'Jármű szerkesztése' : 'Új jármű'}} />
      <VehicleForm vehicleId={id} />
    </ScreenContainer>
  );
}
