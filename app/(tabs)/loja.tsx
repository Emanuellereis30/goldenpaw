import { useNotification } from "@/contexts/NotificationContext";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useCart } from "@/hooks/use-cart";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, onSnapshot, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
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
import { auth, db } from "../../firebaseConfig";

// ── Interface de Tipo ─────────────────────────────────────────────────────────

interface Produto {
  id: string;
  nome: string;
  preco: string;
  image: any;
  tag?: string;
  category?: string;
  kg?: string;
  estoque?: number;
  descricao?: string;
}

const CATEGORIAS = ["Categorias", "Cães", "Gatos", "Aves", "Peixes", "Outros"];
const ORDENACOES = [
  { label: "A-Z", value: "nome_asc" },
  { label: "Menor Preço", value: "preco_asc" },
  { label: "Maior Preço", value: "preco_desc" },
];

export default function LojaScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addToCart } = useCart();
  const { showNotification } = useNotification();

  // ── Captura o parâmetro enviado pela tela inicial (Home) ──
  const { categoria } = useLocalSearchParams<{ categoria?: string }>();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Estados dos filtros
  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState<string>("Categorias");
  const [ordenacao, setOrdenacao] = useState<string>("nome_asc");

  // Estados para controlar a exibição dos dropdowns
  const [showCategoriaDropdown, setShowCategoriaDropdown] = useState(false);
  const [showOrdenacaoDropdown, setShowOrdenacaoDropdown] = useState(false);

  // Estado para o modal de detalhes do produto
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);

  // ── Se o usuário vier da Home clicando numa categoria, atualiza o filtro ──
  useEffect(() => {
    if (categoria) {
      setCategoriaSelecionada(categoria);
    }
  }, [categoria]);

  // Escuta as atualizações do banco de dados em tempo real
  useEffect(() => {
    const q = query(collection(db, "produtos"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const produtosFirestore = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Produto[];

        setProdutos(produtosFirestore);
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao buscar produtos do Firestore:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // 1. Filtrar os produtos (Estoque + Busca + Categoria Inteligente)
  let produtosFiltrados = produtos.filter((item) => {
    const temEstoque = (item.estoque || 0) > 0;
    const correspondeBusca = item.nome
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (categoriaSelecionada === "Categorias") {
      return temEstoque && correspondeBusca;
    }

    const categoriaDoBanco = item.category || (item as any).categoria || "";

    const normalizar = (texto: string) =>
      texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const catSelecionadaNorm = normalizar(categoriaSelecionada);
    const catBancoNorm = normalizar(categoriaDoBanco);

    let correspondeCategoria = false;

    if (
      catSelecionadaNorm === "caes" &&
      (catBancoNorm.includes("caes") ||
        catBancoNorm.includes("cao") ||
        catBancoNorm.includes("cachorro"))
    ) {
      correspondeCategoria = true;
    } else if (
      catSelecionadaNorm === "gatos" &&
      catBancoNorm.includes("gato")
    ) {
      correspondeCategoria = true;
    } else if (catSelecionadaNorm === "aves" && catBancoNorm.includes("ave")) {
      correspondeCategoria = true;
    } else if (
      catSelecionadaNorm === "peixes" &&
      catBancoNorm.includes("peixe")
    ) {
      correspondeCategoria = true;
    } else if (catBancoNorm.includes(catSelecionadaNorm)) {
      correspondeCategoria = true;
    }

    return temEstoque && correspondeBusca && correspondeCategoria;
  });

  // 2. Ordenar os produtos filtrados (À prova de falhas)
  produtosFiltrados.sort((a, b) => {
    const converterPreco = (valor: any) => {
      if (valor === undefined || valor === null || valor === "") return 0;
      if (typeof valor === "number") return valor;

      const apenasNumeros = String(valor)
        .replace(/[^\d.,]/g, "")
        .replace(",", ".");
      const numeroFinal = parseFloat(apenasNumeros);

      return isNaN(numeroFinal) ? 0 : numeroFinal;
    };

    const precoA = converterPreco(a.preco);
    const precoB = converterPreco(b.preco);

    const nomeA = a.nome || "";
    const nomeB = b.nome || "";

    switch (ordenacao) {
      case "nome_asc":
        return nomeA.localeCompare(nomeB);
      case "preco_asc":
        return precoA - precoB;
      case "preco_desc":
        return precoB - precoA;
      default:
        return 0;
    }
  });

  const rotuloOrdenacaoAtual =
    ORDENACOES.find((o) => o.value === ordenacao)?.label || "Ordenar";

  // ── Função auxiliar para adicionar ao carrinho com verificação de login ──
  const handleAddToCart = (product: Produto) => {
    if (!auth.currentUser) {
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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Nossa Loja
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Tudo o que o seu melhor amigo precisa
          </Text>
        </View>

        {/* ── Barra de Busca ── */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color={theme.textSecondary}
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Buscar produtos..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Filtros Estilo Adoção (Dropdown) ── */}
        <View style={styles.filtersRow}>
          {/* Dropdown de Categorias */}
          <View style={styles.filterWrap}>
            <TouchableOpacity
              style={[
                styles.filterBtn,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => {
                setShowCategoriaDropdown(!showCategoriaDropdown);
                setShowOrdenacaoDropdown(false);
              }}
            >
              <Ionicons
                name="filter-outline"
                size={16}
                color={theme.textSecondary}
              />
              <Text
                style={[styles.filterText, { color: theme.text }]}
                numberOfLines={1}
              >
                {categoriaSelecionada}
              </Text>
              <Ionicons
                name="chevron-down"
                size={14}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
            {showCategoriaDropdown && (
              <View
                style={[
                  styles.dropdown,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                {CATEGORIAS.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.dropdownItem,
                      { borderBottomColor: theme.border },
                    ]}
                    onPress={() => {
                      setCategoriaSelecionada(cat);
                      setShowCategoriaDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownText,
                        {
                          color:
                            categoriaSelecionada === cat
                              ? theme.primary
                              : theme.text,
                        },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Dropdown de Ordenação */}
          <View style={styles.filterWrap}>
            <TouchableOpacity
              style={[
                styles.filterBtn,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => {
                setShowOrdenacaoDropdown(!showOrdenacaoDropdown);
                setShowCategoriaDropdown(false);
              }}
            >
              <Ionicons
                name="swap-vertical-outline"
                size={16}
                color={theme.textSecondary}
              />
              <Text
                style={[styles.filterText, { color: theme.text }]}
                numberOfLines={1}
              >
                {rotuloOrdenacaoAtual}
              </Text>
              <Ionicons
                name="chevron-down"
                size={14}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
            {showOrdenacaoDropdown && (
              <View
                style={[
                  styles.dropdown,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                {ORDENACOES.map((ord) => (
                  <TouchableOpacity
                    key={ord.value}
                    style={[
                      styles.dropdownItem,
                      { borderBottomColor: theme.border },
                    ]}
                    onPress={() => {
                      setOrdenacao(ord.value);
                      setShowOrdenacaoDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownText,
                        {
                          color:
                            ordenacao === ord.value
                              ? theme.primary
                              : theme.text,
                        },
                      ]}
                    >
                      {ord.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ── Status de Carregamento ── */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              A carregar produtos...
            </Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {/* Contagem */}
            <Text style={[styles.count, { color: theme.textSecondary }]}>
              {produtosFiltrados.length}{" "}
              {produtosFiltrados.length === 1
                ? "produto encontrado"
                : "produtos encontrados"}
            </Text>

            <View style={styles.grid}>
              {produtosFiltrados.map((item) => {
                const imageSource =
                  typeof item.image === "string"
                    ? { uri: item.image }
                    : item.image;

                return (
                  <TouchableOpacity
                    key={`grid-${item.id}`}
                    style={[
                      styles.gridCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => setSelectedProduto(item)}
                    activeOpacity={0.85}
                  >
                    {item.tag && (
                      <View style={styles.tagBadge}>
                        <Text style={styles.tagText}>{item.tag}</Text>
                      </View>
                    )}

                    <Image
                      source={imageSource}
                      style={styles.gridImage}
                      resizeMode="contain"
                    />

                    <View style={styles.gridInfo}>
                      <Text
                        style={[styles.productName, { color: theme.text }]}
                        numberOfLines={2}
                      >
                        {item.nome} {item.kg ? `- ${item.kg}kg` : ""}
                      </Text>
                      <Text
                        style={[styles.productPrice, { color: theme.primary }]}
                      >
                        R$ {item.preco}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.gridAddButton,
                        { backgroundColor: theme.primary },
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleAddToCart(item);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add" size={20} color="#FFF" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
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
                      { color: theme.text, fontSize: 20 },
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
                        { color: theme.textSecondary, fontSize: 12 },
                      ]}
                    >
                      {selectedProduto.category ||
                        (selectedProduto as any).categoria}
                    </Text>
                  )}

                  <Text
                    style={[
                      styles.modalPrice,
                      { color: theme.primary, fontSize: 24 },
                    ]}
                  >
                    R$ {selectedProduto.preco}
                  </Text>

                  {selectedProduto.descricao ? (
                    <Text
                      style={[
                        styles.modalDescription,
                        { color: theme.textSecondary, fontSize: 14 },
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
                          fontSize: 14,
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
                  <Text style={styles.modalAddButtonText}>
                    Adicionar ao Carrinho
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: { paddingHorizontal: 20, paddingTop: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 28, fontWeight: "800", marginBottom: 4 },
  subtitle: { fontSize: 14, fontWeight: "500" },

  // Busca
  searchContainer: { paddingHorizontal: 20, marginBottom: 15 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 15,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: "500" },

  // Filtros (Dropdowns)
  filtersRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
    zIndex: 10,
  },
  filterWrap: { flex: 1, position: "relative" },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  filterText: { fontSize: 13, fontWeight: "600", marginHorizontal: 6, flex: 1 },
  dropdown: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 6,
    zIndex: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dropdownItem: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  dropdownText: { fontSize: 14, fontWeight: "500" },

  // Grid de Produtos
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  loadingText: { marginTop: 12, fontSize: 15, fontWeight: "500" },
  gridContainer: { paddingHorizontal: 12 },
  count: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 15,
    paddingHorizontal: 8,
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  gridCard: {
    width: "46%",
    margin: "2%",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    position: "relative",
  },
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
  tagText: { color: "#D4AF37", fontSize: 10, fontWeight: "800" },
  gridImage: { width: "100%", height: 120, marginBottom: 10 },
  gridInfo: { marginBottom: 35 },
  productName: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
    lineHeight: 18,
  },
  productPrice: { fontSize: 16, fontWeight: "800" },
  gridAddButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
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
  modalImage: { width: "100%", height: 200, marginBottom: 16 },
  modalProductName: { fontWeight: "800", marginBottom: 4 },
  modalCategory: {
    fontWeight: "600",
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
  modalAddButtonText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
