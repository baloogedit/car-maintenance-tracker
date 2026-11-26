import {z} from 'zod';

import {FUEL_TYPES} from '@/constants/FuelTypes';
import {
  LICENSE_PLATE_MAX_LENGTH,
  VEHICLE_MAX_YEAR,
  VEHICLE_MIN_YEAR,
  VEHICLE_TEXT_MAX_LENGTH,
  VIN_LENGTH,
} from '@/constants/validation.constants';
import {VALIDATION_MESSAGES as M} from '@/constants/validationMessages';

import {optionalText} from './schemaUtils';

// A szoveges mezokbol (TextInput mindig stringet ad) a backend altal vart tipusok lesznek.
export const VehicleSchema = z.object({
  make: z.string().trim().min(1, M.required).max(VEHICLE_TEXT_MAX_LENGTH, M.tooLong),
  model: z.string().trim().min(1, M.required).max(VEHICLE_TEXT_MAX_LENGTH, M.tooLong),
  year: z
    .string()
    .trim()
    .min(1, M.required)
    .transform(Number)
    .pipe(z.number(M.year).int(M.year).min(VEHICLE_MIN_YEAR, M.year).max(VEHICLE_MAX_YEAR, M.year)),
  currentMileage: z
    .string()
    .trim()
    .transform((value) => (value ? Number(value) : undefined))
    .pipe(z.number(M.mileage).int(M.mileage).min(0, M.mileage).optional()),
  licensePlate: optionalText(LICENSE_PLATE_MAX_LENGTH).transform((v) => v?.toUpperCase()),
  fuelType: z.enum(FUEL_TYPES),
  engineType: optionalText(VEHICLE_TEXT_MAX_LENGTH),
  vin: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase() || undefined)
    .pipe(z.string().length(VIN_LENGTH, M.vin).optional()),
  isCompanyVehicle: z.boolean(),
});

export type VehicleFormValues = z.input<typeof VehicleSchema>;
export type VehicleFormOutput = z.output<typeof VehicleSchema>;
