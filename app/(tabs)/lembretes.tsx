import { useAppTheme } from "@/hooks/use-app-theme";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import RemindersScreen from "../../app/components/RemindersScreen";
import { auth } from "../../firebaseConfig";

export default function LembretesTab() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Monitoriza o estado de autenticação em tempo real para os lembretes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={[styles.container, { paddingBottom: insets.bottom + 80 }]}>
        <RemindersScreen
          isLoggedIn={isLoggedIn}
          onNavigateToLogin={() => router.push("/login")}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    // A margem inferior garante que a navegação do RemindersScreen
    // não fique escondida por trás da TabBar do Expo Router.
  },
});
