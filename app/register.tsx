import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * CONFIGURAÇÕES E ASSETS
 */
const IMAGES = {
  logo: require('../assets/img/logo.png'),
};

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const systemColorScheme = useColorScheme();
  const isDarkMode = systemColorScheme === 'dark';
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [street, setStreet] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

 const theme = useMemo(() => ({
   background: isDarkMode ? '#121212' : '#F8F6F2',
   surface: isDarkMode ? '#1E1E1E' : '#FFFFFF',
   primary: '#D4AF37', // dourado
   text: isDarkMode ? '#F5F5F5' : '#1A1A1A',
   textSecondary: isDarkMode ? '#A1A1AA' : '#6B7280',
   border: isDarkMode ? '#2A2A2A' : '#E5E7EB',
 }), [isDarkMode]);

  // Lógica de Voltar Robusta
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const formatCpf = (text: string) => {
    let formattedText = text.replace(/\D/g, '');
    if (formattedText.length > 3) formattedText = formattedText.replace(/^(\d{3})(\d)/, '$1.$2');
    if (formattedText.length > 7) formattedText = formattedText.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
    if (formattedText.length > 11) formattedText = formattedText.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{2})/, '$1.$2.$3-$4');
    return formattedText;
  };

  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar backgroundColor={theme.primary} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Botão Voltar Corrigido */}
      <TouchableOpacity 
        style={[styles.backButton, { top: insets.top + 10 }]} 
        onPress={handleBack}
      >
        <Text style={[styles.backButtonText, { color: theme.primary }]}>← Voltar</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 60 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Image source={IMAGES.logo} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Crie sua conta!</Text>

            <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TextInput style={[styles.input, { color: theme.text }]} placeholder="Nome Completo" placeholderTextColor={theme.textSecondary} autoCapitalize="words" value={fullName} onChangeText={setFullName} />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TextInput style={[styles.input, { color: theme.text }]} placeholder="CPF" placeholderTextColor={theme.textSecondary} keyboardType="numeric" maxLength={14} value={cpf} onChangeText={(text) => setCpf(formatCpf(text))} />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TextInput style={[styles.input, { color: theme.text }]} placeholder="Celular (DDD) 9XXXX-XXXX" placeholderTextColor={theme.textSecondary} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            </View>

           <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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

            <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TextInput style={[styles.input, { color: theme.text }]} placeholder="Rua" placeholderTextColor={theme.textSecondary} value={street} onChangeText={setStreet} />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TextInput style={[styles.input, { color: theme.text }]} placeholder="CEP" placeholderTextColor={theme.textSecondary} keyboardType="numeric" maxLength={9} value={zipCode} onChangeText={setZipCode} />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TextInput style={[styles.input, { color: theme.text }]} placeholder="Bairro" placeholderTextColor={theme.textSecondary} value={neighborhood} onChangeText={setNeighborhood} />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TextInput style={[styles.input, { color: theme.text }]} placeholder="Senha" placeholderTextColor={theme.textSecondary} secureTextEntry value={password} onChangeText={setPassword} />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TextInput style={[styles.input, { color: theme.text }]} placeholder="Confirmar Senha" placeholderTextColor={theme.textSecondary} secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
            </View>

            <TouchableOpacity style={[styles.registerButton, { backgroundColor: theme.primary }]} onPress={() => router.replace('/(tabs)')}>
              <Text style={styles.registerButtonText}>Cadastrar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={[styles.loginText, { color: theme.primary }]}>Já tem uma conta? Faça login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: { position: 'absolute', left: 20, zIndex: 10, padding: 10 },
  backButtonText: { fontSize: 16, fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: '5%', paddingBottom: 40, alignItems: 'center' },
  content: { width: '100%', maxWidth: 400, alignItems: 'center', padding: 20 },
  logoContainer: { marginBottom: 20 },
  logo: { width: 150, height: 80 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  inputContainer: { width: '100%', borderRadius: 12, borderWidth: 1, marginBottom: 15, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 15 : 10 },
  input: { fontSize: 16 },
  registerButton: { width: '100%', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20, marginBottom: 15 },
  registerButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  loginText: { fontSize: 14, fontWeight: 'bold' },
});
