import { useAppTheme } from "@/hooks/use-app-theme";
import { useCart } from "@/hooks/use-cart";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function TabLayout() {
  const { theme } = useAppTheme();
  const { totalItems } = useCart();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="loja"
        options={{
          title: "Loja",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "search" : "search-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="carrinho"
        options={{
          title: "Carrinho",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? "cart" : "cart-outline"}
                size={22}
                color={color}
              />
              {totalItems > 0 && (
                <View
                  style={[styles.cartBadge, { backgroundColor: theme.primary }]}
                >
                  <Text style={styles.cartBadgeText}>{totalItems}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="adocao"
        options={{
          title: "Adoção",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "paw" : "paw-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="clinica"
        options={{
          title: "Clínica",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "medkit" : "medkit-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="lembretes"
        options={{
          title: "Lembretes",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "time" : "time-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* Mantém a rota ativa internamente, mas 100% oculta da barra de navegação */}
      <Tabs.Screen
        name="admin"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    width: 24,
    height: 24,
  },
  cartBadge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  cartBadgeText: { color: "#FFF", fontSize: 9, fontWeight: "700" },
});
