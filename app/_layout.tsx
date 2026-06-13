// app/_layout.tsx
import { FontSizeProvider } from "@/contexts/FontSizeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AppThemeProvider } from "@/hooks/use-app-theme";
import { CartProvider } from "@/hooks/use-cart";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-url-polyfill/auto";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FontSizeProvider>
        <AppThemeProvider>
          <NotificationProvider>
            <CartProvider>
              <Slot />
            </CartProvider>
          </NotificationProvider>
        </AppThemeProvider>
      </FontSizeProvider>
    </SafeAreaProvider>
  );
}
