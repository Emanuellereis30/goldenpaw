import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  useColorScheme,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

/**
 * CONFIGURAÇÕES E ASSETS
 */
const IMAGES = {
  logo: require('../assets/img/logo.png'), 
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const systemColorScheme = useColorScheme();
  const isDarkMode = systemColorScheme === 'dark';
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const theme = useMemo(() => ({
    background: isDarkMode ? '#1F1A2E' : '#F9F7FF',
    surface: isDarkMode ? '#2D2648' : '#FFFFFF',
    primary: '#8B5CF6',
    text: isDarkMode ? '#F3F4F6' : '#1F2937',
    textSecondary: isDarkMode ? '#9CA3AF' : '#6B7280',
    border: isDarkMode ? '#3D3663' : '#E5E7EB',
  }), [isDarkMode]);

  // Lógica de Voltar Corrigida: Força a volta para a Home
  const handleBackToHome = () => {
    router.replace('/(tabs)');
  };

  const handleLogin = () => {
    console.log('Login:', { email, password });
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar backgroundColor={theme.primary} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Botão Voltar Corrigido */}
      <TouchableOpacity 
        style={[styles.backButton, { top: insets.top + 10 }]} 
        onPress={handleBackToHome}
      >
        <Text style={[styles.backButtonText, { color: theme.primary }]}>← Voltar</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 60 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Image source={IMAGES.logo} style={styles.logo} resizeMode="contain" />
            </View>

            <Text style={[styles.title, { color: theme.text }]}>Bem-vindo de volta! 👋</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Entre para continuar cuidando do seu pet.</Text>

            <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="E-mail"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Senha"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={[styles.forgotPasswordText, { color: theme.textSecondary }]}>Esqueceu a senha?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.loginButton, { backgroundColor: theme.primary }]} 
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>Entrar</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.textSecondary }]}>Não tem uma conta? </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={[styles.registerLink, { color: theme.primary }]}>Cadastre-se</Text>
              </TouchableOpacity>
            </View>
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
  scrollContent: { paddingHorizontal: '5%', paddingBottom: 40, alignItems: 'center', flexGrow: 1, justifyContent: 'center' },
  content: { width: '100%', maxWidth: 400, alignItems: 'center' },
  logoContainer: { marginBottom: 20 },
  logo: { width: 150, height: 80 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 14, marginBottom: 30, textAlign: 'center', paddingHorizontal: 20 },
  inputContainer: { width: '100%', borderRadius: 12, borderWidth: 1, marginBottom: 15, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 15 : 10 },
  input: { fontSize: 16 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 25 },
  forgotPasswordText: { fontSize: 13, fontWeight: '500' },
  loginButton: { width: '100%', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  loginButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  footer: { flexDirection: 'row', marginTop: 10 },
  footerText: { fontSize: 14 },
  registerLink: { fontSize: 14, fontWeight: 'bold' },
});
