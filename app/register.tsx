import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
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
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// IMPORTS DO FIREBASE
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

/**
 * CONFIGURAÇÕES E ASSETS
 */
const IMAGES = {
  logo: require("../assets/img/logo.png"),
};

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const systemColorScheme = useColorScheme();
  const isDarkMode = systemColorScheme === "dark";
  const router = useRouter();

  // Estados dos inputs
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [street, setStreet] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Estado de carregamento
  const [loading, setLoading] = useState(false);

  const theme = useMemo(
    () => ({
      background: isDarkMode ? "#121212" : "#F8F6F2",
      surface: isDarkMode ? "#1E1E1E" : "#FFFFFF",
      primary: "#D4AF37", // dourado
      text: isDarkMode ? "#F5F5F5" : "#1A1A1A",
      textSecondary: isDarkMode ? "#A1A1AA" : "#6B7280",
      border: isDarkMode ? "#2A2A2A" : "#E5E7EB",
      buttonBackground: isDarkMode
        ? "rgba(212, 175, 55, 0.15)"
        : "rgba(212, 175, 55, 0.1)",
    }),
    [isDarkMode],
  );

  const formatCpf = (text: string) => {
    let formattedText = text.replace(/\D/g, "");
    if (formattedText.length > 3)
      formattedText = formattedText.replace(/^(\d{3})(\d)/, "$1.$2");
    if (formattedText.length > 7)
      formattedText = formattedText.replace(
        /^(\d{3})\.(\d{3})(\d)/,
        "$1.$2.$3",
      );
    if (formattedText.length > 11)
      formattedText = formattedText.replace(
        /^(\d{3})\.(\d{3})\.(\d{3})(\d{2})/,
        "$1.$2.$3-$4",
      );
    return formattedText;
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  // FUNÇÃO DE CADASTRO REAL
  const handleRegister = async () => {
    // Validações básicas
    if (!email || !password || !fullName) {
      Alert.alert("Erro", "Por favor, preencha Nome, Email e Senha.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      // 1. Cria o usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // 2. Salva os dados detalhados no Firestore
      await setDoc(doc(db, "usuarios", user.uid), {
        nome: fullName,
        cpf: cpf,
        telefone: phone,
        email: email,
        endereco: {
          rua: street,
          cep: zipCode,
          bairro: neighborhood,
        },
        tipo: "cliente",
        criadoEm: new Date().toISOString(),
      });

      Alert.alert("Sucesso!", "Conta criada com sucesso!", [
        { text: "Continuar", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (error: any) {
      console.error(error);
      let errorMessage = "Ocorreu um erro ao tentar cadastrar.";

      if (error.code === "auth/email-already-in-use")
        errorMessage = "Este e-mail já está em uso.";
      if (error.code === "auth/invalid-email")
        errorMessage = "E-mail inválido.";
      if (error.code === "auth/weak-password")
        errorMessage = "A senha deve ter pelo menos 6 caracteres.";

      Alert.alert("Erro no Cadastro", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar
        backgroundColor={theme.primary}
        barStyle={isDarkMode ? "light-content" : "dark-content"}
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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 80 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Image
                source={IMAGES.logo}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>
              Crie sua conta!
            </Text>

            <View
              style={[
                styles.inputContainer,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Nome Completo"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="words"
                value={fullName}
                onChangeText={setFullName}
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
                placeholder="CPF"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                maxLength={14}
                value={cpf}
                onChangeText={(text) => setCpf(formatCpf(text))}
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
                placeholder="Celular (DDD) 9XXXX-XXXX"
                placeholderTextColor={theme.textSecondary}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
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
                placeholder="Email"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
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
                placeholder="Rua"
                placeholderTextColor={theme.textSecondary}
                value={street}
                onChangeText={setStreet}
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
                placeholder="CEP"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                maxLength={9}
                value={zipCode}
                onChangeText={setZipCode}
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
                placeholder="Bairro"
                placeholderTextColor={theme.textSecondary}
                value={neighborhood}
                onChangeText={setNeighborhood}
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

            <View
              style={[
                styles.inputContainer,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Confirmar Senha"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.registerButton,
                { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 },
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.registerButtonText}>Cadastrar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text style={[styles.loginText, { color: theme.primary }]}>
                Já tem uma conta? Faça login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    paddingHorizontal: "5%",
    paddingBottom: 40,
    alignItems: "center",
  },
  content: { width: "100%", maxWidth: 400, alignItems: "center", padding: 20 },
  logoContainer: { marginBottom: 20 },
  logo: { width: 150, height: 80 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === "ios" ? 15 : 10,
  },
  input: { fontSize: 16 },
  registerButton: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 15,
  },
  registerButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
  loginText: { fontSize: 14, fontWeight: "bold" },
});
