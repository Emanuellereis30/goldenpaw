import RemindersScreen from "@/app/components/RemindersScreen";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useCart } from "@/hooks/use-cart";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ImageSourcePropType,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
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
import { auth, db } from "../../firebaseConfig";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
  quantity?: number;
  category: "caes" | "gatos" | "aves" | "peixes" | "outros";
}

type CategoryRoute = "/caes" | "/gatos" | "/aves" | "/peixes";

interface Categoria {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: CategoryRoute;
}

/**
 * CONFIGURAÇÕES E ASSETS
 */
const IMAGES = {
  racao: require("../../assets/img/racao.png"),
  racaogato: require("../../assets/img/racaogato.png"),
  brinquedos: require("../../assets/img/brinquedos.png"),
  coleira: require("../../assets/img/coleira.png"),
  cama: require("../../assets/img/cama.png"),
  shamppo: require("../../assets/img/shamppo.png"),
  banner: require("../../assets/img/banner.png"),
  logo: require("../../assets/img/logo.png"),
  caixadeareia: require("../../assets/img/caixadeareia.png"),
  arranhador: require("../../assets/img/arranhador.png"),
  bebedouro: require("../../assets/img/bebedouro.png"),
  petisco: require("../../assets/img/petisco.png"),
  petiscocachorro: require("../../assets/img/petiscocachorro.png"),
  caixadetransportegato: require("../../assets/img/caixadetransportegato.png"),
  caixadetransportecachorro: require("../../assets/img/caixadetransportecachorro.png"),
  casadecachorro: require("../../assets/img/casadecachorro.webp"),
  camadepet: require("../../assets/img/camadepet.png"),
  tapetehigienico: require("../../assets/img/tapetehigienico.png"),
  comedourosimples: require("../../assets/img/comedouropet.png"),
  comedouroduplo: require("../../assets/img/comedouroduplo.png"),
  aquario: require("../../assets/img/aquario.png"),
  racaopeixes: require("../../assets/img/racaopeixe.png"),
  filtrodeagua: require("../../assets/img/filtroaquario.png"),
  bombadeoxigenioaquario: require("../../assets/img/bombaoxigenio.png"),
  iluminacaoaquario: require("../../assets/img/ledaquario.png"),
  plantaaquario: require("../../assets/img/plantasaquario.png"),
  pedradecorativaaquario: require("../../assets/img/pedrasaquario.png"),
  esconderijoaquario: require("../../assets/img/esconderijopedra.png"),
  racaopassaros: require("../../assets/img/racaopassaro.png"),
  racaopassaropremium: require("../../assets/img/racaopassaropremium.png"),
  bebedouroaves: require("../../assets/img/bebedouropassaro.png"),
  comedouroaves: require("../../assets/img/comedouropassaro.png"),
  kitcomedouro: require("../../assets/img/kitcomedouroebebedouro.png"),
  blancopassaros: require("../../assets/img/balancopassaro.png"),
};

const PRODUTOS_DATA: Produto[] = [
  {
    id: "1",
    nome: "Ração Premium Cães",
    preco: "R$ 189,90",
    image: IMAGES.racao,
    tag: "Popular",
    category: "caes",
  },
  {
    id: "2",
    nome: "Ração Premium Gatos",
    preco: "R$ 159,90",
    image: IMAGES.racaogato,
    tag: "Saudável",
    category: "gatos",
  },
  {
    id: "3",
    nome: "Brinquedo Interativo",
    preco: "R$ 45,90",
    image: IMAGES.brinquedos,
    tag: "Diversão",
    category: "caes",
  },
  {
    id: "4",
    nome: "Coleira Antipulgas",
    preco: "R$ 189,90",
    image: IMAGES.coleira,
    tag: "Saúde",
    category: "caes",
  },
  {
    id: "5",
    nome: "Cama Ortopédica",
    preco: "R$ 159,90",
    image: IMAGES.cama,
    tag: "Conforto",
    category: "caes",
  },
  {
    id: "6",
    nome: "Shampoo Hidratante",
    preco: "R$ 45,90",
    image: IMAGES.shamppo,
    tag: "Higiene",
    category: "caes",
  },
  {
    id: "7",
    nome: "Aranhador Para Gatos",
    preco: "R$ 40,00",
    image: IMAGES.arranhador,
    tag: "Diversão",
    category: "gatos",
  },
  {
    id: "8",
    nome: "Bebedouro Elétrico",
    preco: "R$ 60,00",
    image: IMAGES.bebedouro,
    tag: "Saudável",
    category: "gatos",
  },
  {
    id: "9",
    nome: "Petisco(Gato)",
    preco: "R$ 15,00",
    image: IMAGES.petisco,
    tag: "Popular",
    category: "gatos",
  },
  {
    id: "10",
    nome: "Petisco(cachorro)",
    preco: "R$ 15,00",
    image: IMAGES.petiscocachorro,
    tag: "Popular",
    category: "caes",
  },
  {
    id: "11-gato",
    nome: "Caixa De Transporte (Gato)",
    preco: "R$ 50,00 ",
    image: IMAGES.caixadetransportegato,
    tag: "Conforto",
    category: "gatos",
  },
  {
    id: "12-cachorro",
    nome: "Caixa De Transporte (Cachorro)",
    preco: "R$ 60,00 ",
    image: IMAGES.caixadetransportecachorro,
    tag: "Conforto",
    category: "caes",
  },
  {
    id: "13",
    nome: "Caixa De Areia",
    preco: "R$ 26,90 ",
    image: IMAGES.caixadeareia,
    tag: "Higiene",
    category: "gatos",
  },
  {
    id: "14",
    nome: "Casa de Cachorro",
    preco: "R$ 89,80 ",
    image: IMAGES.casadecachorro,
    tag: "Conforto",
    category: "caes",
  },
  {
    id: "15",
    nome: "Cama de Pet",
    preco: "R$ 39,98 ",
    image: IMAGES.camadepet,
    tag: "Higiene",
    category: "caes",
  },
  {
    id: "16",
    nome: "Tapete higienico",
    preco: "R$ 37,99 ",
    image: IMAGES.tapetehigienico,
    tag: "Higiene",
    category: "caes",
  },
  {
    id: "17",
    nome: "Comedouro Simples",
    preco: "R$ 15,90 ",
    image: IMAGES.comedourosimples,
    tag: "Popular",
    category: "caes",
  },
  {
    id: "18",
    nome: "Comedouro Duplo",
    preco: "R$ 20,00 ",
    image: IMAGES.comedouroduplo,
    tag: "Popular",
    category: "caes",
  },
  {
    id: "11",
    nome: "Aquário Para Peixes (50L)",
    preco: "R$ 250,00 ",
    image: IMAGES.aquario,
    tag: "Popular",
    category: "peixes",
  },
  {
    id: "19",
    nome: "Ração Para Peixes",
    preco: "R$ 46,10 ",
    image: IMAGES.racaopeixes,
    tag: "Saudável",
    category: "peixes",
  },
  {
    id: "20",
    nome: "Filtro de Agua Aquario",
    preco: "R$ 96,90 ",
    image: IMAGES.filtrodeagua,
    tag: "Higiene",
    category: "peixes",
  },
  {
    id: "21",
    nome: "Bomba de oxigênio",
    preco: "R$ 57,80 ",
    image: IMAGES.bombadeoxigenioaquario,
    tag: "Saúde",
    category: "peixes",
  },
  {
    id: "22",
    nome: "Iluminação LED para aquário",
    preco: "R$ 39,00 ",
    image: IMAGES.iluminacaoaquario,
    tag: "Popular",
    category: "peixes",
  },
  {
    id: "23",
    nome: "Plantas Artificiais para Aquario",
    preco: "R$ 15,59 ",
    image: IMAGES.plantaaquario,
    tag: "Popular",
    category: "peixes",
  },
  {
    id: "24",
    nome: "Pedras Decorativas para Aquario",
    preco: "R$ 20,90 ",
    image: IMAGES.pedradecorativaaquario,
    tag: "Popular",
    category: "peixes",
  },
  {
    id: "25",
    nome: "Esconderijo de Rocha para Aquario",
    preco: "R$ 55,70 ",
    image: IMAGES.esconderijoaquario,
    tag: "Popular",
    category: "peixes",
  },
  {
    id: "26",
    nome: "Ração para Pássaros",
    preco: "R$ 21,50 ",
    image: IMAGES.racaopassaros,
    tag: "Saúde",
    category: "aves",
  },
  {
    id: "27",
    nome: "Ração para Pássaros Premium",
    preco: "R$ 99,90 ",
    image: IMAGES.racaopassaropremium,
    tag: "Saúde",
    category: "aves",
  },
  {
    id: "28",
    nome: "Bebedouro para Pássaros",
    preco: "R$ 11,90 ",
    image: IMAGES.bebedouroaves,
    tag: "Higiene",
    category: "aves",
  },
  {
    id: "29",
    nome: "Comedouro para Pássaros",
    preco: "R$ 14,99 ",
    image: IMAGES.comedouroaves,
    tag: "Higiene",
    category: "aves",
  },
  {
    id: "30",
    nome: "Kit Bebedouro e Comedouro Pássaros",
    preco: "R$ 25,00 ",
    image: IMAGES.kitcomedouro,
    tag: "Higiene",
    category: "aves",
  },
  {
    id: "31",
    nome: "Balanço para Pássaros",
    preco: "R$ 7,90 ",
    image: IMAGES.blancopassaros,
    tag: "Popular",
    category: "aves",
  },
];

const FEATURED_PRODUCT_IDS = ["1", "2", "26", "3", "4"];

const ADOPTION_PETS = [
  {
    id: "a1",
    nome: "Teddy",
    age: "2 anos",
    type: "Gata carinhosa",
    description: "Castrada, vacinada e adora colo. Perfeita para apartamento.",
    image: require("../../assets/pets/teddy.png"),
  },
  {
    id: "a2",
    nome: "Princesa",
    age: "1 ano",
    type: "Cachorro brincalhão",
    description: "Energia positiva e ótimo companheiro para famílias.",
    image: require("../../assets/pets/princesa.png"),
  },
  {
    id: "a3",
    nome: "Mila",
    age: "3 anos",
    type: "Caõ de porte médio",
    description: "Amigável, já está castrado e preparado para adoção.",
    image: require("../../assets/pets/mila.png"),
  },
  {
    id: "a4",
    nome: "Nina",
    age: "6 meses",
    type: "Filhote tímida",
    description: "Gosta de carinho e precisa de um lar tranquilo.",
    image: require("../../assets/pets/nina.png"),
  },
  {
    id: "a5",
    nome: "Bento",
    age: "4 anos",
    type: "Cachorro calmo",
    description: "Sociável e obediente, ideal para quem busca um amigo leal.",
    image: require("../../assets/pets/bento.png"),
  },
  {
    id: "a6",
    nome: "Mia",
    age: "8 meses",
    type: "Gatinha brincalhona",
    description: "Adora brincar com bolinhas e é muito carinhosa.",
    image: require("../../assets/pets/mia.png"),
  },
  {
    id: "a7",
    nome: "Zeus",
    age: "2 anos",
    type: "Cão protetor",
    description: "Leal e guarda bem a casa, já vacinado e castrado.",
    image: require("../../assets/pets/zeus.png"),
  },
  {
    id: "a8",
    nome: "Lola",
    age: "1 ano",
    type: "Gata delicada",
    description: "Calma e charmosa, adora estar perto de pessoas.",
    image: require("../../assets/pets/lola.png"),
  },
];

const VETERINARY_CLINICS = [
  {
    id: "v1",
    name: "Clínica Vet Golden",
    address: "Av. Pet Lovers, 234 - Centro",
    distance: "1,2 km",
  },
  {
    id: "v2",
    name: "Hospital Veterinário Andarilho",
    address: "R. das Flores, 112 - Jardim Pet",
    distance: "2,8 km",
  },
  {
    id: "v3",
    name: "ClinVet 24h",
    address: "Av. Bem Estar, 78 - Vila Animal",
    distance: "3,5 km",
  },
];

const CATEGORIES: Categoria[] = [
  { id: "c1", name: "Cães", icon: "paw", route: "/caes" },
  { id: "c2", name: "Gatos", icon: "logo-octocat", route: "/gatos" },
  { id: "c3", name: "Aves", icon: "egg", route: "/aves" },
  { id: "c4", name: "Peixes", icon: "fish", route: "/peixes" },
];

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme, colorScheme, toggleColorScheme } = useAppTheme();

  const [activeTab, setActiveTab] = useState("home");
  const {
    cart,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    calculateTotal,
    totalItems,
    createOrder,
  } = useCart();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileMenuPosition, setProfileMenuPosition] = useState({
    top: 0,
    right: 0,
  });
  const profileButtonRef = useRef<View>(null);
  const [addressQuery, setAddressQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState("");

  const GOOGLE_MAPS_API_KEY =
    Constants?.expoConfig?.extra?.googleMapsApiKey ?? "";
  const useGoogleMaps = Boolean(GOOGLE_MAPS_API_KEY);

  function getStaticMapUrl(lat: string, lon: string) {
    const width = Math.min(640, Math.floor(SCREEN_WIDTH - 40));
    const height = 260;

    if (useGoogleMaps) {
      const marker = `color:red|label:P|${lat},${lon}`;
      return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=13&size=${width}x${height}&scale=2&markers=${marker}&key=${GOOGLE_MAPS_API_KEY}`;
    }

    return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=13&size=${width}x${height}&markers=${lat},${lon},red-pushpin`;
  }

  const [mapUrl, setMapUrl] = useState<string>(
    getStaticMapUrl("-23.55052", "-46.633308"),
  );

  const geocodeAddress = async (query: string) => {
    if (useGoogleMaps) {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            query,
          )}&key=${GOOGLE_MAPS_API_KEY}`,
        );
        const data = await response.json();
        if (data.status === "OK" && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          setMapUrl(
            getStaticMapUrl(location.lat.toString(), location.lng.toString()),
          );
          setMapError("");
          return;
        }
        setMapError("Endereço não encontrado. Exibindo mapa padrão.");
        return;
      } catch (error) {
        console.error("Geocoding error:", error);
        setMapError("Não foi possível carregar o mapa. Tente novamente.");
        return;
      }
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query,
        )}&format=json&limit=1`,
      );
      const data = await response.json();
      if (data.length > 0 && data[0].lat && data[0].lon) {
        setMapUrl(getStaticMapUrl(data[0].lat, data[0].lon));
        setMapError("");
      } else {
        setMapError("Endereço não encontrado. Exibindo mapa padrão.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setMapError("Não foi possível carregar o mapa. Tente novamente.");
    }
  };

  const handleSearchClinics = async () => {
    const query = addressQuery.trim().toLowerCase();
    setMapLoading(true);
    if (query) {
      await geocodeAddress(query);
    }

    const results = VETERINARY_CLINICS.filter(
      (clinic) =>
        clinic.name.toLowerCase().includes(query) ||
        clinic.address.toLowerCase().includes(query),
    );

    setSearchResults(results.length ? results : VETERINARY_CLINICS);
    setMapLoading(false);
  };

  useEffect(() => {
    // Monitora o estado de login e verifica permissões de administrador
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoggedIn(!!user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "usuarios", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.tipo === "admin") {
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
            }
          }
        } catch (error) {
          console.error("Erro ao verificar admin:", error);
        }
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowProfileMenu(false);
      Alert.alert("Sucesso", "Você saiu da conta.");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível sair.");
    }
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <View style={styles.headerLeft}>
        <Image
          source={IMAGES.logo}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <View>
          <Text style={[styles.welcomeText, { color: theme.textSecondary }]}>
            Olá, Pet Lover!{" "}
          </Text>
          <Text style={[styles.brandText, { color: theme.text }]}>
            Golden Paw
          </Text>
        </View>
      </View>
      <View style={styles.headerActions}>
        {/* Mostra botão de admin apenas se o usuário for administrador */}
        {isAdmin && (
          <TouchableOpacity
            onPress={() => (router.push as any)("/adminDashboard")}
            style={[styles.iconButton, { backgroundColor: theme.surface }]}
          >
            <Ionicons name="settings" size={22} color={theme.primary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={toggleColorScheme}
          style={[styles.iconButton, { backgroundColor: theme.surface }]}
        >
          <Ionicons
            name={colorScheme === "dark" ? "sunny" : "moon"}
            size={22}
            color={theme.primary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          ref={profileButtonRef}
          onLayout={(event: LayoutChangeEvent) => {
            const layout = event.nativeEvent.layout;
            setProfileMenuPosition({
              top: layout.y + layout.height + 5,
              right: 20,
            });
          }}
          onPress={() => setShowProfileMenu(!showProfileMenu)}
          style={[styles.iconButton, { backgroundColor: theme.surface }]}
        >
          <Ionicons
            name={isLoggedIn ? "person" : "person-outline"}
            size={22}
            color={theme.text}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />
      {renderHeader()}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === "home" && (
          <View>
            <View
              style={[styles.heroBanner, { backgroundColor: theme.primary }]}
            >
              <Image
                source={IMAGES.banner}
                style={styles.heroBackgroundImage}
                resizeMode="cover"
              />
              <View style={styles.heroOverlay} />
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>
                  Tudo para o seu melhor amigo
                </Text>
                <Text style={styles.heroSubtitle}>
                  Descontos de até 30% em rações selecionadas.
                </Text>
                <TouchableOpacity
                  style={styles.heroButton}
                  onPress={() => setActiveTab("produtos")}
                >
                  <Text style={styles.heroButtonText}>Comprar Agora</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Categorias
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.categoryItem}
                  onPress={() => router.push(cat.route as CategoryRoute)}
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={28}
                      color={theme.primary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryName,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Destaques
              </Text>
              <TouchableOpacity onPress={() => setActiveTab("produtos")}>
                <Text style={{ color: theme.primary, fontWeight: "600" }}>
                  Ver tudo
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {FEATURED_PRODUCT_IDS.map((id) => {
                const item = PRODUTOS_DATA.find((product) => product.id === id);
                if (!item) return null;
                return (
                  <View
                    key={`feat-${item.id}`}
                    style={[
                      styles.featuredCard,
                      { backgroundColor: theme.surface },
                    ]}
                  >
                    <View style={styles.tagBadge}>
                      <Text style={styles.tagText}>{item.tag}</Text>
                    </View>
                    <Image
                      source={item.image}
                      style={styles.featuredImage}
                      resizeMode="contain"
                    />
                    <Text
                      style={[styles.productName, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {item.nome}
                    </Text>
                    <Text
                      style={[styles.productPrice, { color: theme.primary }]}
                    >
                      {item.preco}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.addButton,
                        { backgroundColor: theme.primary },
                      ]}
                      onPress={() => addToCart(item)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="add" size={20} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {activeTab === "produtos" && (
          <View style={styles.gridContainer}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.text, marginBottom: 20 },
              ]}
            >
              Nossa Loja
            </Text>
            <View style={styles.grid}>
              {PRODUTOS_DATA.map((item) => (
                <View
                  key={`grid-${item.id}`}
                  style={[styles.gridCard, { backgroundColor: theme.surface }]}
                >
                  <Image
                    source={item.image}
                    style={styles.gridImage}
                    resizeMode="contain"
                  />
                  <View style={styles.gridInfo}>
                    <Text
                      style={[styles.productName, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {item.nome}
                    </Text>
                    <Text
                      style={[styles.productPrice, { color: theme.primary }]}
                    >
                      {item.preco}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.gridAddButton,
                      { backgroundColor: theme.primary },
                    ]}
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

        {activeTab === "carrinho" && (
          <View style={styles.cartContainer}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.text, marginBottom: 20 },
              ]}
            >
              Meu Carrinho
            </Text>
            {totalItems === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="cart-outline"
                  size={80}
                  color={theme.textSecondary}
                />
                <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
                  Vazio
                </Text>
                <TouchableOpacity
                  style={[
                    styles.emptyButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={() => setActiveTab("produtos")}
                >
                  <Text style={styles.emptyButtonText}>Ir para a Loja</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.cartList}>
                {cart.map((item) => (
                  <View
                    key={item.cartId}
                    style={[
                      styles.cartItem,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Image
                      source={item.image}
                      style={styles.cartItemImage}
                      resizeMode="contain"
                    />
                    <View style={styles.cartItemInfo}>
                      <Text style={[styles.productName, { color: theme.text }]}>
                        {item.nome}
                      </Text>
                      <Text
                        style={[styles.productPrice, { color: theme.primary }]}
                      >
                        {item.preco}
                      </Text>
                    </View>
                    <View style={styles.quantityControl}>
                      <TouchableOpacity
                        onPress={() => decreaseQuantity(item.cartId)}
                      >
                        <Ionicons
                          name="remove-circle-outline"
                          size={22}
                          color={theme.primary}
                        />
                      </TouchableOpacity>
                      <Text
                        style={[{ marginHorizontal: 8, color: theme.text }]}
                      >
                        {item.quantity ?? 1}
                      </Text>
                      <TouchableOpacity
                        onPress={() => increaseQuantity(item.cartId)}
                      >
                        <Ionicons
                          name="add-circle-outline"
                          size={22}
                          color={theme.primary}
                        />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeFromCart(item.cartId)}
                      style={{ marginLeft: 8 }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#EF4444"
                      />
                    </TouchableOpacity>
                  </View>
                ))}
                <View
                  style={[styles.cartFooter, { borderTopColor: theme.border }]}
                >
                  <View style={styles.totalRow}>
                    <Text
                      style={[
                        styles.totalLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Total:
                    </Text>
                    <Text style={[styles.totalValue, { color: theme.text }]}>
                      R$ {calculateTotal()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.checkoutButton,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={() => router.push("/payment")}
                  >
                    <Text style={styles.checkoutButtonText}>
                      Finalizar Compra
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab === "lembretes" && (
          <RemindersScreen
            isLoggedIn={isLoggedIn}
            onNavigateToLogin={() => router.push("/login")}
          />
        )}

        {activeTab === "veterinaria" && (
          <View style={styles.vetContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Clínicas Veterinárias
            </Text>
            <Text
              style={[
                styles.adoptionDescription,
                { color: theme.textSecondary },
              ]}
            >
              Busque o atendimento mais próximo e veja clínicas disponíveis na
              sua região.
            </Text>

            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              placeholder="Digite endereço ou bairro"
              placeholderTextColor={theme.textSecondary}
              value={addressQuery}
              onChangeText={setAddressQuery}
            />
            <TouchableOpacity
              style={[styles.searchButton, { backgroundColor: theme.primary }]}
              onPress={handleSearchClinics}
            >
              <Text style={styles.searchButtonText}>Buscar clínicas</Text>
            </TouchableOpacity>

            <View
              style={[
                styles.mapContainer,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.mapTitle, { color: theme.text }]}>
                Mapa da região
              </Text>
              <View
                style={[
                  styles.mapPlaceholder,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                ]}
              >
                {mapLoading ? (
                  <Text
                    style={[
                      styles.mapPlaceholderText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Carregando mapa...
                  </Text>
                ) : (
                  <Image
                    source={{ uri: mapUrl }}
                    style={styles.mapImage}
                    resizeMode="cover"
                  />
                )}
              </View>
              {mapError ? (
                <Text style={[styles.mapErrorText, { color: theme.primary }]}>
                  {" "}
                  {mapError}
                </Text>
              ) : null}
            </View>

            <View style={styles.vetList}>
              {searchResults.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text
                    style={[
                      styles.emptyStateTitle,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Digite um endereço para ver clínicas próximas.
                  </Text>
                </View>
              ) : (
                searchResults.map((clinic) => (
                  <View
                    key={clinic.id}
                    style={[
                      styles.vetCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.vetName, { color: theme.text }]}>
                      {clinic.name}
                    </Text>
                    <Text
                      style={[styles.vetMeta, { color: theme.textSecondary }]}
                    >
                      {clinic.address}
                    </Text>
                    <Text
                      style={[styles.vetMeta, { color: theme.textSecondary }]}
                    >
                      Aprox. {clinic.distance}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.bottomTab,
          {
            backgroundColor: theme.surface,
            paddingBottom: insets.bottom + 10,
            borderTopColor: theme.border,
          },
        ]}
      >
        {[
          { id: "home", icon: "home" as const, label: "Início" },
          { id: "produtos", icon: "search" as const, label: "Loja" },
          { id: "carrinho", icon: "cart" as const, label: "Carrinho" },
          { id: "adocao", icon: "paw" as const, label: "Adoção" },
          { id: "veterinaria", icon: "medkit" as const, label: "Clínica" },
          { id: "lembretes", icon: "time" as const, label: "Lembretes" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => {
              if (tab.id === "adocao") {
                (router.push as any)("/adocao");
              } else {
                setActiveTab(tab.id);
              }
            }}
            style={styles.tabItem}
          >
            <Ionicons
              name={
                activeTab === tab.id ? tab.icon : (`${tab.icon}-outline` as any)
              }
              size={24}
              color={activeTab === tab.id ? theme.primary : theme.textSecondary}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color:
                    activeTab === tab.id ? theme.primary : theme.textSecondary,
                },
              ]}
            >
              {tab.label}
            </Text>
            {tab.id === "carrinho" && totalItems > 0 && (
              <View
                style={[styles.cartBadge, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.cartBadgeText}>{totalItems}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {showProfileMenu && (
        <>
          <Pressable
            style={styles.dropdownOverlay}
            onPress={() => setShowProfileMenu(false)}
          />
          <View
            style={[
              styles.dropdownMenu,
              {
                backgroundColor: theme.surface,
                top: profileMenuPosition.top,
                right: profileMenuPosition.right,
              },
            ]}
          >
            {isLoggedIn ? (
              // Menu se o usuário estiver logado
              <>
                <TouchableOpacity
                  style={[
                    styles.dropdownOption,
                    { borderBottomColor: theme.border },
                  ]}
                  onPress={() => {
                    setShowProfileMenu(false);
                    router.push("/profile");
                  }}
                >
                  <Text
                    style={[styles.dropdownOptionText, { color: theme.text }]}
                  >
                    Perfil do Usuário
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.dropdownOption,
                    { borderBottomColor: theme.border },
                  ]}
                  onPress={handleLogout}
                >
                  <Text
                    style={[styles.dropdownOptionText, { color: "#EF4444" }]}
                  >
                    Sair
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              // Menu se o usuário não estiver logado
              <>
                <TouchableOpacity
                  style={[
                    styles.dropdownOption,
                    { borderBottomColor: theme.border },
                  ]}
                  onPress={() => {
                    setShowProfileMenu(false);
                    router.push("/register");
                  }}
                >
                  <Text
                    style={[styles.dropdownOptionText, { color: theme.text }]}
                  >
                    Cadastrar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.dropdownOption,
                    { borderBottomColor: theme.border },
                  ]}
                  onPress={() => {
                    setShowProfileMenu(false);
                    router.push("/login");
                  }}
                >
                  <Text
                    style={[styles.dropdownOptionText, { color: theme.text }]}
                  >
                    Login
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerLogo: { width: 45, height: 45, marginRight: 12, borderRadius: 10 },
  welcomeText: { fontSize: 12, fontWeight: "500" },
  brandText: { fontSize: 18, fontWeight: "800" },
  headerActions: { flexDirection: "row", gap: 10 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  heroBanner: {
    marginHorizontal: 20,
    borderRadius: 24,
    height: 220,
    overflow: "hidden",
    marginBottom: 25,
    position: "relative",
    width: SCREEN_WIDTH - 40,
  },
  heroBackgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  heroContent: {
    flex: 1,
    justifyContent: "center",
    zIndex: 2,
    padding: 25,
  },
  heroTitle: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    marginBottom: 20,
  },
  heroButton: {
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  heroButtonText: { color: "#D4AF37", fontWeight: "bold", fontSize: 14 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  categoriesScroll: { paddingHorizontal: 15, marginBottom: 20 },
  categoryItem: { alignItems: "center", marginHorizontal: 8 },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryName: { fontSize: 12, fontWeight: "600" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  horizontalScroll: { paddingHorizontal: 15, paddingBottom: 10 },
  featuredCard: {
    width: 160,
    borderRadius: 20,
    padding: 15,
    marginHorizontal: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featuredImage: { width: "100%", height: 110, marginBottom: 12 },
  tagBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(212, 175, 55, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 1,
  },
  adoptionContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  adoptionDescription: { fontSize: 15, marginBottom: 20 },
  adoptionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  adoptionCard: {
    width: "48%",
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 16,
  },
  adoptionImage: {
    width: "100%",
    height: 230,
  },
  adoptionImageText: {
    fontSize: 14,
    fontWeight: "700",
  },
  adoptionDetails: { padding: 14 },
  adoptionPetName: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
  adoptionPetMeta: { fontSize: 13, marginBottom: 8 },
  adoptionDescriptionText: { fontSize: 13, lineHeight: 18 },

  tagText: { color: "#D4AF37", fontSize: 10, fontWeight: "700" },
  productName: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  productPrice: { fontSize: 16, fontWeight: "800" },
  addButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  gridContainer: { paddingHorizontal: 20 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridCard: {
    width: "47%",
    borderRadius: 20,
    padding: 12,
    marginBottom: 18,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  gridImage: { width: "100%", height: 150, marginBottom: 10 },
  gridInfo: { paddingHorizontal: 4 },
  gridAddButton: {
    marginTop: 10,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomTab: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
  },
  tabItem: { alignItems: "center" },
  tabLabel: { fontSize: 10, fontWeight: "600", marginTop: 4 },
  cartContainer: { paddingHorizontal: 20 },
  cartList: { marginBottom: 20 },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 10,
  },
  cartItemImage: { width: 50, height: 50, marginRight: 15 },
  cartItemInfo: { flex: 1 },
  cartFooter: { marginTop: 20, paddingTop: 20, borderTopWidth: 1 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  totalLabel: { fontSize: 16, fontWeight: "600" },
  totalValue: { fontSize: 20, fontWeight: "800" },
  checkoutButton: {
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  checkoutButtonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 20,
  },
  emptyButton: { paddingHorizontal: 30, paddingVertical: 15, borderRadius: 15 },
  emptyButtonText: { color: "#FFF", fontWeight: "bold" },
  searchInput: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 15,
  },
  searchButton: {
    height: 50,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  searchButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  vetContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  mapContainer: {
    borderRadius: 22,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  mapTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  mapPlaceholder: {
    height: 260,
    borderRadius: 18,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  mapImage: { width: "100%", height: "100%" },
  mapPlaceholderText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  mapErrorText: { marginTop: 10, fontSize: 12 },
  vetList: { marginTop: 10 },
  vetCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  vetName: { fontSize: 15, fontWeight: "800", marginBottom: 6 },
  vetMeta: { fontSize: 13 },
  dropdownOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 98,
  },
  dropdownMenu: {
    position: "absolute",
    width: 160,
    borderRadius: 12,
    overflow: "hidden",
    zIndex: 99,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  dropdownOption: { padding: 15, borderBottomWidth: 1, alignItems: "center" },
  dropdownOptionText: { fontSize: 16, fontWeight: "600" },
  cartBadge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  cartBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "700" },
  quantityControl: { flexDirection: "row", alignItems: "center" },
});
