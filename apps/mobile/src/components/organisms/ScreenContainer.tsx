import type {ReactNode} from 'react';
import {RefreshControl, ScrollView, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {AppText} from '@/components/atoms/AppText';
import {Spacing} from '@/constants/theme';
import {useTheme} from '@/hooks/useTheme';

interface ScreenContainerProps {
  children: ReactNode;
  // A fuleken nincs navigacios fejlec: ott a kepernyo maga rajzolja ki a cimet
  // (es a jobb oldali gombot), a felso biztonsagi savval egyutt.
  title?: string;
  headerRight?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}

// Gorgetheto kepernyo-keret egyseges hatterrel es margoval; lehuzasra frissit.
export function ScreenContainer({
  children,
  title,
  headerRight,
  refreshing = false,
  onRefresh,
}: ScreenContainerProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{backgroundColor: theme.background}}
      contentContainerStyle={[
        styles.content,
        title ? {paddingTop: insets.top + Spacing.four} : undefined,
      ]}
      contentInsetAdjustmentBehavior={title ? 'never' : 'automatic'}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        ) : undefined
      }
    >
      {title ? (
        <View style={styles.header}>
          <AppText variant="title">{title}</AppText>
          {headerRight}
        </View>
      ) : null}
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {padding: Spacing.four, gap: Spacing.four, paddingBottom: Spacing.six},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
});
