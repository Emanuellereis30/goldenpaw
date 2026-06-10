import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { auth, db } from "../firebaseConfig";

const ADMIN_EMAIL = "admin@goldenpaw.com";
const ADMIN_PASSWORD = "admin123";
const ADMIN_NAME = "Administrador";

export default function AdminLoginScreen() {
  const insets = useSafeAreaInsets();
  const { theme, colorScheme, toggleColorScheme } = useAppTheme();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert("Erro", "Preencha email e senha");
      return;
    }

    const isHardcodedAdmin =
      email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
      senha === ADMIN_PASSWORD;

    setLoading(true);
    try {
      if (isHardcodedAdmin) {
        await AsyncStorage.setItem("isAdminLoggedIn", "true");
        Alert.alert("Sucesso", `Bem-vindo, ${ADMIN_NAME}!`);
        setEmail("");
        setSenha("");
        router.replace("/(tabs)/admin" as any);
        return;
      }

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        senha,
      );
      const user = userCredential.user;

      const q = query(collection(db, "admin"), where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert("Erro", "Usuário admin não encontrado.");
        setLoading(false);
        return;
      }

      const adminData = querySnapshot.docs[0].data();
      await AsyncStorage.setItem("isAdminLoggedIn", "true");
      Alert.alert("Sucesso", `Bem-vindo, ${adminData.nome}!`);

      setEmail("");
      setSenha("");
      router.replace("/(tabs)/admin" as any);
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      Alert.alert("Erro", "Email ou senha incorretos");
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
            backgroundColor: theme.surface,
            borderColor: theme.primary + "40",
          },
        ]}
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/login" as any)
        }
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={24} color={theme.primary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.themeToggleButton,
          {
            top: insets.top + 10,
            right: 20,
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

      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/img/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Acesso Admin</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Faça login para acessar o painel de administração
        </Text>

        <View
          style={[
            styles.form,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Email</Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                },
              ]}
            >
              <Ionicons name="mail" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="admin@email.com"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Senha</Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                },
              ]}
            >
              <Ionicons
                name="lock-closed"
                size={20}
                color={theme.textSecondary}
              />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Digite a sua senha"
                placeholderTextColor={theme.textSecondary}
                value={senha}
                onChangeText={setSenha}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye" : "eye-off"}
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.loginButton,
              { backgroundColor: theme.primary, opacity: loading ? 0.6 : 1 },
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <Ionicons name="log-in" size={20} color="#000" />
                <Text style={styles.loginButtonText}>Entrar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: {
    position: "absolute",
    left: 20,
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
  content: { flex: 1, paddingHorizontal: 20, justifyContent: "center" },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  logo: { width: 150, height: 150 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: { fontSize: 14, textAlign: "center", marginBottom: 30 },
  form: { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 20 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  input: { flex: 1, fontSize: 16 },
  loginButton: {
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 20,
    marginBottom: 16,
  },
  loginButtonText: { color: "#000", fontSize: 16, fontWeight: "bold" },
  themeToggleButton: {
    position: "absolute",
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
