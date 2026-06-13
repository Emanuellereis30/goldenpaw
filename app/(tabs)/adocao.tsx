// app/(tabs)/adocao.tsx
import { useNotification } from "@/contexts/NotificationContext";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
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
import { auth, db } from "../../firebaseConfig";

// ── Interface de Tipo ─────────────────────────────────────────────────────────

interface Pet {
  id: string;
  petId?: string;
  nome: string;
  tipo?: "cachorro" | "gato" | "ave" | "peixe";
  raca: string;
  idade?: number;
  age?: string;
  cidade?: string;
  uf?: string;
  porte: "pequeno" | "médio" | "grande";
  sexo: "macho" | "fêmea";
  tags: string | string[];
  fotoUrl?: string;
  image?: any;
}

const PORTES = ["Porte", "pequeno", "médio", "grande"];
const SEXOS = ["Sexo", "macho", "fêmea"];

export default function AdocaoScreen() {
  const { theme } = useAppTheme();
  const { showNotification } = useNotification();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [pets, setPets] = useState<Pet[]>([]);
  const [search, setSearch] = useState("");
  const [porteFilter, setPorteFilter] = useState("Porte");
  const [sexoFilter, setSexoFilter] = useState("Sexo");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showPorteDropdown, setShowPorteDropdown] = useState(false);
  const [showSexoDropdown, setShowSexoDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  // Escuta as atualizações do banco de dados em tempo real
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "pets"),
      (snapshot) => {
        const petsFirestore = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Pet[];
        setPets(petsFirestore);
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao buscar pets do Firestore:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  };

  const filtered = pets.filter((pet) => {
    const nomeValido = pet.nome ? pet.nome.toLowerCase() : "";
    const racaValida = pet.raca ? pet.raca.toLowerCase() : "";

    const matchSearch =
      nomeValido.includes(search.toLowerCase()) ||
      racaValida.includes(search.toLowerCase());

    const matchPorte = porteFilter === "Porte" || pet.porte === porteFilter;
    const matchSexo = sexoFilter === "Sexo" || pet.sexo === sexoFilter;

    return matchSearch && matchPorte && matchSexo;
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 30 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Título ── */}
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: theme.text }]}>
            Adote um Pet
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Encontre seu novo melhor amigo e dê a ele um lar cheio de amor
          </Text>
        </View>

        {/* ── Busca ── */}
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
            placeholder="Buscar por nome ou raça..."
            placeholderTextColor={theme.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Filtros ── */}
        <View style={styles.filtersRow}>
          {/* Porte */}
          <View style={styles.filterWrap}>
            <TouchableOpacity
              style={[
                styles.filterBtn,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => {
                setShowPorteDropdown(!showPorteDropdown);
                setShowSexoDropdown(false);
              }}
            >
              <Ionicons
                name="filter-outline"
                size={16}
                color={theme.textSecondary}
              />
              <Text style={[styles.filterText, { color: theme.text }]}>
                {porteFilter}
              </Text>
              <Ionicons
                name="chevron-down"
                size={14}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
            {showPorteDropdown && (
              <View
                style={[
                  styles.dropdown,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                {PORTES.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.dropdownItem,
                      { borderBottomColor: theme.border },
                    ]}
                    onPress={() => {
                      setPorteFilter(p);
                      setShowPorteDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownText,
                        {
                          color: porteFilter === p ? theme.primary : theme.text,
                        },
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Sexo */}
          <View style={styles.filterWrap}>
            <TouchableOpacity
              style={[
                styles.filterBtn,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => {
                setShowSexoDropdown(!showSexoDropdown);
                setShowPorteDropdown(false);
              }}
            >
              <Ionicons
                name="filter-outline"
                size={16}
                color={theme.textSecondary}
              />
              <Text style={[styles.filterText, { color: theme.text }]}>
                {sexoFilter}
              </Text>
              <Ionicons
                name="chevron-down"
                size={14}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
            {showSexoDropdown && (
              <View
                style={[
                  styles.dropdown,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                {SEXOS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.dropdownItem,
                      { borderBottomColor: theme.border },
                    ]}
                    onPress={() => {
                      setSexoFilter(s);
                      setShowSexoDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownText,
                        {
                          color: sexoFilter === s ? theme.primary : theme.text,
                        },
                      ]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ── Contagem / Loading ── */}
        {loading ? (
          <ActivityIndicator
            size="small"
            color={theme.primary}
            style={{ marginVertical: 10 }}
          />
        ) : (
          <Text style={[styles.count, { color: theme.textSecondary }]}>
            {filtered.length}{" "}
            {filtered.length === 1 ? "pet disponível" : "pets disponíveis"}
          </Text>
        )}

        {/* ── Lista de Cards ── */}
        {filtered.map((pet) => {
          const idadeExibida =
            pet.idade !== undefined
              ? `${pet.idade}`
              : pet.age || "Não informada";

          const tagsArray = Array.isArray(pet.tags)
            ? pet.tags
            : typeof pet.tags === "string"
              ? pet.tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
              : [];

          const imagemSource = pet.fotoUrl
            ? { uri: pet.fotoUrl }
            : typeof pet.image === "string"
              ? { uri: pet.image }
              : pet.image;

          return (
            <View
              key={pet.id}
              style={[
                styles.card,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              {/* Foto */}
              <View style={styles.imageWrap}>
                {imagemSource ? (
                  <Image
                    source={imagemSource}
                    style={styles.petImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.petImagePlaceholder,
                      { backgroundColor: theme.border },
                    ]}
                  >
                    <Ionicons
                      name="paw"
                      size={48}
                      color={theme.textSecondary}
                    />
                  </View>
                )}
                {/* Botão favorito */}
                <TouchableOpacity
                  style={[
                    styles.heartBtn,
                    { backgroundColor: "rgba(255,255,255,0.9)" },
                  ]}
                  onPress={() => toggleFavorite(pet.id)}
                >
                  <Ionicons
                    name={
                      favorites.includes(pet.id) ? "heart" : "heart-outline"
                    }
                    size={20}
                    color={favorites.includes(pet.id) ? "#EF4444" : "#555"}
                  />
                </TouchableOpacity>
              </View>

              {/* Corpo do Card */}
              <View style={styles.cardBody}>
                {/* Nome + Idade */}
                <View style={styles.nameRow}>
                  <Text style={[styles.petName, { color: theme.text }]}>
                    {pet.nome}
                  </Text>
                  <View
                    style={[
                      styles.ageBadge,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.ageText, { color: theme.textSecondary }]}
                    >
                      {idadeExibida}
                    </Text>
                  </View>
                </View>

                {/* Raça */}
                <Text style={[styles.raca, { color: theme.textSecondary }]}>
                  {pet.raca}
                </Text>

                {/* Localização */}
                <View style={styles.locationRow}>
                  <Ionicons
                    name="location-outline"
                    size={13}
                    color={theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.locationText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {pet.cidade || "Rio de Janeiro"}, {pet.uf || "RJ"}
                  </Text>
                </View>

                {/* Tags */}
                <View style={styles.tagsRow}>
                  {tagsArray.map((tag) => (
                    <View
                      key={tag}
                      style={[
                        styles.tag,
                        {
                          backgroundColor: theme.background,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.tagText, { color: theme.textSecondary }]}
                      >
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Botão de Ação */}
                <TouchableOpacity
                  style={[styles.adoptBtn, { backgroundColor: theme.primary }]}
                  activeOpacity={0.8}
                  onPress={() => {
                    // Verifica se o usuário está logado antes de prosseguir
                    if (!auth.currentUser) {
                      showNotification(
                        "Acesso Restrito",
                        "Você precisa fazer login no aplicativo para adotar um pet.",
                        "info",
                      );
                      router.push("/login" as any);
                      return;
                    }

                    // Se estiver logado, segue para os detalhes da adoção
                    router.push({
                      pathname: "/adoption/detalhes",
                      params: {
                        petId: pet.id,
                        pet: JSON.stringify(pet),
                      },
                    });
                  }}
                >
                  <Text style={styles.adoptBtnText}>Adotar</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Estado Vazio */}
        {!loading && filtered.length === 0 && (
          <View style={styles.empty}>
            <Ionicons
              name="paw-outline"
              size={60}
              color={theme.textSecondary}
            />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Nenhum pet disponível no momento.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },

  titleBlock: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 20 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15 },

  filtersRow: { flexDirection: "row", gap: 12, marginBottom: 16, zIndex: 10 },
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

  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 20,
  },
  imageWrap: { position: "relative" },
  petImage: { width: "100%", height: 280 },
  petImagePlaceholder: {
    width: "100%",
    height: 280,
    justifyContent: "center",
    alignItems: "center",
  },
  heartBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },

  cardBody: { padding: 16 },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  petName: { fontSize: 20, fontWeight: "800" },
  ageBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  ageText: { fontSize: 12, fontWeight: "600" },

  raca: { fontSize: 14, marginBottom: 6 },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  locationText: { fontSize: 13 },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  tag: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tagText: { fontSize: 12 },

  adoptBtn: {
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  adoptBtnText: { color: "#FFF", fontSize: 15, fontWeight: "700" },

  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16 },
});
