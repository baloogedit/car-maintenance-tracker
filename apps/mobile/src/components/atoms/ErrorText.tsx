import {useTheme} from '@/hooks/useTheme';

import {AppText} from './AppText';

export function ErrorText({message}: {message?: string | null}) {
  const theme = useTheme();
  if (!message) {
    return null;
  }
  return (
    <AppText variant="muted" style={{color: theme.danger}}>
      {message}
    </AppText>
  );
}
