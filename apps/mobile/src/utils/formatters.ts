import type {Vehicle} from '@/types/vehicle.types';

export function vehicleTitle(vehicle: Vehicle): string {
  return `${vehicle.make} ${vehicle.model}`;
}

export function formatMileage(km: number): string {
  return `${km.toLocaleString('hu-HU')} km`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('hu-HU');
}

export function fullName(person: {firstName: string; lastName: string | null}): string {
  return [person.lastName, person.firstName].filter(Boolean).join(' ');
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('hu-HU', {dateStyle: 'short', timeStyle: 'short'});
}
