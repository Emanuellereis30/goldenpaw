import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/hooks/use-app-theme";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";

const IMAGES = {
  logo: require("../assets/img/logo.png"),
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { theme, colorScheme, toggleColorScheme } = useAppTheme();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Preencha e-mail e senha.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error(error);
      let message = "E-mail ou senha incorretos.";
      if (error.code === "auth/user-not-found")
        message = "Usuário não encontrado.";
      if (error.code === "auth/wrong-password") message = "Senha incorreta.";
      Alert.alert("Erro no Login", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />

      <TouchableOpacity
        style={[
          styles.backButton,
          {
            top: insets.top + 10,
            backgroundColor: theme.buttonBackground,
            borderColor: theme.primary + "40",
          },
        ]}
        onPress={handleBack}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={24} color={theme.primary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.themeToggleButton,
          {
            top: insets.top + 10,
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
        onPress={toggleColorScheme}
        activeOpacity={0.7}
      >
        <Ionicons
          name={colorScheme === "dark" ? "sunny" : "moon"}
          size={22}
          color={theme.primary}
        />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 80 },
          ]}
        >
          <View style={styles.content}>
            <Image
              source={IMAGES.logo}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.title, { color: theme.text }]}>
              Bem-vindo de volta!
            </Text>

            <View
              style={[
                styles.inputContainer,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Email"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View
              style={[
                styles.inputContainer,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Senha"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 },
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.loginButtonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/register")}>
              <Text style={[styles.linkText, { color: theme.primary }]}>
                Não tem uma conta? Cadastre-se
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  content: { alignItems: "center" },
  logo: { width: 180, height: 100, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 30 },
  inputContainer: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  input: { fontSize: 16 },
  loginButton: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  linkText: { marginTop: 20, fontWeight: "bold" },
  themeToggleButton: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
