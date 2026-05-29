import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
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

import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { useAppTheme } from "../hooks/use-app-theme";

const LOGO_IMAGE = require("../assets/img/logo.png");

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { theme, toggleColorScheme, colorScheme } = useAppTheme();
  const router = useRouter();

  // Estados dos campos
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ESTADO DE ERROS (Novo)
  const [errors, setErrors] = useState<any>({});

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/login");
    }
  };

  // Máscaras (mantidas conforme sua preferência)
  const maskCpf = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length <= 11) {
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return v;
  };

  const maskPhone = (v: string) => {
    v = v.replace(/\D/g, "");
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d{5})(\d)/, "$1-$2");
    return v;
  };

  const maskCep = (v: string) => {
    v = v.replace(/\D/g, "");
    v = v.replace(/(\d{5})(\d)/, "$1-$2");
    return v;
  };

  const handleCepChange = async (text: string) => {
    const formatted = maskCep(text);
    setZipCode(formatted);
    const cleanCep = formatted.replace(/\D/g, "");

    if (cleanCep.length === 8) {
      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${cleanCep}/json/`,
        );
        const data = await response.json();
        if (!data.erro) {
          setStreet(data.logradouro);
          setNeighborhood(data.bairro);
          setCity(data.localidade);
          setState(data.uf);
          setErrors({ ...errors, zipCode: "" }); // Limpa erro de CEP se achar
        }
      } catch (e) {
        console.error("Erro CEP");
      }
    }
  };

  // NOVA LÓGICA DE VALIDAÇÃO SEM ALERTS
  const validate = () => {
    let newErrors: any = {};
    const emailRegex = /\S+@\S+\.\S+/;

    // REGEX DA SENHA: Mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (fullName.trim().length < 15)
      newErrors.fullName = "O nome deve ter no mínimo 15 letras.";
    if (cpf.length < 14) newErrors.cpf = "CPF inválido.";
    if (phone.length < 14) newErrors.phone = "Telefone inválido.";
    if (!emailRegex.test(email)) newErrors.email = "E-mail inválido.";
    if (zipCode.length < 9) newErrors.zipCode = "CEP inválido.";

    // Validação Real da Senha
    if (!password) {
      newErrors.password = "A senha é obrigatória.";
    } else if (!passwordRegex.test(password)) {
      newErrors.password =
        "A senha deve ter 8+ caracteres, com letra maiúscula, minúscula e símbolo.";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      await setDoc(doc(db, "usuarios", userCredential.user.uid), {
        nome: fullName,
        cpf,
        telefone: phone,
        email,
        endereco: {
          rua: street,
          numero: number,
          bairro: neighborhood,
          cep: zipCode,
          cidade: city,
          uf: state,
        },
        tipo: "cliente",
        criadoEm: new Date().toISOString(),
      });

      // Redirecionamento após sucesso
      Alert.alert("Sucesso", "Cadastro realizado! Por favor, faça login.", [
        { text: "OK", onPress: () => router.replace("/login") },
      ]);
    } catch (error: any) {
      // ... seu tratamento de erro atual
      Alert.alert("Erro", "Falha ao cadastrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 100}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20 },
          ]}
          automaticallyAdjustKeyboardInsets={true}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={[
              styles.backButton,
              {
                top: insets.top + 10,
                backgroundColor: theme.buttonBackground ?? theme.surface,
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
              size={24}
              color={theme.primary}
            />
          </TouchableOpacity>

          <Image source={LOGO_IMAGE} style={styles.logo} resizeMode="contain" />
          <Text style={[styles.title, { color: theme.text }]}>
            Cadastro Golden Paw
          </Text>

          <CustomInput
            theme={theme}
            placeholder="Nome Completo"
            value={fullName}
            onChange={setFullName}
            errorMessage={errors.fullName}
          />

          <CustomInput
            theme={theme}
            placeholder="CPF"
            value={cpf}
            onChange={(t: string) => setCpf(maskCpf(t))}
            maxLength={14}
            keyboard="numeric"
            errorMessage={errors.cpf}
          />

          <CustomInput
            theme={theme}
            placeholder="Celular"
            value={phone}
            onChange={(t: string) => setPhone(maskPhone(t))}
            maxLength={15}
            keyboard="phone-pad"
            errorMessage={errors.phone}
          />

          <CustomInput
            theme={theme}
            placeholder="E-mail"
            value={email}
            onChange={setEmail}
            keyboard="email-address"
            errorMessage={errors.email}
          />

          <View style={styles.divider} />

          <CustomInput
            theme={theme}
            placeholder="CEP"
            value={zipCode}
            onChange={handleCepChange}
            maxLength={9}
            keyboard="numeric"
            errorMessage={errors.zipCode}
          />

          <CustomInput
            theme={theme}
            placeholder="Rua"
            value={street}
            onChange={setStreet}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <CustomInput
                theme={theme}
                placeholder="Nº"
                value={number}
                onChange={setNumber}
                keyboard="numeric"
              />
            </View>
            <View style={{ flex: 2 }}>
              <CustomInput
                theme={theme}
                placeholder="Bairro"
                value={neighborhood}
                onChange={setNeighborhood}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 3 }}>
              <CustomInput
                theme={theme}
                placeholder="Cidade"
                value={city}
                onChange={setCity}
              />
            </View>
            <View style={{ flex: 1 }}>
              <CustomInput
                theme={theme}
                placeholder="UF"
                value={state}
                onChange={setState}
                maxLength={2}
              />
            </View>
          </View>

          <View style={styles.divider} />

          {/* SENHA 1 */}
          <View style={styles.inputWrapper}>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.surface,
                  borderColor: errors.password ? "#FF4D4D" : theme.border,
                },
              ]}
            >
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Senha"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={22}
                  color={theme.primary}
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          {/* CONFIRMAR SENHA */}
          <View style={styles.inputWrapper}>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.surface,
                  borderColor: errors.confirmPassword
                    ? "#FF4D4D"
                    : theme.border,
                },
              ]}
            >
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Confirmar Senha"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={22}
                  color={theme.primary}
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: theme.primary }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.btnText}>Finalizar Cadastro</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// COMPONENTE ATUALIZADO COM MENSAGEM DE ERRO
function CustomInput({
  theme,
  placeholder,
  value,
  onChange,
  maxLength,
  isPassword,
  keyboard,
  errorMessage,
}: any) {
  return (
    <View style={styles.inputWrapper}>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.surface,
            borderColor: errorMessage ? "#FF4D4D" : theme.border,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          value={value}
          onChangeText={onChange}
          maxLength={maxLength}
          secureTextEntry={isPassword}
          keyboardType={keyboard}
          autoCapitalize="none"
        />
      </View>
      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    alignItems: "center",
  },
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
  logo: { width: 100, height: 60, marginBottom: 10 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  inputWrapper: { width: "100%", marginBottom: 12 },
  inputContainer: {
    width: "100%",
    height: 55,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  input: { flex: 1, fontSize: 16 },
  errorText: { color: "#FF4D4D", fontSize: 12, marginTop: 4, marginLeft: 5 },
  row: { flexDirection: "row", gap: 10, width: "100%" },
  divider: {
    height: 1,
    width: "100%",
    backgroundColor: "#eee",
    marginVertical: 10,
  },
  btn: {
    width: "100%",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  btnText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
});
