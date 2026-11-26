import type {FuelType} from '@/types/vehicle.types';

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  GASOLINE: 'Benzin',
  DIESEL: 'Dízel',
  ELECTRIC: 'Elektromos',
  HYBRID: 'Hibrid',
  LPG: 'Benzin + LPG',
};

export const FUEL_TYPES = Object.keys(FUEL_TYPE_LABELS) as FuelType[];

export const FUEL_TYPE_OPTIONS = FUEL_TYPES.map((value) => ({
  value,
  label: FUEL_TYPE_LABELS[value],
}));
