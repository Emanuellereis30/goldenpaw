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
  Dimensions,
  Platform,
  ImageSourcePropType
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * INTERFACES DE TIPO
 */
interface Produto {
  id: string;
  nome: string;
  preco: string;
  image: ImageSourcePropType;
  tag?: string;
  cartId?: string;
}

interface Categoria {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

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
  caixadeareia: require('../../assets/img/caixadeareia.png'),
  arranhador: require('../../assets/img/arranhador.png'),
  bebedouro: require('../../assets/img/bebedouro.png'),
  petisco: require('../../assets/img/petisco.png'),
  petiscocachorro: require('../../assets/img/petiscocachorro.png'),
  caixadetransportegato: require('../../assets/img/caixadetransportegato.png'),
  caixadetransportecachorro: require('../../assets/img/caixadetransportecachorro.png'),
  casadecachorro: require('../../assets/img/casadecachorro.webp'),
  camadepet: require('../../assets/img/camadepet.png'),
  tapetehigienico: require('../../assets/img/tapetehigienico.png'),
  comedourosimples: require('../../assets/img/comedouropet.png'),
  comedouroduplo: require('../../assets/img/comedouroduplo.png'),
  aquario: require('../../assets/img/aquario.png'),
  racaopeixes: require('../../assets/img/racaopeixe.png'),
  filtrodeagua: require('../../assets/img/filtroaquario.png'),

  // os itens abaixo estõ sem imagem
  bombadeoxigenioaquario: require('../../assets/img/camadepet.png'),
  iluminacaoaquario: require('../../assets/img/camadepet.png'),
  plantaaquario: require('../../assets/img/camadepet.png'),
  pedradecorativaaquario: require('../../assets/img/camadepet.png'),
  esconderijoaquario: require('../../assets/img/camadepet.png'),
  racaopassaros: require('../../assets/img/camadepet.png'),
  racaopassaropremium: require('../../assets/img/camadepet.png'),
  bebedouroaves: require('../../assets/img/camadepet.png'),
  comedouroaves: require('../../assets/img/camadepet.png'),
  kitcomedouro: require('../../assets/img/camadepet.png'),
  blancopassaros: require('../../assets/img/camadepet.png')

};

const PRODUTOS_DATA: Produto[] = [
  { id: '1', nome: 'Ração Premium Cães', preco: 'R$ 189,90', image: IMAGES.racao, tag: 'Popular' },
  { id: '2', nome: 'Ração Premium Gatos', preco: 'R$ 159,90', image: IMAGES.racaogato, tag: 'Saudável' },
  { id: '3', nome: 'Brinquedo Interativo', preco: 'R$ 45,90', image: IMAGES.brinquedos, tag: 'Diversão' },
  { id: '4', nome: 'Coleira Antipulgas', preco: 'R$ 189,90', image: IMAGES.coleira, tag: 'Saúde' },
  { id: '5', nome: 'Cama Ortopédica', preco: 'R$ 159,90', image: IMAGES.cama, tag: 'Conforto' },
  { id: '6', nome: 'Shampoo Hidratante', preco: 'R$ 45,90', image: IMAGES.shamppo, tag: 'Higiene' },
  { id: '7', nome: 'Aranhador Para Gatos', preco: 'R$ 40,00', image: IMAGES.arranhador, tag: 'Diversão' },
  { id: '8', nome: 'Bebedouro Elétrico', preco: 'R$ 60,00', image: IMAGES.bebedouro, tag: 'Saudável' },
  { id: '9', nome: 'Petisco(Gato)', preco: 'R$ 15,00', image: IMAGES.petisco, tag: 'Popular' },
  { id: '10', nome: 'Petisco(cachorro)', preco: 'R$ 15,00', image: IMAGES.petiscocachorro, tag: 'Popular' },
  { id: '12', nome: 'Caixa De Transporte (Gato)', preco: 'R$ 50,00 ', image: IMAGES.caixadetransportegato, tag: 'Conforto' },
  { id: '12', nome: 'Caixa De Transporte (Cachorro)', preco: 'R$ 60,00 ', image: IMAGES.caixadetransportecachorro, tag: 'Conforto' },
  { id: '13', nome: 'Caixa De Areia', preco: 'R$ 26,90 ', image: IMAGES.caixadeareia, tag: 'Higiene' },
  { id: '14', nome: 'Casa de Cachorro', preco: 'R$ 89,80 ', image: IMAGES.casadecachorro, tag: 'Conforto' },
  { id: '15', nome: 'Cama de Pet', preco: 'R$ 39,98 ', image: IMAGES.camadepet, tag: 'Higiene' },
  { id: '16', nome: 'Tapete higienico', preco: 'R$ 37,99 ', image: IMAGES.tapetehigienico, tag: 'Higiene' },
  { id: '17', nome: 'Comedouro Simples', preco: 'R$ 15,90 ', image: IMAGES.comedourosimples, tag: 'Popular' },
  { id: '18', nome: 'Comedouro Duplo', preco: 'R$ 20,00 ', image: IMAGES.comedouroduplo, tag: 'Popular' },
  { id: '11', nome: 'Aquário Para Peixes (50L)', preco: 'R$ 250,00 ', image: IMAGES.aquario, tag: 'Popular' },
  { id: '19', nome: 'Ração Para Peixes', preco: 'R$ 46,10 ', image: IMAGES.racaopeixes, tag: 'Saudável' },
  { id: '20', nome: 'Filtro de Agua Aquario', preco: 'R$ 96,90 ', image: IMAGES.filtrodeagua, tag: 'Higiene' },

  // os itens abaixo estõ sem imagem
  { id: '21', nome: 'Bomba de oxigênio', preco: 'R$ 57,80 ', image: IMAGES.bombadeoxigenioaquario, tag: 'Saúde' },
  { id: '22', nome: 'Iluminação LED para aquário', preco: 'R$ 39,00 ', image: IMAGES.iluminacaoaquario, tag: 'Popular' },
  { id: '23', nome: 'Plantas Artificiais para Aquario', preco: 'R$ 15,59 ', image: IMAGES.plantaaquario, tag: 'Popular' },
  { id: '24', nome: 'Pedras Decorativas para Aquario', preco: 'R$ 2,90 ', image: IMAGES.pedradecorativaaquario, tag: 'Popular' },
  { id: '25', nome: 'Esconderijo de Rocha para Aquario', preco: 'R$ 78,70 ', image: IMAGES.esconderijoaquario, tag: 'Popular' },
  { id: '26', nome: 'Ração para Pássaros', preco: 'R$ 21,50 ', image: IMAGES.racaopassaros, tag: 'Saúde' },
  { id: '27', nome: 'Ração para Pássaros Premium', preco: 'R$ 299,90 ', image: IMAGES.racaopassaropremium, tag: 'Saúde' },
  { id: '28', nome: 'Bebedouro para Pássaros', preco: 'R$ 11,90 ', image: IMAGES.bebedouroaves, tag: 'Higiene' },
  { id: '29', nome: 'Comedouro para Pássaros', preco: 'R$ 14,99 ', image: IMAGES.comedouroaves, tag: 'Higiene' },
  { id: '30', nome: 'Kit Bebedouro e Comedouro Pássaros', preco: 'R$ 25,00 ', image: IMAGES.kitcomedouro, tag: 'Higiene' },
  { id: '31', nome: 'Balanço para Pássaros', preco: 'R$ 7,90 ', image: IMAGES.blancopassaros, tag: 'Popular' },
];

const CATEGORIES: Categoria[] = [
  { id: 'c1', name: 'Cães', icon: 'paw' },
  { id: 'c2', name: 'Gatos', icon: 'logo-octocat' },
  { id: 'c3', name: 'Aves', icon: 'egg' },
  { id: 'c4', name: 'Peixes', icon: 'fish' },
];

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [activeTab, setActiveTab] = useState('home');
  const [cart, setCart] = useState<Produto[]>([]);

  const theme = useMemo(() => ({
    background: isDarkMode ? '#121212' : '#e0e0e0',
    surface: isDarkMode ? '#1E1E1E' : '#ffffff',
    primary: '#D4AF37',
    secondary: isDarkMode ? '#2A2A2A' : '#927957',
    text: isDarkMode ? '#F5F5F5' : '#1A1A1A',
    textSecondary: isDarkMode ? '#A1A1AA' : '#6B7280',
    border: isDarkMode ? '#2A2A2A' : '#E5E7EB',
    shadow: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.08)',
  }), [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const addToCart = (product: Produto) => {
    const newItem = { ...product, cartId: Math.random().toString(36).substr(2, 9) };
    setCart([...cart, newItem]);
    setActiveTab('carrinho');
  };

  const removeFromCart = (cartId: string | undefined) => {
    if (!cartId) return;
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const calculateTotal = () => {
    const total = cart.reduce((acc, item) => {
      const priceStr = item.preco.replace('R$ ', '').replace('.', '').replace(',', '.');
      return acc + parseFloat(priceStr);
    }, 0);
    return total.toFixed(2).replace('.', ',');
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <View style={styles.headerLeft}>
        <Image source={IMAGES.logo} style={styles.headerLogo} resizeMode="contain" />
        <View>
          <Text style={[styles.welcomeText, { color: theme.textSecondary }]}>Olá, Pet Lover! </Text>
          <Text style={[styles.brandText, { color: theme.text }]}>Golden Paw</Text>
        </View>
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity onPress={toggleDarkMode} style={[styles.iconButton, { backgroundColor: theme.surface }]}>
          <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={22} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/login')} style={[styles.iconButton, { backgroundColor: theme.surface }]}>
          <Ionicons name="person-outline" size={22} color={theme.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {renderHeader()}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'home' && (
          <View>
            <View style={[styles.heroBanner, { backgroundColor: theme.primary }]}>
              <Image source={IMAGES.banner} style={styles.heroBackgroundImage} resizeMode="cover" />
              <View style={styles.heroOverlay} />
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>Tudo para o seu melhor amigo</Text>
                <Text style={styles.heroSubtitle}>Descontos de até 30% em rações selecionadas.</Text>
                <TouchableOpacity style={styles.heroButton} onPress={() => setActiveTab('produtos')}>
                  <Text style={styles.heroButtonText}>Comprar Agora</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: theme.text }]}>Categorias</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity key={cat.id} style={styles.categoryItem}>
                  <View style={[styles.categoryIcon, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Ionicons name={cat.icon} size={24} color={theme.primary} />
                  </View>
                  <Text style={[styles.categoryName, { color: theme.textSecondary }]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Destaques</Text>
              <TouchableOpacity onPress={() => setActiveTab('produtos')}>
                <Text style={{ color: theme.primary, fontWeight: '600' }}>Ver tudo</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {PRODUTOS_DATA.slice(0, 4).map((item) => (
                <View key={`feat-${item.id}`} style={[styles.featuredCard, { backgroundColor: theme.surface }]}>
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>{item.tag}</Text>
                  </View>
                  <Image source={item.image} style={styles.featuredImage} resizeMode="contain" />
                  <Text style={[styles.productName, { color: theme.text }]} numberOfLines={1}>{item.nome}</Text>
                  <Text style={[styles.productPrice, { color: theme.primary }]}>{item.preco}</Text>
                  <TouchableOpacity 
                    style={[styles.addButton, { backgroundColor: theme.primary }]} 
                    onPress={() => addToCart(item)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="add" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {activeTab === 'produtos' && (
          <View style={styles.gridContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 20 }]}>Nossa Loja</Text>
            <View style={styles.grid}>
              {PRODUTOS_DATA.map((item) => (
                <View key={`grid-${item.id}`} style={[styles.gridCard, { backgroundColor: theme.surface }]}>
                  <Image source={item.image} style={styles.gridImage} resizeMode="contain" />
                  <View style={styles.gridInfo}>
                    <Text style={[styles.productName, { color: theme.text }]} numberOfLines={1}>{item.nome}</Text>
                    <Text style={[styles.productPrice, { color: theme.primary }]}>{item.preco}</Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.gridAddButton, { backgroundColor: theme.primary }]} 
                    onPress={() => addToCart(item)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="cart-outline" size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'carrinho' && (
          <View style={styles.cartContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 20 }]}>Meu Carrinho</Text>
            {cart.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cart-outline" size={80} color={theme.textSecondary} />
                <Text style={[styles.emptyStateTitle, { color: theme.text }]}>Vazio</Text>
                <TouchableOpacity style={[styles.emptyButton, { backgroundColor: theme.primary }]} onPress={() => setActiveTab('produtos')}>
                  <Text style={styles.emptyButtonText}>Ir para a Loja</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.cartList}>
                {cart.map((item) => (
                  <View key={item.cartId} style={[styles.cartItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Image source={item.image} style={styles.cartItemImage} resizeMode="contain" />
                    <View style={styles.cartItemInfo}>
                      <Text style={[styles.productName, { color: theme.text }]}>{item.nome}</Text>
                      <Text style={[styles.productPrice, { color: theme.primary }]}>{item.preco}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeFromCart(item.cartId)}>
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
                <View style={[styles.cartFooter, { borderTopColor: theme.border }]}>
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Total:</Text>
                    <Text style={[styles.totalValue, { color: theme.text }]}>R$ {calculateTotal()}</Text>
                  </View>
                  <TouchableOpacity style={[styles.checkoutButton, { backgroundColor: theme.primary }]}>
                    <Text style={styles.checkoutButtonText}>Finalizar Compra</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottomTab, { backgroundColor: theme.surface, paddingBottom: insets.bottom + 10, borderTopColor: theme.border }]}>
        {[
          { id: 'home', icon: 'home' as const, label: 'Início' },
          { id: 'produtos', icon: 'search' as const, label: 'Loja' },
          { id: 'carrinho', icon: 'cart' as const, label: 'Carrinho' },
        ].map((tab) => (
          <TouchableOpacity key={tab.id} onPress={() => setActiveTab(tab.id)} style={styles.tabItem}>
            <Ionicons 
              name={activeTab === tab.id ? tab.icon : `${tab.icon}-outline` as any} 
              size={24} 
              color={activeTab === tab.id ? theme.primary : theme.textSecondary} 
            />
            <Text style={[styles.tabLabel, { color: activeTab === tab.id ? theme.primary : theme.textSecondary }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerLogo: { width: 45, height: 45, marginRight: 12, borderRadius: 10 },
  welcomeText: { fontSize: 12, fontWeight: '500' },
  brandText: { fontSize: 18, fontWeight: '800' },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconButton: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  heroBanner: { 
    marginHorizontal: 20, 
    borderRadius: 24, 
    height: 220, 
    overflow: 'hidden', 
    marginBottom: 25, 
    position: 'relative',
    width: SCREEN_WIDTH - 40 
  },
  heroBackgroundImage: { 
    ...StyleSheet.absoluteFillObject, 
    width: '100%', 
    height: '100%' 
  },
  heroOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.4)' 
  },
  heroContent: { 
    flex: 1, 
    justifyContent: 'center', 
    zIndex: 2, 
    padding: 25 
  },
  heroTitle: { color: '#FFF', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  heroSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginBottom: 20 },
  heroButton: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, alignSelf: 'flex-start' },
  heroButtonText: { color: '#D4AF37', fontWeight: 'bold', fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', paddingHorizontal: 20, marginBottom: 15 },
  categoriesScroll: { paddingHorizontal: 15, marginBottom: 20 },
  categoryItem: { alignItems: 'center', marginHorizontal: 8 },
  categoryIcon: { width: 64, height: 64, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  categoryName: { fontSize: 12, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  horizontalScroll: { paddingHorizontal: 15, paddingBottom: 10 },
  featuredCard: { width: 160, borderRadius: 20, padding: 15, marginHorizontal: 8, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  featuredImage: { width: '100%', height: 100, marginBottom: 12 },
  tagBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(212, 175, 55, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, zIndex: 1 },
  tagText: { color: '#D4AF37', fontSize: 10, fontWeight: '700' },
  productName: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  productPrice: { fontSize: 16, fontWeight: '800' },
  addButton: { position: 'absolute', bottom: 12, right: 12, width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  gridContainer: { paddingHorizontal: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCard: { width: '47%', borderRadius: 20, padding: 12, marginBottom: 18, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  gridImage: { width: '100%', height: 120, marginBottom: 10 },
  gridInfo: { paddingHorizontal: 4 },
  gridAddButton: { marginTop: 10, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  bottomTab: { position: 'absolute', bottom: 0, width: '100%', flexDirection: 'row', justifyContent: 'space-around', paddingTop: 12, borderTopWidth: 1 },
  tabItem: { alignItems: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '600', marginTop: 4 },
  cartContainer: { paddingHorizontal: 20 },
  cartList: { marginBottom: 20 },
  cartItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 15, borderWidth: 1, marginBottom: 10 },
  cartItemImage: { width: 50, height: 50, marginRight: 15 },
  cartItemInfo: { flex: 1 },
  cartFooter: { marginTop: 20, paddingTop: 20, borderTopWidth: 1 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  totalLabel: { fontSize: 16, fontWeight: '600' },
  totalValue: { fontSize: 20, fontWeight: '800' },
  checkoutButton: { height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  checkoutButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyStateTitle: { fontSize: 20, fontWeight: '800', marginTop: 10, marginBottom: 20 },
  emptyButton: { paddingHorizontal: 30, paddingVertical: 15, borderRadius: 15 },
  emptyButtonText: { color: '#FFF', fontWeight: 'bold' }
});
