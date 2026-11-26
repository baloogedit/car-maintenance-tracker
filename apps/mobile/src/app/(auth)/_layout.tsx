import {Redirect, Stack} from 'expo-router';

import {useAuthStore} from '@/store/useAuthStore';

// Belepve nincs itt keresnivalo: irany a fooldal.
export default function AuthLayout() {
  const status = useAuthStore((state) => state.status);
  if (status === 'signedIn') {
    return <Redirect href="/" />;
  }
  return (
    <Stack>
      <Stack.Screen name="login" options={{title: 'Belépés'}} />
      <Stack.Screen name="register" options={{title: 'Regisztráció'}} />
    </Stack>
  );
}
