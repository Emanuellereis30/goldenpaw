import { useAppTheme } from "@/hooks/use-app-theme";
import { useCart } from "@/hooks/use-cart";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFontSize } from "../../contexts/FontSizeContext";
import { auth, db } from "../../firebaseConfig";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Produto {
  id: string;
  nome: string;
  preco: string;
  image: any;
  tag?: string;
  category?: string;
  estoque?: number;
}

interface Categoria {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const IMAGES = {
  banner: require("../../assets/img/banner.png"),
  logo: require("../../assets/img/logo.png"),
};

const CATEGORIES: Categoria[] = [
  { id: "c1", name: "Cães", icon: "paw" },
  { id: "c2", name: "Gatos", icon: "logo-octocat" },
  { id: "c3", name: "Aves", icon: "egg" },
  { id: "c4", name: "Peixes", icon: "fish" },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme, colorScheme, toggleColorScheme } = useAppTheme();
  const { addToCart } = useCart();
  const { fontSize, increaseFontSize, decreaseFontSize } = useFontSize();

  const [featuredProducts, setFeaturedProducts] = useState<Produto[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileMenuPosition, setProfileMenuPosition] = useState({
    top: 0,
    right: 0,
  });
  const profileButtonRef = useRef<View>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoggedIn(!!user);
      if (user) {
        if (user.email?.toLowerCase() === "admin@goldenpaw.com") {
          setIsAdmin(true);
        } else {
          try {
            const q = query(collection(db, "admin"), where("uid", "==", user.uid));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
              setIsAdmin(true);
            } else {
              const userDoc = await getDoc(doc(db, "usuarios", user.uid));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                setIsAdmin(userData.tipo === "admin");
              } else {
                setIsAdmin(false);
              }
            }
          } catch (error) {
            console.error("Erro ao verificar permissões de admin:", error);
            setIsAdmin(false);
          }
        }
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "produtos"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const produtosFirestore = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Produto[];
      const produtosEmEstoque = produtosFirestore.filter(
        (p) => p.estoque && p.estoque > 0
      );
      const comTag = produtosEmEstoque.filter((p) => p.tag);
      setFeaturedProducts(
        comTag.length > 0 ? comTag.slice(0, 5) : produtosEmEstoque.slice(0, 5)
      );
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowProfileMenu(false);
      Alert.alert("Sucesso", "Sessão terminada com sucesso.");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível terminar a sessão.");
    }
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <View style={styles.headerLeft}>
        <Image source={IMAGES.logo} style={styles.headerLogo} resizeMode="contain" />
        <View>
          <Text style={[styles.welcomeText, { color: theme.textSecondary, fontSize: fontSize - 2 }]}>
            Olá, Pet Lover!
          </Text>
          <Text style={[styles.brandText, { color: theme.text, fontSize: fontSize + 4 }]}>
            Golden Paw
          </Text>
        </View>
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity
          onPress={toggleColorScheme}
          style={[styles.iconButton, { backgroundColor: theme.surface }]}
        >
          <Ionicons name={colorScheme === "dark" ? "sunny" : "moon"} size={22} color={theme.primary} />
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
          <Ionicons name={isLoggedIn ? "person" : "person-outline"} size={22} color={theme.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />
      {renderHeader()}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.heroBanner, { backgroundColor: theme.primary }]}>
          <Image source={IMAGES.banner} style={styles.heroBackgroundImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={[styles.heroTitle, { fontSize: fontSize + 8 }]}>Tudo para o seu melhor amigo</Text>
            <Text style={[styles.heroSubtitle, { fontSize: fontSize }]}>
              Descontos especiais em produtos selecionados.
            </Text>
            <TouchableOpacity style={styles.heroButton} onPress={() => router.push("/loja")}>
              <Text style={[styles.heroButtonText, { fontSize: fontSize }]}>Comprar Agora</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text, fontSize: fontSize + 2 }]}>Categorias</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryItem}
              onPress={() => router.push({ pathname: "/loja", params: { categoria: cat.name } })}
            >
              <View style={[styles.categoryIcon, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Ionicons name={cat.icon as any} size={28} color={theme.primary} />
              </View>
              <Text style={[styles.categoryName, { color: theme.textSecondary, fontSize: fontSize - 2 }]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text, paddingHorizontal: 0, fontSize: fontSize + 2 }]}>
            Destaques
          </Text>
          <TouchableOpacity onPress={() => router.push("/loja")}>
            <Text style={{ color: theme.primary, fontWeight: "600", fontSize: fontSize - 2 }}>Ver tudo</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          {featuredProducts.map((item) => {
            const imageSource = typeof item.image === "string" ? { uri: item.image } : item.image;
            return (
              <View key={`feat-${item.id}`} style={[styles.featuredCard, { backgroundColor: theme.surface }]}>
                {item.tag && (
                  <View style={styles.tagBadge}>
                    <Text style={[styles.tagText, { fontSize: fontSize - 4 }]}>{item.tag}</Text>
                  </View>
                )}
                <Image source={imageSource} style={styles.featuredImage} resizeMode="contain" />
                <Text style={[styles.productName, { color: theme.text, fontSize: fontSize }]} numberOfLines={1}>
                  {item.nome}
                </Text>
                <Text style={[styles.productPrice, { color: theme.primary, fontSize: fontSize + 2 }]}>
                  R$ {item.preco}
                </Text>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: theme.primary }]}
                  onPress={() => addToCart(item as any)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      </ScrollView>

      {/* Menu dropdown de perfil – controles de fonte sempre visíveis */}
      {showProfileMenu && (
        <>
          <Pressable style={styles.dropdownOverlay} onPress={() => setShowProfileMenu(false)} />
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
            {/* Controles de fonte – sempre disponíveis */}
            <TouchableOpacity
              style={[styles.dropdownOption, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}
              onPress={() => {
                decreaseFontSize();
                setShowProfileMenu(false);
              }}
            >
              <Text style={[styles.dropdownOptionText, { color: theme.text, fontSize: fontSize }]}>
                Diminuir fonte (A-)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dropdownOption, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}
              onPress={() => {
                increaseFontSize();
                setShowProfileMenu(false);
              }}
            >
              <Text style={[styles.dropdownOptionText, { color: theme.text, fontSize: fontSize }]}>
                Aumentar fonte (A+)
              </Text>
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 4 }} />

            {/* Opções de login / perfil conforme estado */}
            {isLoggedIn ? (
              <>
                <TouchableOpacity
                  style={[styles.dropdownOption, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}
                  onPress={() => {
                    setShowProfileMenu(false);
                    if (isAdmin) router.push("/admin/AdminDashboard");
                    else router.push("/profile");
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      {
                        color: isAdmin ? theme.primary : theme.text,
                        fontWeight: isAdmin ? "800" : "600",
                        fontSize: fontSize,
                      },
                    ]}
                  >
                    {isAdmin ? "Admin" : "Perfil"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dropdownOption} onPress={handleLogout}>
                  <Text style={[styles.dropdownOptionText, { color: "#EF4444", fontSize: fontSize }]}>Sair</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.dropdownOption, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}
                  onPress={() => {
                    setShowProfileMenu(false);
                    router.push("/login");
                  }}
                >
                  <Text style={[styles.dropdownOptionText, { color: theme.text, fontSize: fontSize }]}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dropdownOption}
                  onPress={() => {
                    setShowProfileMenu(false);
                    router.push("/register");
                  }}
                >
                  <Text style={[styles.dropdownOptionText, { color: theme.text, fontSize: fontSize }]}>Registrar</Text>
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
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerLogo: { width: 45, height: 45, marginRight: 12, borderRadius: 10 },
  welcomeText: { fontWeight: "500" },
  brandText: { fontWeight: "800" },
  headerActions: { flexDirection: "row", gap: 10, alignItems: "center" },
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
    height: 200,
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
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  heroContent: { flex: 1, justifyContent: "center", zIndex: 2, padding: 25 },
  heroTitle: { color: "#FFF", fontWeight: "800", marginBottom: 8 },
  heroSubtitle: { color: "rgba(255,255,255,0.9)", marginBottom: 16 },
  heroButton: {
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  heroButtonText: { color: "#D4AF37", fontWeight: "bold" },
  sectionTitle: { fontWeight: "700", paddingHorizontal: 20, marginBottom: 15 },
  categoriesScroll: { paddingHorizontal: 15, marginBottom: 25 },
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
  categoryName: { fontWeight: "600" },
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
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    position: "relative",
  },
  featuredImage: { width: "100%", height: 110, marginBottom: 12 },
  tagBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 1,
  },
  tagText: { color: "#D4AF37", fontWeight: "700" },
  productName: { fontWeight: "700", marginBottom: 4 },
  productPrice: { fontWeight: "800" },
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
    width: 180,
    borderRadius: 12,
    overflow: "hidden",
    zIndex: 99,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  dropdownOption: { padding: 14, alignItems: "center" },
  dropdownOptionText: { fontWeight: "600" },
});