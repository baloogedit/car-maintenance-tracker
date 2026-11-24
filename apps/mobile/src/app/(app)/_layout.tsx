import {Redirect, Stack} from 'expo-router';
import {ActivityIndicator, StyleSheet, View} from 'react-native';

import {useTheme} from '@/hooks/useTheme';
import {useAuthStore} from '@/store/useAuthStore';
import {useSyncStore} from '@/store/useSyncStore';
import {SyncInitializer} from '@/utils/SyncInitializer';

// A bejelentkezett resz: a fulek, folottuk a jarmu adatlapja es az urlap (modal).
// A SyncInitializer megnyitja a felhasznalo helyi adatbazisat; amig ez tart, toltojel.
export default function AppLayout() {
  const status = useAuthStore((state) => state.status);
  const dbReady = useSyncStore((state) => state.dbReady);
  const theme = useTheme();

  if (status !== 'signedIn') {
    return <Redirect href="/login" />;
  }
  return (
    <>
      <SyncInitializer />
      {dbReady ? (
        <Stack>
          <Stack.Screen name="(tabs)" options={{headerShown: false}} />
          <Stack.Screen name="vehicle/[vehicleId]" options={{title: 'Jármű'}} />
          <Stack.Screen name="vehicle-form" options={{presentation: 'modal', title: 'Új jármű'}} />
        </Stack>
      ) : (
        <View style={[styles.loading, {backgroundColor: theme.background}]}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center'},
});
