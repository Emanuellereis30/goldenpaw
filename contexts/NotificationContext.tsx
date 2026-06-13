// contexts/NotificationContext.tsx
import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import React, { createContext, useContext, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type NotificationType = "success" | "error" | "info";

interface NotificationContextData {
  showNotification: (
    title: string,
    message: string,
    type?: NotificationType,
  ) => void;
}

const NotificationContext = createContext<NotificationContextData>(
  {} as NotificationContextData,
);

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>("info");

  const translateY = useRef(new Animated.Value(-150)).current;

  const showNotification = (
    newTitle: string,
    newMessage: string,
    newType: NotificationType = "error",
  ) => {
    setTitle(newTitle);
    setMessage(newMessage);
    setType(newType);
    setVisible(true);

    Animated.sequence([
      Animated.timing(translateY, {
        toValue: insets.top > 0 ? insets.top + 10 : 40,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(translateY, {
        toValue: -150,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  };

  const getIconName = () => {
    switch (type) {
      case "success":
        return "checkmark-circle";
      case "error":
        return "close-circle";
      default:
        return "information-circle";
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "success":
        return "#4CAF50";
      case "error":
        return "#F44336";
      default:
        return theme.primary || "#0a7ea4";
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {visible && (
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: theme.surface || "#fff",
              borderColor: theme.border || "#e0e0e0",
              transform: [{ translateY }],
            },
          ]}
        >
          <Ionicons
            name={getIconName()}
            size={28}
            color={getIconColor()}
            style={styles.icon}
          />
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            <Text
              style={[styles.message, { color: theme.textSecondary || "#666" }]}
            >
              {message}
            </Text>
          </View>
        </Animated.View>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    zIndex: 9999,
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
  },
});
