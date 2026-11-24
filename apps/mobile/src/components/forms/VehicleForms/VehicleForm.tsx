import {StyleSheet, View} from 'react-native';

import {Button} from '@/components/atoms/Button';
import {ErrorText} from '@/components/atoms/ErrorText';
import {FormChoiceChips} from '@/components/forms/FormChoiceChips';
import {FormInput} from '@/components/forms/FormInput';
import {FormSwitch} from '@/components/forms/FormSwitch';
import {FUEL_TYPE_OPTIONS} from '@/constants/FuelTypes';
import {Spacing} from '@/constants/theme';
import {VIN_LENGTH} from '@/constants/validation.constants';
import {useVehicleForm} from '@/hooks/useVehicleForm';

export function VehicleForm({vehicleId}: {vehicleId?: string}) {
  const {control, onSubmit, isSubmitting, serverError, showCompanySwitch} =
    useVehicleForm(vehicleId);

  return (
    <>
      <FormInput control={control} name="make" label="Márka" placeholder="Volkswagen" />
      <FormInput control={control} name="model" label="Modell" placeholder="Golf" />
      <View style={styles.row}>
        <View style={styles.flex}>
          <FormInput
            control={control}
            name="year"
            label="Évjárat"
            placeholder="2016"
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.flex}>
          <FormInput
            control={control}
            name="currentMileage"
            label="Km-óra állás"
            placeholder="182000"
            keyboardType="number-pad"
          />
        </View>
      </View>
      <FormInput
        control={control}
        name="licensePlate"
        label="Rendszám"
        placeholder="B-123-ABC"
        autoCapitalize="characters"
      />
      <FormChoiceChips
        control={control}
        name="fuelType"
        label="Üzemanyag"
        options={FUEL_TYPE_OPTIONS}
      />
      <FormInput
        control={control}
        name="engineType"
        label="Motor (nem kötelező)"
        placeholder="1.6 TDI"
      />
      <FormInput
        control={control}
        name="vin"
        label="Alvázszám / VIN (nem kötelező)"
        autoCapitalize="characters"
        maxLength={VIN_LENGTH}
      />
      {showCompanySwitch ? (
        <FormSwitch
          control={control}
          name="isCompanyVehicle"
          title="Céges jármű"
          description={(isCompany) =>
            isCompany ? 'A cég minden tagja látja.' : 'Saját magánjármű, a cég nem látja.'
          }
        />
      ) : null}
      <ErrorText message={serverError} />
      <Button title="Mentés" onPress={onSubmit} loading={isSubmitting} />
    </>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', gap: Spacing.three},
  flex: {flex: 1},
});
