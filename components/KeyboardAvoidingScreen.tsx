// components/KeyboardAvoidingScreen.tsx
import React from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ScrollViewProps,
    StyleProp,
    StyleSheet,
    ViewStyle,
} from "react-native";

interface KeyboardAvoidingScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollViewProps?: Partial<ScrollViewProps>;
  extraOffset?: number;
}

export default function KeyboardAvoidingScreen({
  children,
  style,
  contentContainerStyle,
  scrollViewProps,
  extraOffset = 0,
}: KeyboardAvoidingScreenProps) {
  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? extraOffset : 0}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  contentContainer: { flexGrow: 1 },
});
