import {Stack} from 'expo-router';
import {ActivityIndicator, StyleSheet, View} from 'react-native';

import {useTheme} from '@/hooks/useTheme';
import {useAuthStore} from '@/store/useAuthStore';
import {AppThemeProvider} from '@/utils/AppThemeProvider';
import {AuthInitializer} from '@/utils/AuthInitializer';

// Gyoker elrendezes. Az (auth) es az (app) csoport sajat _layout-ja iranyit at a
// masikra a bejelentkezes allapota szerint (Redirect).
export default function RootLayout() {
  return (
    <AppThemeProvider>
      <AuthInitializer />
      <RootNavigator />
    </AppThemeProvider>
  );
}

function RootNavigator() {
  const status = useAuthStore((state) => state.status);
  const theme = useTheme();

  // Amig a mentett munkamenetet visszaallitjuk, egy toltojelet mutatunk.
  if (status === 'loading') {
    return (
      <View style={[styles.loading, {backgroundColor: theme.background}]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{headerShown: false}}>
      <Stack.Screen name="(app)" />
      <Stack.Screen name="(auth)" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center'},
});
