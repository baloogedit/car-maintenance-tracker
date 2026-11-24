import {zodResolver} from '@hookform/resolvers/zod';
import {router} from 'expo-router';
import {useCallback, useEffect} from 'react';
import {useForm} from 'react-hook-form';

import {createVehicle, getVehicle, updateVehicle} from '@/db/repositories/vehicleRepository';
import {VehicleSchema} from '@/schemas/VehicleSchema';
import {useCurrentUser} from '@/store/useAuthStore';
import {notifyLocalChange} from '@/sync/syncEngine';
import type {FuelType, VehicleInput} from '@/types/vehicle.types';

import {useFormSubmit} from './useFormSubmit';

// Uj jarmu felvetele, vagy vehicleId eseten a meglevo szerkesztese. A mentes a helyi
// SQLite-ba megy (internet nelkul is mukodik), a szerverre a szinkron viszi fel.
export function useVehicleForm(vehicleId?: string) {
  const user = useCurrentUser();
  const isEdit = !!vehicleId;

  const form = useForm({
    resolver: zodResolver(VehicleSchema),
    defaultValues: {
      make: '',
      model: '',
      year: '',
      currentMileage: '',
      licensePlate: '',
      fuelType: 'GASOLINE' as FuelType,
      engineType: '',
      vin: '',
      isCompanyVehicle: true,
    },
  });
  const {reset} = form;

  // Szerkeszteskor a meglevo adatokkal toltjuk ki az urlapot.
  useEffect(() => {
    if (!vehicleId) {
      return;
    }
    void getVehicle(vehicleId).then((v) => {
      if (v) {
        reset({
          make: v.make,
          model: v.model,
          year: String(v.year),
          currentMileage: String(v.currentMileage),
          licensePlate: v.licensePlate ?? '',
          fuelType: v.fuelType,
          engineType: v.engineType ?? '',
          vin: v.vin ?? '',
          isCompanyVehicle: v.companyId !== null,
        });
      }
    });
  }, [vehicleId, reset]);

  const action = useCallback(
    async (input: VehicleInput) => {
      if (vehicleId) {
        await updateVehicle(vehicleId, input);
      } else {
        await createVehicle(input, user);
      }
      notifyLocalChange();
      router.back();
    },
    [vehicleId, user],
  );
  const {serverError, submit} = useFormSubmit(action);

  return {
    control: form.control,
    isEdit,
    // a kapcsolo csak uj jarmunel es csak ceges felhasznalonal latszik
    showCompanySwitch: !isEdit && !!user.companyId,
    isSubmitting: form.formState.isSubmitting,
    serverError,
    onSubmit: () => void form.handleSubmit(submit)(),
  };
}
