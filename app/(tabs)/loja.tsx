import { useAppTheme } from "@/hooks/use-app-theme";
import { useCart } from "@/hooks/use-cart";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { collection, onSnapshot, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import { db } from "../../firebaseConfig";

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
  const { addToCart } = useCart();

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
                  <View
                    key={`grid-${item.id}`}
                    style={[
                      styles.gridCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
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
                      onPress={() => addToCart(item as any)}
                      activeOpacity={0.8}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="cart-outline" size={18} color="#FFF" />
                      <Text style={styles.gridAddButtonText}>Adicionar</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            {/* Empty State */}
            {!loading && produtosFiltrados.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons
                  name="cube-outline"
                  size={60}
                  color={theme.textSecondary}
                />
                <Text
                  style={[
                    styles.emptyStateText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Nenhum produto encontrado.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24 },
  header: { marginBottom: 20 },
  sectionTitle: { fontSize: 26, fontWeight: "800", marginBottom: 4 },
  subtitle: { fontSize: 14 },
  searchContainer: { marginBottom: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: 15 },
  filtersRow: { flexDirection: "row", gap: 12, marginBottom: 20, zIndex: 10 },
  filterWrap: { flex: 1, zIndex: 10 },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    gap: 6,
  },
  filterText: { flex: 1, fontSize: 14, fontWeight: "500" },
  dropdown: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    zIndex: 99,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  dropdownText: { fontSize: 14, fontWeight: "500" },
  count: { fontSize: 13, marginBottom: 16 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  loadingText: { marginTop: 12, fontSize: 15, fontWeight: "500" },
  gridContainer: { flex: 1 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridCard: {
    width: "48%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
  tagText: { color: "#D4AF37", fontSize: 10, fontWeight: "700" },
  gridImage: { width: "100%", height: 140, marginBottom: 12 },
  gridInfo: { paddingHorizontal: 2, flex: 1, justifyContent: "flex-end" },
  productName: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
    minHeight: 36,
  },
  productPrice: { fontSize: 16, fontWeight: "800", marginBottom: 10 },
  gridAddButton: {
    flexDirection: "row",
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  gridAddButtonText: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    width: "100%",
  },
  emptyStateText: { fontSize: 16, marginTop: 12, textAlign: "center" },
});
