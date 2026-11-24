import {router} from 'expo-router';
import {useCallback, useEffect, useState} from 'react';

import {companyApi} from '@/api/companyApi';
import {deleteVehicle, getVehicle} from '@/db/repositories/vehicleRepository';
import {useCurrentUser} from '@/store/useAuthStore';
import {notifyLocalChange} from '@/sync/syncEngine';
import {confirmAction, showError} from '@/utils/confirm';
import {errorMessage} from '@/utils/errorMessage';
import {vehicleTitle} from '@/utils/formatters';

import {useLocalQuery} from './useLocalQuery';

export function useVehicleDetails(vehicleId: string) {
  const user = useCurrentUser();
  const [deleting, setDeleting] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);

  const load = useCallback(() => getVehicle(vehicleId), [vehicleId]);
  const {data: vehicle, error} = useLocalQuery(load);

  // A ceg neve csak online toltheto be; offline egyszeruen "Ceges" latszik.
  const isCompanyVehicle = !!vehicle?.companyId;
  useEffect(() => {
    if (isCompanyVehicle) {
      companyApi
        .getMine()
        .then((company) => setCompanyName(company.name))
        .catch(() => undefined);
    }
  }, [isCompanyVehicle]);

  // Ugyanaz a szabaly, mint a backenden: a tulaj vagy a ceg adminja szerkeszthet.
  const canEdit =
    !!vehicle &&
    (vehicle.ownerUserId === user.id ||
      (user.role === 'COMPANY_ADMIN' && vehicle.companyId === user.companyId));

  const remove = useCallback(async () => {
    if (!vehicle) {
      return;
    }
    const ok = await confirmAction(
      'Jármű törlése',
      `Biztosan törlöd: ${vehicleTitle(vehicle)}? A hozzá tartozó bejegyzések is törlődnek.`,
      'Törlés',
    );
    if (!ok) {
      return;
    }
    setDeleting(true);
    try {
      await deleteVehicle(vehicle.id);
      notifyLocalChange();
      router.back();
    } catch (e) {
      setDeleting(false);
      showError(errorMessage(e));
    }
  }, [vehicle]);

  return {vehicle, companyName, error, canEdit, deleting, deleteVehicle: remove};
}
