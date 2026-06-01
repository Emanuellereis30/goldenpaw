import { createContext, useContext, useMemo, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

export type AppThemeColors = {
  background: string;
  surface: string;
  primary: string;
  text: string;
  textSecondary: string;
  border: string;
  buttonBackground: string;
  error: string;
  secondary?: string;
  shadow?: string;
};

const ThemePalette: Record<ThemeMode, AppThemeColors> = {
  light: {
    background: '#F8F6F2',
    surface: '#FFFFFF',
    primary: '#D4AF37',
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    buttonBackground: 'rgba(212, 175, 55, 0.1)',
    error: '#dc3545',
    secondary: '#927957',
    shadow: 'rgba(0,0,0,0.08)',
  },
  dark: {
    background: '#121212',
    surface: '#1E1E1E',
    primary: '#D4AF37',
    text: '#F5F5F5',
    textSecondary: '#A1A1AA',
    border: '#2A2A2A',
    buttonBackground: 'rgba(212, 175, 55, 0.15)',
    error: '#dc3545',
    secondary: '#2A2A2A',
    shadow: 'rgba(0,0,0,0.6)',
  },
};

type AppThemeContextValue = {
  colorScheme: ThemeMode;
  theme: AppThemeColors;
  toggleColorScheme: () => void;
  setColorScheme: (mode: ThemeMode) => void;
};

const AppThemeContext = createContext<AppThemeContextValue | undefined>(undefined);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorScheme, setColorSchemeState] = useState<ThemeMode>('light');
  const [userPreference, setUserPreference] = useState<ThemeMode | null>(null);

  // Por padrão, manter o app em 'light' até que o usuário escolha
  // uma preferência manual. Não aplicar automaticamente o tema do sistema.

  const setColorScheme = (mode: ThemeMode) => {
    setUserPreference(mode);
    setColorSchemeState(mode);
  };

  const toggleColorScheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  const value = useMemo(
    () => ({
      colorScheme,
      theme: ThemePalette[colorScheme],
      toggleColorScheme,
      setColorScheme,
    }),
    [colorScheme]
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }
  return context;
}
