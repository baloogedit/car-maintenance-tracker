import {
  PASSWORD_MIN_LENGTH,
  VEHICLE_MAX_YEAR,
  VEHICLE_MIN_YEAR,
  VIN_LENGTH,
} from './validation.constants';

export const VALIDATION_MESSAGES = {
  required: 'Kötelező mező.',
  email: 'Érvénytelen e-mail cím.',
  passwordMin: `A jelszó legalább ${PASSWORD_MIN_LENGTH} karakter legyen.`,
  tooLong: 'Túl hosszú.',
  year: `Az évjárat ${VEHICLE_MIN_YEAR} és ${VEHICLE_MAX_YEAR} közé essen.`,
  mileage: 'A km-óra állás nem negatív egész szám.',
  vin: `Az alvázszám pontosan ${VIN_LENGTH} karakter.`,
} as const;
