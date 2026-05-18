// app/_layout.tsx
import { AppThemeProvider } from "@/hooks/use-app-theme";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <Slot />
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
