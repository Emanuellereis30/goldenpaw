import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
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
  {
    id: "v4",
    name: "PetCare Clínica Veterinária",
    address: "Rua dos Animais, 45 - Vila Saúde",
    distance: "4,0 km",
  },
  {
    id: "v5",
    name: "VittaPet Clínica e Hospital",
    address: "Av. das Palmeiras, 560 - Jardim América",
    distance: "4,5 km",
  },
  {
    id: "v6",
    name: "Amigo Animal",
    address: "R. das Acácias, 98 - Centro",
    distance: "5,1 km",
  },
  {
    id: "v7",
    name: "Clínica Veterinária Boa Vida",
    address: "Av. Independência, 210 - Bairro Alegre",
    distance: "5,7 km",
  },
];

export default function ClinicaScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [addressQuery, setAddressQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSearchClinics = () => {
    const query = addressQuery.trim().toLowerCase();

    const results = VETERINARY_CLINICS.filter(
      (clinic) =>
        clinic.name.toLowerCase().includes(query) ||
        clinic.address.toLowerCase().includes(query),
    );

    setSearchResults(results.length ? results : VETERINARY_CLINICS);
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
          Busque clínicas manualmente pelo nome ou endereço do estabelecimento.
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
          placeholder="Digite o nome ou endereço da clínica"
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
                Digite o nome ou endereço de uma clínica para pesquisar.
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
                  <Text style={[styles.vetMeta, { color: theme.textSecondary }]}> 
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
