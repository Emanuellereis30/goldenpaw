import { useAppTheme } from "@/hooks/use-app-theme";
import { useCart } from "@/hooks/use-cart";
import { Ionicons } from "@expo/vector-icons";
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
  image: any; // Pode ser uma URL do Firebase ou um require() local
  tag?: string;
  category?: string;
  kg?: string;
  estoque?: number;
}

export default function LojaScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { addToCart } = useCart();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Escuta as atualizações do banco de dados em tempo real
  useEffect(() => {
    // Busca os produtos ordenados pelo nome (opcional)
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

  // Filtra produtos pela barra de busca E oculta os que não têm estoque
  const filteredProdutos = produtos.filter(
    (item) =>
      (item.estoque || 0) > 0 && // O "( || 0)" resolve o erro do TypeScript
      item.nome.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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

        {/* ── Barra de Busca (Adição para melhor UX) ── */}
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
            <View style={styles.grid}>
              {filteredProdutos.map((item) => {
                // Trata a imagem para aceitar URLs do Firebase ou imagens locais (require)
                const imageSource =
                  typeof item.image === "string"
                    ? { uri: item.image }
                    : item.image;

                return (
                  <View
                    key={`grid-${item.id}`}
                    style={[
                      styles.gridCard,
                      { backgroundColor: theme.surface },
                    ]}
                  >
                    {/* Tag de Destaque / Desconto (Se existir) */}
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
            {!loading && filteredProdutos.length === 0 && (
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
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  header: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "500",
  },
  gridContainer: {
    flex: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridCard: {
    width: "48%", // Distribui em 2 colunas com um pequeno espaçamento
    borderRadius: 20,
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
  tagText: {
    color: "#D4AF37",
    fontSize: 10,
    fontWeight: "700",
  },
  gridImage: {
    width: "100%",
    height: 140,
    marginBottom: 12,
  },
  gridInfo: {
    paddingHorizontal: 2,
    flex: 1,
    justifyContent: "flex-end",
  },
  productName: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
    minHeight: 36, // Mantém as caixas alinhadas se o nome quebrar em 2 linhas
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
  },
  gridAddButton: {
    flexDirection: "row",
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  gridAddButtonText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    width: "100%",
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: "center",
  },
});
