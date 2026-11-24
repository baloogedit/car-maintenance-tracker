import {useCallback, useState} from 'react';

import {errorMessage} from '@/utils/errorMessage';

// Az urlap bekuldese: a szerver hibauzenetet (pl. "Hibas e-mail cim vagy jelszo.")
// eltaroljuk, hogy az urlap alatt megjelenjen. A mezohibakat a zod sema adja.
export function useFormSubmit<T>(action: (values: T) => Promise<void>) {
  const [serverError, setServerError] = useState<string | null>(null);

  const submit = useCallback(
    async (values: T) => {
      setServerError(null);
      try {
        await action(values);
      } catch (e) {
        setServerError(errorMessage(e));
      }
    },
    [action],
  );

  return {serverError, submit};
}