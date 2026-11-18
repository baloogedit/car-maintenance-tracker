import {Alert, Platform} from 'react-native';

// Megerosito kerdes. Weben az Alert gombjai nem mukodnek, ott window.confirm.
export function confirmAction(
  title: string,
  message: string,
  confirmLabel: string,
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      {text: 'Mégse', style: 'cancel', onPress: () => resolve(false)},
      {text: confirmLabel, style: 'destructive', onPress: () => resolve(true)},
    ]);
  });
}

export function showError(message: string) {
  if (Platform.OS === 'web') {
    window.alert(message);
    return;
  }
  Alert.alert('Hiba', message);
}
