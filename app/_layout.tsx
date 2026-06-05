// app/_layout.tsx
import { AppThemeProvider } from "@/hooks/use-app-theme";
import { CartProvider } from "@/hooks/use-cart";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-url-polyfill/auto";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <CartProvider>
          <Slot />
        </CartProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
