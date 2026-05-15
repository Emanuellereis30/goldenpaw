import { AppThemeProvider } from '@/hooks/use-app-theme';
import { Slot } from 'expo-router';

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <Slot />
    </AppThemeProvider>
  );
}
