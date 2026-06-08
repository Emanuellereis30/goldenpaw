import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  ImageSourcePropType,
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
import { useAppTheme } from "../hooks/use-app-theme";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Pet {
  id: string;
  nome: string;
  raca: string;
  age: string;
  cidade: string;
  uf: string;
  porte: "pequeno" | "médio" | "grande";
  sexo: "macho" | "fêmea";
  tags: string[];
  image?: ImageSourcePropType;
}

// ── Dados ─────────────────────────────────────────────────────────────────────

const PETS: Pet[] = [
  {
    id: "a1",
    nome: "Teddy",
    raca: "Siberiano",
    age: "2 anos",
    cidade: "São Paulo",
    uf: "SP",
    porte: "pequeno",
    sexo: "fêmea",
    tags: ["castrado", "vacinado", "calmo", "amoroso"],
    image: require("../assets/pets/teddy.png"),
  },
  {
    id: "a2",
    nome: "Princesa",
    raca: "Poddle",
    age: "3 anos",
    cidade: "São Paulo",
    uf: "SP",
    porte: "grande",
    sexo: "macho",
    tags: ["femea", "vacinada", "amorosa", "castrada"],
    image: require("../assets/pets/princesa.png"),
  },
  {
    id: "a3",
    nome: "Mila",
    raca: "Golden Retriever",
    age: "3 anos",
    cidade: "Rio de Janeiro",
    uf: "RJ",
    porte: "médio",
    sexo: "fêmea",
    tags: ["castrada", "amigável", "vacinada", "companheira"],
    image: require("../assets/pets/mila.png"),
  },
  {
    id: "a4",
    nome: "Nina",
    raca: "Maine Coon",
    age: "6 meses",
    cidade: "Curitiba",
    uf: "PR",
    porte: "pequeno",
    sexo: "fêmea",
    tags: ["filhote", "tímida","vacinada", "castrada"],
    image: require("../assets/pets/nina.png"),
  },
  {
    id: "a5",
    nome: "Bento",
    raca: "Border Collie",
    age: "4 anos",
    cidade: "São Paulo",
    uf: "SP",
    porte: "médio",
    sexo: "macho",
    tags: ["sociável", "obediente", "vacinado", "castrado"],
    image: require("../assets/pets/bento.png"),
  },
  {
    id: "a6",
    nome: "Mia",
    raca: "Siamês",
    age: "8 meses",
    cidade: "Belo Horizonte",
    uf: "MG",
    porte: "pequeno",
    sexo: "fêmea",
    tags: ["filhote", "brincalhona", "vacinado", "castrado"],
    image: require("../assets/pets/mia.png"),
  },
  {
    id: "a7",
    nome: "Zeus",
    raca: "Pastor Alemão",
    age: "2 anos",
    cidade: "São Paulo",
    uf: "SP",
    porte: "grande",
    sexo: "macho",
    tags: ["vacinado", "castrado", "protetor"],
    image: require("../assets/pets/zeus.png"),
  },
  {
    id: "a8",
    nome: "Lola",
    raca: "Persa",
    age: "1 ano",
    cidade: "Rio de Janeiro",
    uf: "RJ",
    porte: "pequeno",
    sexo: "fêmea",
    tags: ["calma", "carinhosa", "vacinado", "castrado"],
    image: require("../assets/pets/lola.png"),
  },
];

const PORTES = ["Porte", "pequeno", "médio", "grande"];
const SEXOS = ["Sexo", "macho", "fêmea"];

// ── Componente principal ──────────────────────────────────────────────────────

export default function AdocaoScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [porteFilter, setPorteFilter] = useState("Porte");
  const [sexoFilter, setSexoFilter] = useState("Sexo");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showPorteDropdown, setShowPorteDropdown] = useState(false);
  const [showSexoDropdown, setShowSexoDropdown] = useState(false);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  };

  const filtered = PETS.filter((pet) => {
    const matchSearch =
      pet.nome.toLowerCase().includes(search.toLowerCase()) ||
      pet.raca.toLowerCase().includes(search.toLowerCase());
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

        {/* ── Contagem ── */}
        <Text style={[styles.count, { color: theme.textSecondary }]}>
          {filtered.length}{" "}
          {filtered.length === 1 ? "pet disponível" : "pets disponíveis"}
        </Text>

        {/* ── Cards ── */}
        {filtered.map((pet) => (
          <View
            key={pet.id}
            style={[
              styles.card,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            {/* Foto */}
            <View style={styles.imageWrap}>
              {pet.image ? (
                <Image
                  source={pet.image}
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
                  <Ionicons name="paw" size={48} color={theme.textSecondary} />
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
                  name={favorites.includes(pet.id) ? "heart" : "heart-outline"}
                  size={20}
                  color={favorites.includes(pet.id) ? "#EF4444" : "#555"}
                />
              </TouchableOpacity>
            </View>

            {/* Infos */}
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
                    {pet.age}
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
                  style={[styles.locationText, { color: theme.textSecondary }]}
                >
                  {pet.cidade}, {pet.uf}
                </Text>
              </View>

              {/* Tags */}
              <View style={styles.tagsRow}>
                {pet.tags.map((tag) => (
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

              {/* Botão */}
              <TouchableOpacity
                style={[styles.adoptBtn, { backgroundColor: theme.primary }]}
                activeOpacity={0.8}
                onPress={() => {
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
        ))}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Ionicons
              name="paw-outline"
              size={60}
              color={theme.textSecondary}
            />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Nenhum pet encontrado
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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
