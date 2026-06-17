// app/(tabs)/index.tsx
import { useNotification } from "@/contexts/NotificationContext";
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
  Dimensions,
  Image,
  LayoutChangeEvent,
  Modal,
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
  kg?: string;
  descricao?: string;
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

/** Gera as iniciais a partir do nome completo (máx. 2 letras) */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme, colorScheme, toggleColorScheme, setColorScheme } =
    useAppTheme();
  const { addToCart } = useCart();
  const { fontSize, increaseFontSize, decreaseFontSize } = useFontSize();
  const { showNotification } = useNotification();

  const [featuredProducts, setFeaturedProducts] = useState<Produto[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAppearanceSubmenu, setShowAppearanceSubmenu] = useState(false);
  const [showAccessibilitySubmenu, setShowAccessibilitySubmenu] =
    useState(false);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [profileMenuPosition, setProfileMenuPosition] = useState({
    top: 0,
    right: 0,
  });
  const profileButtonRef = useRef<View>(null);

  // ── Autenticação e dados do usuário ──────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoggedIn(!!user);
      if (user) {
        // Buscar nome no Firestore (suporta schema raiz e aninhado em userData)
        try {
          const userDoc = await getDoc(doc(db, "usuarios", user.uid));
          if (userDoc.exists()) {
            const docData = userDoc.data();
            const actualData = docData.userData || docData;
            const nome =
              actualData.nome ||
              user.displayName ||
              user.email?.split("@")[0] ||
              "";
            setUserName(nome);
          } else {
            setUserName(user.displayName || user.email?.split("@")[0] || "");
          }
        } catch {
          setUserName(user.displayName || user.email?.split("@")[0] || "");
        }

        // Verificar permissões de admin
        if (user.email?.toLowerCase() === "admin@goldenpaw.com") {
          setIsAdmin(true);
        } else {
          try {
            const q = query(
              collection(db, "admin"),
              where("uid", "==", user.uid),
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
              setIsAdmin(true);
            } else {
              const userDoc = await getDoc(doc(db, "usuarios", user.uid));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                const actualData = userData.userData || userData;
                setIsAdmin(actualData.tipo === "admin");
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
        setUserName("");
      }
    });
    return () => unsubscribe();
  }, []);

  // ── Produtos em destaque ─────────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, "produtos"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const produtosFirestore = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Produto[];
      const produtosEmEstoque = produtosFirestore.filter(
        (p) => p.estoque && p.estoque > 0,
      );
      const comTag = produtosEmEstoque.filter((p) => p.tag);
      setFeaturedProducts(
        comTag.length > 0 ? comTag.slice(0, 5) : produtosEmEstoque.slice(0, 5),
      );
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowProfileMenu(false);
      showNotification("Sucesso", "Sessão terminada com sucesso.", "success");
    } catch (error) {
      showNotification("Erro", "Não foi possível terminar a sessão.", "error");
    }
  };

  // ── Função auxiliar para adicionar ao carrinho com verificação de login ──
  const handleAddToCart = (product: Produto) => {
    if (!isLoggedIn) {
      showNotification(
        "Acesso Restrito",
        "Faça login para adicionar produtos ao carrinho.",
        "info",
      );
      router.push("/login");
      return;
    }
    addToCart(product as any);
    showNotification("Sucesso", "Produto adicionado ao carrinho!", "success");
  };

  // ── Texto de saudação ────────────────────────────────────────────────────
  const greetingName =
    isLoggedIn && userName ? userName.split(" ")[0] : "Pet Lover";

  // ── Cabeçalho ────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      {/* Esquerda: logo + saudação */}
      <View style={styles.headerLeft}>
        <Image
          source={IMAGES.logo}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <View>
          <Text
            style={[
              styles.welcomeText,
              { color: theme.textSecondary, fontSize: fontSize - 2 },
            ]}
          >
            Olá, {greetingName}!
          </Text>
          <Text
            style={[
              styles.brandText,
              { color: theme.text, fontSize: fontSize + 4 },
            ]}
          >
            Golden Paw
          </Text>
        </View>
      </View>

      {/* Direita: botão avatar + seta */}
      <View
        ref={profileButtonRef}
        onLayout={(event: LayoutChangeEvent) => {
          const layout = event.nativeEvent.layout;
          setProfileMenuPosition({
            top: layout.y + layout.height + insets.top + 18,
            right: 20,
          });
        }}
      >
        <TouchableOpacity
          onPress={() => {
            setShowAppearanceSubmenu(false);
            setShowAccessibilitySubmenu(false);
            setShowProfileMenu(!showProfileMenu);
          }}
          style={[styles.avatarButton, { borderColor: theme.primary }]}
          activeOpacity={0.8}
        >
          <View
            style={[styles.avatarCircle, { backgroundColor: theme.primary }]}
          >
            {isLoggedIn ? (
              <Text style={styles.avatarText} numberOfLines={1}>
                {getInitials(userName)}
              </Text>
            ) : (
              <Ionicons name="person" size={16} color="#FFFFFF" />
            )}
          </View>

          {/* Texto dinâmico: mostra iniciais logado ou "Entrar" deslogado */}
          <Text
            style={[
              styles.loginText,
              { color: theme.primary, fontSize: fontSize - 2 },
            ]}
          >
            {!isLoggedIn && "Entrar"}
          </Text>

          <Ionicons
            name="chevron-down"
            size={14}
            color={theme.primary}
            style={{ marginLeft: isLoggedIn ? 0 : 4 }}
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
        {/* ── Banner Hero ── */}
        <View style={[styles.heroBanner, { backgroundColor: theme.primary }]}>
          <Image
            source={IMAGES.banner}
            style={styles.heroBackgroundImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={[styles.heroTitle, { fontSize: fontSize + 8 }]}>
              Tudo para o seu melhor amigo
            </Text>
            <Text style={[styles.heroSubtitle, { fontSize: fontSize }]}>
              Descontos especiais em produtos selecionados.
            </Text>
            <TouchableOpacity
              style={styles.heroButton}
              onPress={() => router.push("/loja")}
            >
              <Text style={[styles.heroButtonText, { fontSize: fontSize }]}>
                Comprar Agora
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Card de Adoção ── */}
        <TouchableOpacity
          style={[styles.adoptionCard, { backgroundColor: theme.surface }]}
          activeOpacity={0.8}
          onPress={() => router.push("/adocao")}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: theme.text,
                fontWeight: "800",
                fontSize: fontSize + 2,
                marginBottom: 6,
              }}
            >
              Adote um amigo
            </Text>
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: fontSize - 1,
                marginBottom: 12,
              }}
            >
              Mais de 10 pets aguardam uma família cheia de amor.
            </Text>
            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: theme.primary,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: "#FFF", fontWeight: "700" }}>
                Ver Pets para Adoção
              </Text>
            </View>
          </View>
          <Ionicons
            name="heart"
            size={60}
            color={theme.primary}
            style={{ opacity: 0.7 }}
          />
        </TouchableOpacity>

        {/* ── Categorias ── */}
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.text, fontSize: fontSize + 2 },
          ]}
        >
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
              onPress={() =>
                router.push({
                  pathname: "/loja",
                  params: { categoria: cat.name },
                })
              }
            >
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: theme.surface, borderColor: theme.border },
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
                  { color: theme.textSecondary, fontSize: fontSize - 2 },
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Destaques ── */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.text,
                paddingHorizontal: 0,
                fontSize: fontSize + 2,
              },
            ]}
          >
            Destaques
          </Text>
          <TouchableOpacity onPress={() => router.push("/loja")}>
            <Text
              style={{
                color: theme.primary,
                fontWeight: "600",
                fontSize: fontSize - 2,
              }}
            >
              Ver tudo
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {featuredProducts.map((item) => {
            const imageSource =
              typeof item.image === "string" ? { uri: item.image } : item.image;
            return (
              <TouchableOpacity
                key={`feat-${item.id}`}
                style={[
                  styles.featuredCard,
                  { backgroundColor: theme.surface },
                ]}
                onPress={() => setSelectedProduto(item)}
                activeOpacity={0.85}
              >
                {item.tag && (
                  <View style={styles.tagBadge}>
                    <Text style={[styles.tagText, { fontSize: fontSize - 4 }]}>
                      {item.tag}
                    </Text>
                  </View>
                )}
                <Image
                  source={imageSource}
                  style={styles.featuredImage}
                  resizeMode="contain"
                />
                <Text
                  style={[
                    styles.productName,
                    { color: theme.text, fontSize: fontSize },
                  ]}
                  numberOfLines={1}
                >
                  {item.nome}
                </Text>
                <Text
                  style={[
                    styles.productPrice,
                    { color: theme.primary, fontSize: fontSize + 2 },
                  ]}
                >
                  R$ {item.preco}
                </Text>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: theme.primary }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleAddToCart(item);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={20} color="#FFF" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Dica do Dia ── */}
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.text, fontSize: fontSize + 2, marginTop: 15 },
          ]}
        >
          💡 Dica do Dia
        </Text>
        <View style={[styles.adoptionCard, { backgroundColor: theme.surface }]}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: theme.text,
                fontWeight: "700",
                fontSize: fontSize,
                marginBottom: 8,
              }}
            >
              Água fresca sempre disponível
            </Text>
            <Text
              style={{ color: theme.textSecondary, fontSize: fontSize - 1 }}
            >
              Troque a água diariamente para manter seu pet saudável e
              hidratado.
            </Text>
          </View>
          <Ionicons name="water" size={40} color={theme.primary} />
        </View>
      </ScrollView>

      {/* ── Modal de Detalhes do Produto ── */}
      <Modal
        visible={!!selectedProduto}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedProduto(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedProduto(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.modalCard, { backgroundColor: theme.surface }]}
          >
            {selectedProduto && (
              <>
                <TouchableOpacity
                  style={[
                    styles.modalCloseBtn,
                    { backgroundColor: theme.border },
                  ]}
                  onPress={() => setSelectedProduto(null)}
                >
                  <Ionicons name="close" size={20} color={theme.text} />
                </TouchableOpacity>

                {selectedProduto.tag && (
                  <View style={[styles.tagBadge, { top: 16, left: 16 }]}>
                    <Text style={styles.tagText}>{selectedProduto.tag}</Text>
                  </View>
                )}

                <Image
                  source={
                    typeof selectedProduto.image === "string"
                      ? { uri: selectedProduto.image }
                      : selectedProduto.image
                  }
                  style={styles.modalImage}
                  resizeMode="contain"
                />

                <ScrollView
                  style={{ maxHeight: 260 }}
                  showsVerticalScrollIndicator={false}
                >
                  <Text
                    style={[
                      styles.modalProductName,
                      { color: theme.text, fontSize: fontSize + 4 },
                    ]}
                  >
                    {selectedProduto.nome}
                    {selectedProduto.kg ? ` - ${selectedProduto.kg}kg` : ""}
                  </Text>

                  {(selectedProduto.category ||
                    (selectedProduto as any).categoria) && (
                    <Text
                      style={[
                        styles.modalCategory,
                        { color: theme.textSecondary, fontSize: fontSize - 2 },
                      ]}
                    >
                      {selectedProduto.category ||
                        (selectedProduto as any).categoria}
                    </Text>
                  )}

                  <Text
                    style={[
                      styles.modalPrice,
                      { color: theme.primary, fontSize: fontSize + 8 },
                    ]}
                  >
                    R$ {selectedProduto.preco}
                  </Text>

                  {selectedProduto.descricao ? (
                    <Text
                      style={[
                        styles.modalDescription,
                        { color: theme.textSecondary, fontSize: fontSize },
                      ]}
                    >
                      {selectedProduto.descricao}
                    </Text>
                  ) : (
                    <Text
                      style={[
                        styles.modalDescription,
                        {
                          color: theme.textSecondary,
                          fontSize: fontSize,
                          fontStyle: "italic",
                        },
                      ]}
                    >
                      Sem descrição disponível.
                    </Text>
                  )}
                </ScrollView>

                <TouchableOpacity
                  style={[
                    styles.modalAddButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={() => {
                    handleAddToCart(selectedProduto);
                    setSelectedProduto(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="cart-outline" size={20} color="#FFF" />
                  <Text
                    style={[styles.modalAddButtonText, { fontSize: fontSize }]}
                  >
                    Adicionar ao Carrinho
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Dropdown de perfil ── */}
      {showProfileMenu && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <Pressable
            style={styles.dropdownOverlay}
            onPress={() => {
              setShowProfileMenu(false);
              setShowAppearanceSubmenu(false);
              setShowAccessibilitySubmenu(false);
            }}
          />

          <View
            style={[
              styles.dropdownMenu,
              {
                backgroundColor: theme.surface,
                top: profileMenuPosition.top,
                right: profileMenuPosition.right,
                shadowColor: theme.shadow ?? "#000",
              },
            ]}
          >
            {/* ── Perfil ── */}
            {isLoggedIn && (
              <TouchableOpacity
                style={[
                  styles.dropdownOption,
                  { borderBottomColor: theme.border, borderBottomWidth: 1 },
                ]}
                onPress={() => {
                  setShowProfileMenu(false);
                  if (isAdmin) router.push("/admin/AdminDashboard");
                  else router.push("/profile");
                }}
              >
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={isAdmin ? theme.primary : theme.text}
                  style={styles.dropdownIcon}
                />
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
            )}

            {/* ── Aparência ── */}
            <TouchableOpacity
              style={[
                styles.dropdownOption,
                { borderBottomColor: theme.border, borderBottomWidth: 1 },
              ]}
              onPress={() => {
                setShowAccessibilitySubmenu(false);
                setShowAppearanceSubmenu(!showAppearanceSubmenu);
              }}
            >
              <Ionicons
                name="color-palette-outline"
                size={16}
                color={theme.text}
                style={styles.dropdownIcon}
              />
              <Text
                style={[
                  styles.dropdownOptionText,
                  { color: theme.text, fontSize: fontSize, flex: 1 },
                ]}
              >
                Aparência
              </Text>
              <Ionicons
                name={showAppearanceSubmenu ? "chevron-up" : "chevron-down"}
                size={14}
                color={theme.textSecondary}
              />
            </TouchableOpacity>

            {/* Submenu de aparência */}
            {showAppearanceSubmenu && (
              <View
                style={[
                  styles.submenu,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.submenuOption,
                    colorScheme === "light" && styles.submenuOptionActive,
                    colorScheme === "light" && { borderColor: theme.primary },
                  ]}
                  onPress={() => {
                    setColorScheme("light");
                    setShowAppearanceSubmenu(false);
                  }}
                >
                  <Ionicons
                    name="sunny-outline"
                    size={15}
                    color={
                      colorScheme === "light"
                        ? theme.primary
                        : theme.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.submenuText,
                      {
                        color:
                          colorScheme === "light"
                            ? theme.primary
                            : theme.textSecondary,
                        fontSize: fontSize - 1,
                        fontWeight: colorScheme === "light" ? "700" : "400",
                      },
                    ]}
                  >
                    Claro
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.submenuOption,
                    colorScheme === "dark" && styles.submenuOptionActive,
                    colorScheme === "dark" && { borderColor: theme.primary },
                  ]}
                  onPress={() => {
                    setColorScheme("dark");
                    setShowAppearanceSubmenu(false);
                  }}
                >
                  <Ionicons
                    name="moon-outline"
                    size={15}
                    color={
                      colorScheme === "dark"
                        ? theme.primary
                        : theme.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.submenuText,
                      {
                        color:
                          colorScheme === "dark"
                            ? theme.primary
                            : theme.textSecondary,
                        fontSize: fontSize - 1,
                        fontWeight: colorScheme === "dark" ? "700" : "400",
                      },
                    ]}
                  >
                    Escuro
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── Acessibilidade ── */}
            <TouchableOpacity
              style={[
                styles.dropdownOption,
                { borderBottomColor: theme.border, borderBottomWidth: 1 },
              ]}
              onPress={() => {
                setShowAppearanceSubmenu(false);
                setShowAccessibilitySubmenu(!showAccessibilitySubmenu);
              }}
            >
              <Ionicons
                name="text-outline"
                size={16}
                color={theme.text}
                style={styles.dropdownIcon}
              />
              <Text
                style={[
                  styles.dropdownOptionText,
                  { color: theme.text, fontSize: fontSize, flex: 1 },
                ]}
              >
                Acessibilidade
              </Text>
              <Ionicons
                name={showAccessibilitySubmenu ? "chevron-up" : "chevron-down"}
                size={14}
                color={theme.textSecondary}
              />
            </TouchableOpacity>

            {/* Submenu de acessibilidade (A- / A+) */}
            {showAccessibilitySubmenu && (
              <View
                style={[
                  styles.submenu,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[styles.submenuOption, { borderColor: theme.border }]}
                  onPress={decreaseFontSize}
                >
                  <Text
                    style={[
                      styles.submenuText,
                      {
                        color: theme.primary,
                        fontSize: fontSize,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    A−
                  </Text>
                  <Text
                    style={[
                      styles.submenuText,
                      { color: theme.textSecondary, fontSize: fontSize - 3 },
                    ]}
                  >
                    Diminuir
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submenuOption, { borderColor: theme.border }]}
                  onPress={increaseFontSize}
                >
                  <Text
                    style={[
                      styles.submenuText,
                      {
                        color: theme.primary,
                        fontSize: fontSize + 2,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    A+
                  </Text>
                  <Text
                    style={[
                      styles.submenuText,
                      { color: theme.textSecondary, fontSize: fontSize - 3 },
                    ]}
                  >
                    Aumentar
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── Informações do App ── */}
            <TouchableOpacity
              style={[
                styles.dropdownOption,
                {
                  borderBottomColor: theme.border,
                  borderBottomWidth: isLoggedIn ? 1 : 0,
                },
              ]}
              onPress={() => {
                setShowProfileMenu(false);
                router.push("/sobre");
              }}
            >
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={theme.text}
                style={styles.dropdownIcon}
              />
              <Text
                style={[
                  styles.dropdownOptionText,
                  { color: theme.text, fontSize: fontSize },
                ]}
              >
                Informações do App
              </Text>
            </TouchableOpacity>

            {/* ── Sair (somente logado) ── */}
            {isLoggedIn && (
              <TouchableOpacity
                style={styles.dropdownOption}
                onPress={handleLogout}
              >
                <Ionicons
                  name="log-out-outline"
                  size={16}
                  color="#EF4444"
                  style={styles.dropdownIcon}
                />
                <Text
                  style={[
                    styles.dropdownOptionText,
                    { color: "#EF4444", fontSize: fontSize },
                  ]}
                >
                  Sair
                </Text>
              </TouchableOpacity>
            )}

            {/* ── Entrar (não logado) ── */}
            {!isLoggedIn && (
              <TouchableOpacity
                style={[
                  styles.dropdownOption,
                  { borderTopColor: theme.border, borderTopWidth: 1 },
                ]}
                onPress={() => {
                  setShowProfileMenu(false);
                  router.push("/login");
                }}
              >
                <Ionicons
                  name="log-in-outline"
                  size={16}
                  color={theme.primary}
                  style={styles.dropdownIcon}
                />
                <Text
                  style={[
                    styles.dropdownOptionText,
                    { color: theme.primary, fontSize: fontSize },
                  ]}
                >
                  Entrar
                </Text>
              </TouchableOpacity>
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

  // ── Cabeçalho ──
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

  // ── Botão avatar ──
  avatarButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  loginText: {
    fontWeight: "700",
  },

  // ── Dropdown ──
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
    width: 200,
    borderRadius: 14,
    overflow: "hidden",
    zIndex: 99,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  dropdownOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dropdownIcon: { marginRight: 10 },
  dropdownOptionText: { fontWeight: "600" },

  // ── Submenu ──
  submenu: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
  },
  submenuOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  submenuOptionActive: {},
  submenuText: {},

  // ── Hero Banner ──
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

  // ── Seções ──
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

  // ── Modal de detalhes ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingTop: 20,
    minHeight: 480,
  },
  modalCloseBtn: {
    alignSelf: "flex-end",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  modalImage: { width: "100%", height: 180, marginBottom: 16 },
  modalProductName: { fontWeight: "800", marginBottom: 4 },
  modalCategory: {
    fontWeight: "500",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalPrice: { fontWeight: "800", marginBottom: 12 },
  modalDescription: { lineHeight: 22, marginBottom: 20 },
  modalAddButton: {
    flexDirection: "row",
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  modalAddButtonText: { color: "#FFF", fontWeight: "700" },

  // ── Card de adoção / dica ──
  adoptionCard: {
    marginHorizontal: 20,
    marginBottom: 25,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});
