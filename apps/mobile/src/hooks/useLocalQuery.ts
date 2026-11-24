import {useFocusEffect} from 'expo-router';
import {useCallback, useState} from 'react';

import {useSyncStore} from '@/store/useSyncStore';
import {errorMessage} from '@/utils/errorMessage';

// Lekerdezes a helyi SQLite-bol. Ujrafut a kepernyore lepeskor, es minden helyi
// adatvaltozas utan (mentes, torles, beerkezo szinkron: dataVersion), igy a lista
// mindig a helyi adatbazis aktualis allapotat mutatja.
// A `query` legyen stabil (modul szintu fuggveny vagy useCallback).
export function useLocalQuery<T>(query: () => Promise<T>) {
  const dbReady = useSyncStore((state) => state.dbReady);
  const dataVersion = useSyncStore((state) => state.dataVersion);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      // a dataVersion valtozasa (helyi iras, beerkezo szinkron) ujrafuttatja a lekerdezest
      void dataVersion;
      if (!dbReady) {
        return;
      }
      let active = true;
      query()
        .then((result) => {
          if (active) {
            setData(result);
            setError(null);
          }
        })
        .catch((e: unknown) => {
          if (active) {
            setError(errorMessage(e));
          }
        });
      return () => {
        active = false;
      };
    }, [query, dbReady, dataVersion]),
  );

  return {data, error};
}
