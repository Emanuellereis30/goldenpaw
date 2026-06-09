import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import React, { useState } from "react";
import {
    Dimensions,
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ── Dados Locais ──────────────────────────────────────────────────────────────
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

export default function ClinicaScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [addressQuery, setAddressQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState("");

  const GOOGLE_MAPS_API_KEY =
    Constants?.expoConfig?.extra?.googleMapsApiKey ?? "";
  const useGoogleMaps = Boolean(GOOGLE_MAPS_API_KEY);

  const getStaticMapUrl = (lat: string, lon: string) => {
    const width = Math.min(640, Math.floor(SCREEN_WIDTH - 40));
    const height = 260;

    if (useGoogleMaps) {
      const marker = `color:red|label:P|${lat},${lon}`;
      return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=13&size=${width}x${height}&scale=2&markers=${marker}&key=${GOOGLE_MAPS_API_KEY}`;
    }

    // Fallback para OpenStreetMap se não houver chave do Google
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=13&size=${width}x${height}&markers=${lat},${lon},red-pushpin`;
  };

  const [mapUrl, setMapUrl] = useState<string>(
    getStaticMapUrl("-23.55052", "-46.633308"), // Centro padrão inicial
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

    // Filtro simples em memória para as clínicas
    const results = VETERINARY_CLINICS.filter(
      (clinic) =>
        clinic.name.toLowerCase().includes(query) ||
        clinic.address.toLowerCase().includes(query),
    );

    setSearchResults(results.length ? results : VETERINARY_CLINICS);
    setMapLoading(false);
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
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Clínicas Veterinárias
        </Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          Busque o atendimento mais próximo e veja clínicas disponíveis na sua
          região.
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
          placeholder="Digite o endereço ou bairro"
          placeholderTextColor={theme.textSecondary}
          value={addressQuery}
          onChangeText={setAddressQuery}
        />

        <TouchableOpacity
          style={[styles.searchButton, { backgroundColor: theme.primary }]}
          onPress={handleSearchClinics}
        >
          <Ionicons
            name="search"
            size={20}
            color="#FFF"
            style={{ marginRight: 8 }}
          />
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
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
          >
            {mapLoading ? (
              <Text
                style={[
                  styles.mapPlaceholderText,
                  { color: theme.textSecondary },
                ]}
              >
                A carregar mapa...
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
              {mapError}
            </Text>
          ) : null}
        </View>

        <View style={styles.vetList}>
          {searchResults.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="location-outline"
                size={48}
                color={theme.textSecondary}
              />
              <Text
                style={[styles.emptyStateTitle, { color: theme.textSecondary }]}
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
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={styles.vetInfo}>
                  <Text style={[styles.vetName, { color: theme.text }]}>
                    {clinic.name}
                  </Text>
                  <Text
                    style={[styles.vetMeta, { color: theme.textSecondary }]}
                  >
                    {clinic.address}
                  </Text>
                </View>
                <View
                  style={[
                    styles.distanceBadge,
                    { backgroundColor: theme.background },
                  ]}
                >
                  <Text style={[styles.distanceText, { color: theme.primary }]}>
                    {clinic.distance}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  searchInput: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 15,
  },
  searchButton: {
    flexDirection: "row",
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  searchButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  mapContainer: {
    borderRadius: 22,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  mapPlaceholder: {
    height: 200,
    borderRadius: 18,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  mapImage: {
    width: "100%",
    height: "100%",
  },
  mapPlaceholderText: {
    fontSize: 14,
    textAlign: "center",
  },
  mapErrorText: {
    marginTop: 10,
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
  },
  vetList: {
    marginTop: 8,
  },
  vetCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  vetInfo: {
    flex: 1,
    paddingRight: 12,
  },
  vetName: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  vetMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  distanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 12,
  },
});
