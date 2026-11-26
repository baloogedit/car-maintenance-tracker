import {StyleSheet, View} from 'react-native';

import {AppText} from '@/components/atoms/AppText';
import {Card} from '@/components/atoms/Card';
import {Icon} from '@/components/atoms/Icon';
import {FUEL_TYPE_LABELS} from '@/constants/FuelTypes';
import {Radius, Spacing} from '@/constants/theme';
import {useTheme} from '@/hooks/useTheme';
import type {Vehicle} from '@/types/vehicle.types';
import {formatMileage, vehicleTitle} from '@/utils/formatters';

export function VehicleCard({vehicle, onPress}: {vehicle: Vehicle; onPress: () => void}) {
  const theme = useTheme();
  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <View style={[styles.iconBox, {backgroundColor: theme.primarySoft}]}>
          <Icon
            name={{ios: 'car.fill', android: 'directions_car', web: 'directions_car'}}
            color={theme.primary}
          />
        </View>
        <View style={styles.texts}>
          <View style={styles.titleRow}>
            <AppText variant="subtitle">{vehicleTitle(vehicle)}</AppText>
            {/* ures kor = helyi valtozas, ami meg nincs a szerveren */}
            {vehicle.synced ? null : (
              <View
                accessibilityLabel="Szinkronra vár"
                style={[styles.pendingDot, {borderColor: theme.secondary}]}
              />
            )}
          </View>
          <AppText variant="muted">
            {[vehicle.licensePlate, vehicle.year, FUEL_TYPE_LABELS[vehicle.fuelType]]
              .filter(Boolean)
              .join(' · ')}
          </AppText>
        </View>
        <AppText style={styles.mileage}>{formatMileage(vehicle.currentMileage)}</AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: Spacing.three},
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {flex: 1, gap: 2},
  titleRow: {flexDirection: 'row', alignItems: 'center', gap: Spacing.two},
  pendingDot: {width: 10, height: 10, borderRadius: Radius.full, borderWidth: 2},
  mileage: {fontWeight: '600'},
});
