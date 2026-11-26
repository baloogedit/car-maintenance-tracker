import {SymbolView, type SymbolViewProps} from 'expo-symbols';
import type {ColorValue} from 'react-native';

// iOS-en SF Symbol, Androidon es weben Material Symbol.
export type IconName = SymbolViewProps['name'];

export function Icon({name, color, size = 24}: {name: IconName; color: ColorValue; size?: number}) {
  return <SymbolView name={name} size={size} tintColor={color} />;
}
