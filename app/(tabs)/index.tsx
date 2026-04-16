import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  StatusBar, 
  useColorScheme, 
  Image,
  Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * CONFIGURAÇÕES E ASSETS
 */
const IMAGES = {
  racao: require('../../assets/img/racao.png'),
  racaogato: require('../../assets/img/racaogato.png'),
  brinquedos: require('../../assets/img/brinquedos.png'),
  coleira: require('../../assets/img/coleira.png'),
  cama: require('../../assets/img/cama.png'),
  shamppo: require('../../assets/img/shamppo.png'),
  banner: require('../../assets/img/banner.png'),
  logo: require('../../assets/img/logo.png'),
};

const PRODUTOS_DATA = [
  { id: '1', nome: 'Ração Premium Cães', preco: 'R$ 189,90', descricao: 'Ração super premium', image: IMAGES.racao },
  { id: '2', nome: 'Ração Premium Gatos', preco: 'R$ 159,90', descricao: 'Alimento completo', image: IMAGES.racaogato },
  { id: '3', nome: 'Brinquedo Interativo', preco: 'R$ 45,90', descricao: 'Estimula atividade', image: IMAGES.brinquedos },
  { id: '4', nome: 'Coleira Antipulgas', preco: 'R$ 189,90', descricao: 'Proteção por 8 meses', image: IMAGES.coleira },
  { id: '5', nome: 'Cama Ortopédica', preco: 'R$ 159,90', descricao: 'Conforto para idosos', image: IMAGES.cama },
  { id: '6', nome: 'Shampoo Hidratante', preco: 'R$ 45,90', descricao: 'Hidratação profunda', image: IMAGES.shamppo },
];

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [activeTab, setActiveTab] = useState('home');

  const theme = useMemo(() => ({
    background: isDarkMode ? '#1F1A2E' : '#F9F7FF',
    surface: isDarkMode ? '#2D2648' : '#FFFFFF',
    primary: '#8B5CF6',
    text: isDarkMode ? '#F3F4F6' : '#1F2937',
    textSecondary: isDarkMode ? '#9CA3AF' : '#6B7280',
    border: isDarkMode ? '#3D3663' : '#E5E7EB',
  }), [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const renderNavbar = () => (
    <View style={[styles.navbar, { backgroundColor: theme.primary }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navbarScroll}>
        {['home', 'produtos', 'carrinho'].map((tab) => (
          <TouchableOpacity 
            key={tab}
            onPress={() => setActiveTab(tab)} 
            style={[styles.navItem, activeTab === tab && styles.navItemActive]}
          >
            <Text style={[styles.navText, activeTab === tab && styles.navTextActive]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={() => router.push('/login')} style={styles.navItem}>
          <Text style={styles.navText}>LOGIN</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar backgroundColor={theme.primary} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {renderNavbar()}

      <TouchableOpacity onPress={toggleDarkMode} style={[styles.themeToggle, { backgroundColor: theme.primary }]}>
        <Text style={styles.themeToggleText}>{isDarkMode ? '☀️' : '🌙'}</Text>
      </TouchableOpacity>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: 10 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'home' && (
          <>
            <View style={styles.header}>
              <Image source={IMAGES.logo} style={styles.logo} resizeMode="contain" />
              <Text style={[styles.slogan, { color: theme.textSecondary }]}>Produtos que seu pet ama!</Text>
            </View>

            <View style={[styles.banner, { backgroundColor: theme.primary }]}>
              <Image source={IMAGES.banner} style={styles.bannerImage} resizeMode="cover" />
              <View style={styles.bannerOverlay}>
                <Text style={styles.bannerTitle}>Cuidado e Amor para Seu Pet</Text>
                <TouchableOpacity style={styles.bannerButton} onPress={() => setActiveTab('produtos')}>
                  <Text style={styles.bannerButtonText}>Explorar Produtos →</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: theme.text }]}>⭐ Destaques</Text>
            {PRODUTOS_DATA.slice(0, 3).map((item) => (
              <View key={item.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.cardImageContainer}>
                  <Image source={item.image} style={styles.cardImage} resizeMode="contain" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{item.nome}</Text>
                  <Text style={[styles.cardPrice, { color: theme.primary }]}>{item.preco}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {activeTab === 'produtos' && (
          <View style={styles.grid}>
            {PRODUTOS_DATA.map((item) => (
              <View key={item.id} style={[styles.productCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.productImageContainer}>
                  <Image source={item.image} style={styles.productImage} resizeMode="contain" />
                </View>
                <Text style={[styles.productName, { color: theme.text }]} numberOfLines={2}>{item.nome}</Text>
                <Text style={[styles.productPrice, { color: theme.primary }]}>{item.preco}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'carrinho' && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>Seu carrinho está vazio 🛍️</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: '5%', paddingBottom: 100 },
  
  // Navbar Responsiva
  navbar: { width: '100%', elevation: 4 },
  navbarScroll: { paddingVertical: 12, paddingHorizontal: 10 },
  navItem: { marginHorizontal: 5, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  navItemActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  navText: { fontWeight: '600', color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  navTextActive: { color: '#FFFFFF' },

  // Header
  header: { alignItems: 'center', marginVertical: 20 },
  logo: { width: '60%', height: 60, maxWidth: 250 },
  slogan: { fontSize: 13, fontWeight: '500', marginTop: 5, textAlign: 'center' },

  // Banner Responsivo
  banner: { width: '100%', borderRadius: 20, marginBottom: 30, overflow: 'hidden' },
  bannerImage: { width: '100%', height: 200 },
  bannerOverlay: { padding: 20, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.1)' },
  bannerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', marginBottom: 15 },
  bannerButton: { backgroundColor: '#FFFFFF', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 30 },
  bannerButtonText: { color: '#8B5CF6', fontWeight: 'bold' },

  // Seções e Cards (Flexíveis)
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  card: { flexDirection: 'row', padding: 12, borderRadius: 15, marginBottom: 12, borderWidth: 1, alignItems: 'center', width: '100%' },
  cardImageContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#f0f0f0', overflow: 'hidden', marginRight: 15 },
  cardImage: { width: '100%', height: '100%' },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  cardPrice: { fontSize: 17, fontWeight: '800' },

  // Grid de Produtos (2 colunas responsivas)
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' },
  productCard: { width: '48%', padding: 12, marginBottom: 15, borderRadius: 15, borderWidth: 1, alignItems: 'center' },
  productImageContainer: { width: '100%', height: 100, marginBottom: 10, justifyContent: 'center', alignItems: 'center' },
  productImage: { width: '90%', height: '90%' },
  productName: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 5, height: 40 },
  productPrice: { fontSize: 16, fontWeight: '800' },

  // Utilidades
  themeToggle: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', zIndex: 1000, elevation: 5 },
  themeToggleText: { fontSize: 24 },
  emptyState: { paddingVertical: 100, alignItems: 'center', width: '100%' },
  emptyStateText: { fontSize: 16, fontWeight: '500' }
});
