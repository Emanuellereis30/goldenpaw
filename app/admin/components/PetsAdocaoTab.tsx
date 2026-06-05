import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { adminStyles } from "../styles/adminStyles";
import { Pet, RequisicaoAdocao } from "../types/admin.types";

interface PetsAdocaoTabProps {
  pets: Pet[];
  requisicoes?: RequisicaoAdocao[];
  loading: boolean;
  onAddPet: (pet: Omit<Pet, "id">) => Promise<void>;
  onEditPet: (id: string, pet: Omit<Pet, "id">) => Promise<void>;
  onDeletePet: (id: string) => Promise<void>;
  onUpdateRequisicao?: (
    id: string,
    status: "aprovado" | "rejeitado",
    visualizado: boolean,
  ) => Promise<void>;
}

const racasPorTipo: Record<string, string[]> = {
  cachorro: [
    "Vira-lata",
    "Shih Tzu",
    "Poodle",
    "Pinscher",
    "Labrador",
    "Golden Retriever",
    "Bulldog Francês",
    "Pastor Alemão",
    "Yorkshire",
    "Rottweiler",
    "Beagle",
    "Dachshund",
    "Husky Siberiano",
    "Spitz Alemão",
    "Border Collie",
    "Chihuahua",
    "Pug",
    "Boxer",
    "Pitbull",
    "Maltês",
  ],
  gato: [
    "SRD",
    "Persa",
    "Siamês",
    "Maine Coon",
    "Angorá",
    "Bengal",
    "Sphynx",
    "Ragdoll",
    "British Shorthair",
    "Scottish Fold",
    "Exótico",
    "Azul Russo",
    "Himalaio",
  ],
  ave: [
    "Calopsita",
    "Periquito",
    "Canário",
    "Papagaio",
    "Agapornis",
    "Cacatua",
    "Mandarim",
    "Manon",
    "Ring Neck",
    "Arara",
  ],
  peixe: [
    "Betta",
    "Guppy",
    "Molinésia",
    "Platy",
    "Kinguio",
    "Acará Bandeira",
    "Tetra Neon",
    "Oscar",
    "Espada",
    "Cascudo",
  ],
};

const getStatusColor = (status: string, theme: any): string => {
  switch (status) {
    case "pendente":
      return "#FFA500"; // Orange
    case "aprovado":
      return "#4CAF50"; // Green
    case "rejeitado":
      return "#F44336"; // Red
    default:
      return theme.textSecondary;
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case "pendente":
      return "Pendente";
    case "aprovado":
      return "Aprovado";
    case "rejeitado":
      return "Rejeitado";
    default:
      return status;
  }
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  } catch {
    return dateString;
  }
};

export default function PetsAdocaoTab({
  pets,
  requisicoes = [],
  loading,
  onAddPet,
  onEditPet,
  onDeletePet,
  onUpdateRequisicao,
}: PetsAdocaoTabProps) {
  const { theme } = useAppTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [showRequisicoes, setShowRequisicoes] = useState(true);
  const [selectedRequisicao, setSelectedRequisicao] =
    useState<RequisicaoAdocao | null>(null);
  const [showRequisicaoModal, setShowRequisicaoModal] = useState(false);
  const [form, setForm] = useState<{
    nome: string;
    tipo: "cachorro" | "gato" | "ave" | "peixe";
    raca: string;
    idade: number;
    porte: "pequeno" | "médio" | "grande";
    sexo: "macho" | "fêmea";
    tags: string;
    fotoUrl: string;
  }>({
    nome: "",
    tipo: "cachorro",
    raca: "",
    idade: 0,
    porte: "médio",
    sexo: "macho",
    tags: "",
    fotoUrl: "",
  });

  const filteredPets = pets.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.petId.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const pendingRequisicoes = requisicoes.filter((r) => r.status === "pendente");

  const handleSave = async () => {
    if (!form.nome || !form.raca) {
      Alert.alert("Erro", "Preencha o nome do pet e a raça");
      return;
    }

    try {
      const petData = {
        petId:
          editingPet?.petId ||
          "PET-" + Math.random().toString(36).substr(2, 5).toUpperCase(),
        nome: form.nome,
        tipo: form.tipo,
        raca: form.raca,
        idade: form.idade,
        porte: form.porte,
        sexo: form.sexo,
        tags: form.tags,
        fotoUrl: form.fotoUrl,
      };

      if (editingPet) {
        await onEditPet(editingPet.id, petData);
        Alert.alert("Sucesso", "Pet atualizado!");
      } else {
        await onAddPet(petData);
        Alert.alert("Sucesso", "Pet adicionado!");
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      Alert.alert("Erro", "Falha ao salvar pet");
    }
  };

  const resetForm = () => {
    setForm({
      nome: "",
      tipo: "cachorro",
      raca: "",
      idade: 0,
      porte: "médio",
      sexo: "macho",
      tags: "",
      fotoUrl: "",
    });
    setEditingPet(null);
  };

  const handleEdit = (pet: Pet) => {
    setEditingPet(pet);
    setForm({
      nome: pet.nome,
      tipo: pet.tipo,
      raca: pet.raca,
      idade: pet.idade,
      porte: pet.porte,
      sexo: pet.sexo,
      tags: pet.tags,
      fotoUrl: pet.fotoUrl,
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Confirmar", "Deseja excluir este pet?", [
      { text: "Cancelar" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await onDeletePet(id);
            Alert.alert("Sucesso", "Pet removido!");
          } catch (error) {
            Alert.alert("Erro", "Falha ao excluir pet");
          }
        },
      },
    ]);
  };

  const handleRequisicaoPress = async (requisicao: RequisicaoAdocao) => {
    setSelectedRequisicao(requisicao);
    setShowRequisicaoModal(true);

    // Mark as visualizado - apenas se não foi visualizado ainda
    // Não muda o status, apenas marca como visualizado
    if (!requisicao.visualizado && onUpdateRequisicao) {
      try {
        // Manter o status atual (não mudar para aprovado/rejeitado)
        // Apenas marcar como visualizado
        const currentStatus = requisicao.status;
        if (
          currentStatus === "pendente" ||
          currentStatus === "aprovado" ||
          currentStatus === "rejeitado"
        ) {
          const statusToPass: "aprovado" | "rejeitado" =
            currentStatus === "pendente"
              ? "aprovado"
              : (currentStatus as "aprovado" | "rejeitado");
          // Na verdade, vamos apenas marcar como visualizado sem mudar status
          // Então vamos chamar com o status atual se for válido
          if (currentStatus !== "pendente") {
            await onUpdateRequisicao(
              requisicao.id,
              currentStatus as "aprovado" | "rejeitado",
              true,
            );
          }
        }
      } catch (error) {
        console.log("Erro ao marcar como visualizado:", error);
      }
    }
  };

  const handleApproveRequisicao = async () => {
    if (!selectedRequisicao || !onUpdateRequisicao) return;

    try {
      const req = selectedRequisicao as RequisicaoAdocao;
      const newStatus: "aprovado" | "rejeitado" = "aprovado";
      await onUpdateRequisicao(req.id, newStatus, true);
      Alert.alert("Sucesso", "Requisição aprovada!");
      setShowRequisicaoModal(false);
      setSelectedRequisicao(null as any);
    } catch (error) {
      Alert.alert("Erro", "Falha ao aprovar requisição");
    }
  };

  const handleRejectRequisicao = async () => {
    if (!selectedRequisicao || !onUpdateRequisicao) return;

    try {
      const req = selectedRequisicao as RequisicaoAdocao;
      const newStatus: "aprovado" | "rejeitado" = "rejeitado";
      await onUpdateRequisicao(req.id, newStatus, true);
      Alert.alert("Sucesso", "Requisição rejeitada!");
      setShowRequisicaoModal(false);
      setSelectedRequisicao(null as any);
    } catch (error) {
      Alert.alert("Erro", "Falha ao rejeitar requisição");
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permissão necessária",
        "Precisamos de acesso à galeria para selecionar a foto.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      setForm((prev) => ({ ...prev, fotoUrl: result.assets[0].uri }));
    }
  };

  if (loading) {
    return (
      <View
        style={[
          adminStyles.centerContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <>
      <View
        style={[
          adminStyles.contentContainer,
          { backgroundColor: theme.background },
        ]}
      >
        {/* Adoption Requests Section */}
        {requisicoes.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: theme.surface,
                borderRadius: 8,
                borderColor: theme.border,
                borderWidth: 1,
                marginHorizontal: 16,
              }}
              onPress={() => setShowRequisicoes(!showRequisicoes)}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Ionicons
                  name="document-text"
                  size={20}
                  color={theme.primary}
                />
                <Text
                  style={[
                    adminStyles.sectionTitle,
                    { color: theme.text, marginBottom: 0 },
                  ]}
                >
                  Requisições de Adoção
                </Text>
                {pendingRequisicoes.length > 0 && (
                  <View
                    style={{
                      backgroundColor: "#FFA500",
                      borderRadius: 12,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFF",
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    >
                      {pendingRequisicoes.length}
                    </Text>
                  </View>
                )}
              </View>
              <Ionicons
                name={showRequisicoes ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>

            {showRequisicoes && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 12 }}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              >
                {requisicoes.map((requisicao) => (
                  <TouchableOpacity
                    key={requisicao.id}
                    style={{
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      borderWidth: 1,
                      borderRadius: 8,
                      padding: 12,
                      minWidth: 280,
                      position: "relative",
                    }}
                    onPress={() => handleRequisicaoPress(requisicao)}
                  >
                    {!requisicao.visualizado && (
                      <View
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: theme.primary,
                        }}
                      />
                    )}

                    <View style={{ marginBottom: 8 }}>
                      <Text
                        style={[adminStyles.itemName, { color: theme.text }]}
                      >
                        {requisicao.nomeCompleto}
                      </Text>
                      <Text
                        style={[
                          adminStyles.itemDetail,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Solicitou: {requisicao.petNome}
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={[
                          adminStyles.itemDetail,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {formatDate(requisicao.criadoEm)}
                      </Text>
                      <View
                        style={{
                          backgroundColor:
                            getStatusColor(requisicao.status, theme) + "20",
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 4,
                        }}
                      >
                        <Text
                          style={{
                            color: getStatusColor(requisicao.status, theme),
                            fontSize: 12,
                            fontWeight: "600",
                          }}
                        >
                          {getStatusLabel(requisicao.status)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Search Bar */}
        <View
          style={[
            adminStyles.searchBar,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[adminStyles.searchInput, { color: theme.text }]}
            placeholder="Pesquisar pet..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity
          style={[adminStyles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <Ionicons name="add" size={24} color="#000" />
          <Text style={adminStyles.addButtonText}>Novo Pet</Text>
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false}>
          {filteredPets.length > 0 ? (
            filteredPets.map((pet) => (
              <View
                key={pet.id}
                style={[
                  adminStyles.itemCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                {pet.fotoUrl && (
                  <Image
                    source={{ uri: pet.fotoUrl }}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 8,
                      marginRight: 12,
                    }}
                    resizeMode="cover"
                  />
                )}
                <View style={[adminStyles.itemInfo, { flex: 1 }]}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text style={[adminStyles.itemName, { color: theme.text }]}>
                      {pet.nome}
                    </Text>
                    <View
                      style={[
                        adminStyles.idBadge,
                        { backgroundColor: theme.primary + "40" },
                      ]}
                    >
                      <Text
                        style={[
                          adminStyles.idBadgeText,
                          { color: theme.primary },
                        ]}
                      >
                        {pet.petId}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {pet.tipo.charAt(0).toUpperCase() + pet.tipo.slice(1)} •{" "}
                    {pet.raca}
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {pet.porte} • {pet.sexo} • {pet.idade} anos
                  </Text>
                </View>
                <View style={adminStyles.itemActions}>
                  <TouchableOpacity
                    style={[
                      adminStyles.actionButton,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={() => handleEdit(pet)}
                  >
                    <Ionicons name="pencil" size={18} color="#000" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      adminStyles.actionButton,
                      { backgroundColor: theme.error },
                    ]}
                    onPress={() => handleDelete(pet.id)}
                  >
                    <Ionicons name="trash" size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text
              style={[adminStyles.emptyText, { color: theme.textSecondary }]}
            >
              Nenhum pet encontrado
            </Text>
          )}
        </ScrollView>
      </View>

      {/* Modal de Pet */}
      <Modal visible={showModal} animationType="slide" transparent>
        <SafeAreaView
          style={[adminStyles.modal, { backgroundColor: theme.background }]}
        >
          <View
            style={[
              adminStyles.modalHeader,
              { borderBottomColor: theme.border },
            ]}
          >
            <Text style={[adminStyles.modalTitle, { color: theme.text }]}>
              {editingPet ? "Editar Pet" : "Novo Pet"}
            </Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={adminStyles.modalContent}>
            <View style={adminStyles.modalForm}>
              <Text
                style={[adminStyles.sectionTitle, { color: theme.primary }]}
              >
                Dados do Pet
              </Text>

              <Text style={[adminStyles.label, { color: theme.text }]}>
                Nome do Pet *
              </Text>
              <TextInput
                style={[
                  adminStyles.input,
                  {
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Nome do pet"
                placeholderTextColor={theme.textSecondary}
                value={form.nome}
                onChangeText={(text) => setForm({ ...form, nome: text })}
              />

              <Text style={[adminStyles.label, { color: theme.text }]}>
                Tipo *
              </Text>
              <View style={adminStyles.typeSelector}>
                {["cachorro", "gato", "ave", "peixe"].map((tipo) => (
                  <TouchableOpacity
                    key={tipo}
                    style={[
                      adminStyles.typeButton,
                      {
                        backgroundColor:
                          form.tipo === tipo ? theme.primary : theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() =>
                      setForm({ ...form, tipo: tipo as any, raca: "" })
                    }
                  >
                    <Text
                      style={[
                        adminStyles.typeButtonText,
                        { color: form.tipo === tipo ? "#000" : theme.text },
                      ]}
                    >
                      {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[adminStyles.label, { color: theme.text }]}>
                Raça *
              </Text>
              <View style={adminStyles.breedSelector}>
                {(racasPorTipo[form.tipo] || []).map((raca) => (
                  <TouchableOpacity
                    key={raca}
                    style={[
                      adminStyles.breedButton,
                      {
                        backgroundColor:
                          form.raca === raca ? theme.primary : theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => setForm({ ...form, raca })}
                  >
                    <Text
                      style={[
                        adminStyles.breedButtonText,
                        { color: form.raca === raca ? "#000" : theme.text },
                      ]}
                    >
                      {raca}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[adminStyles.label, { color: theme.text }]}>
                Porte *
              </Text>
              <View style={adminStyles.typeSelector}>
                {["pequeno", "médio", "grande"].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      adminStyles.typeButton,
                      {
                        backgroundColor:
                          form.porte === p ? theme.primary : theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => setForm({ ...form, porte: p as any })}
                  >
                    <Text
                      style={[
                        adminStyles.typeButtonText,
                        { color: form.porte === p ? "#000" : theme.text },
                      ]}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[adminStyles.label, { color: theme.text }]}>
                Sexo *
              </Text>
              <View style={adminStyles.typeSelector}>
                {["macho", "fêmea"].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      adminStyles.typeButton,
                      {
                        backgroundColor:
                          form.sexo === s ? theme.primary : theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => setForm({ ...form, sexo: s as any })}
                  >
                    <Text
                      style={[
                        adminStyles.typeButtonText,
                        { color: form.sexo === s ? "#000" : theme.text },
                      ]}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[adminStyles.label, { color: theme.text }]}>
                Idade
              </Text>
              <View
                style={[
                  adminStyles.ageSelector,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <TouchableOpacity
                  style={[
                    adminStyles.ageButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={() =>
                    setForm({ ...form, idade: Math.max(0, form.idade - 1) })
                  }
                >
                  <Ionicons name="remove" size={20} color="#000" />
                </TouchableOpacity>
                <Text style={[adminStyles.ageText, { color: theme.text }]}>
                  {form.idade}
                </Text>
                <TouchableOpacity
                  style={[
                    adminStyles.ageButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={() => setForm({ ...form, idade: form.idade + 1 })}
                >
                  <Ionicons name="add" size={20} color="#000" />
                </TouchableOpacity>
              </View>

              <Text style={[adminStyles.label, { color: theme.text }]}>
                Tags
              </Text>
              <TextInput
                style={[
                  adminStyles.input,
                  {
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Ex: vacinado, castrado, calmo"
                placeholderTextColor={theme.textSecondary}
                value={form.tags}
                onChangeText={(text) => setForm({ ...form, tags: text })}
              />

              <Text style={[adminStyles.label, { color: theme.text }]}>
                Foto do Pet
              </Text>
              <TouchableOpacity
                style={[
                  adminStyles.imagePickerButton,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={pickImage}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="image-outline"
                  size={20}
                  color={theme.primary}
                />
                <Text
                  style={[
                    adminStyles.imagePickerText,
                    { color: theme.primary },
                  ]}
                >
                  {form.fotoUrl
                    ? "Trocar foto"
                    : "Selecionar foto do dispositivo"}
                </Text>
              </TouchableOpacity>

              {form.fotoUrl && (
                <View style={adminStyles.imagePreviewContainer}>
                  <Image
                    source={{ uri: form.fotoUrl }}
                    style={adminStyles.imagePreview}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={[
                      adminStyles.removeImageButton,
                      { backgroundColor: theme.error },
                    ]}
                    onPress={() =>
                      setForm((prev) => ({ ...prev, fotoUrl: "" }))
                    }
                  >
                    <Ionicons name="close" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={[
                  adminStyles.submitButton,
                  { backgroundColor: theme.primary },
                ]}
                onPress={handleSave}
              >
                <Text style={adminStyles.submitButtonText}>
                  {editingPet ? "Atualizar" : "Salvar"} Pet
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Modal de Requisição de Adoção */}
      <Modal visible={showRequisicaoModal} animationType="slide" transparent>
        <SafeAreaView
          style={[adminStyles.modal, { backgroundColor: theme.background }]}
        >
          <View
            style={[
              adminStyles.modalHeader,
              { borderBottomColor: theme.border },
            ]}
          >
            <Text style={[adminStyles.modalTitle, { color: theme.text }]}>
              Requisição de Adoção
            </Text>
            <TouchableOpacity onPress={() => setShowRequisicaoModal(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={adminStyles.modalContent}>
            {selectedRequisicao && (
              <View style={adminStyles.modalForm}>
                {/* Status Badge */}
                <View
                  style={{
                    backgroundColor:
                      getStatusColor(selectedRequisicao.status, theme) + "20",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 6,
                    marginBottom: 16,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text
                    style={{
                      color: getStatusColor(selectedRequisicao.status, theme),
                      fontWeight: "600",
                    }}
                  >
                    {getStatusLabel(selectedRequisicao.status)}
                  </Text>
                </View>

                {/* Seção: Dados do Pet */}
                <Text
                  style={[adminStyles.sectionTitle, { color: theme.primary }]}
                >
                  Dados do Pet Solicitado
                </Text>
                <View style={{ marginBottom: 16 }}>
                  <Text style={[adminStyles.label, { color: theme.text }]}>
                    Nome do Pet
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {selectedRequisicao.petNome}
                  </Text>
                </View>
                <View style={{ marginBottom: 16 }}>
                  <Text style={[adminStyles.label, { color: theme.text }]}>
                    Raça
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {selectedRequisicao.petRaca}
                  </Text>
                </View>
                <View style={{ marginBottom: 16 }}>
                  <Text style={[adminStyles.label, { color: theme.text }]}>
                    Porte
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {selectedRequisicao.petPorte}
                  </Text>
                </View>
                <View style={{ marginBottom: 16 }}>
                  <Text style={[adminStyles.label, { color: theme.text }]}>
                    Sexo
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {selectedRequisicao.petSexo}
                  </Text>
                </View>

                {/* Seção: Dados do Adotante */}
                <Text
                  style={[
                    adminStyles.sectionTitle,
                    { color: theme.primary, marginTop: 16 },
                  ]}
                >
                  Dados do Adotante
                </Text>
                <View style={{ marginBottom: 16 }}>
                  <Text style={[adminStyles.label, { color: theme.text }]}>
                    Nome Completo
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {selectedRequisicao.nomeCompleto}
                  </Text>
                </View>
                <View style={{ marginBottom: 16 }}>
                  <Text style={[adminStyles.label, { color: theme.text }]}>
                    Data de Nascimento
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {formatDate(selectedRequisicao.dataNascimento)}
                  </Text>
                </View>
                <View style={{ marginBottom: 16 }}>
                  <Text style={[adminStyles.label, { color: theme.text }]}>
                    CPF
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {selectedRequisicao.cpf}
                  </Text>
                </View>
                <View style={{ marginBottom: 16 }}>
                  <Text style={[adminStyles.label, { color: theme.text }]}>
                    Celular
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {selectedRequisicao.celular}
                  </Text>
                </View>
                <View style={{ marginBottom: 16 }}>
                  <Text style={[adminStyles.label, { color: theme.text }]}>
                    Email
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {selectedRequisicao.email}
                  </Text>
                </View>

                {/* Seção: Endereço */}
                <Text
                  style={[
                    adminStyles.sectionTitle,
                    { color: theme.primary, marginTop: 16 },
                  ]}
                >
                  Endereço
                </Text>
                <View style={{ marginBottom: 16 }}>
                  <Text style={[adminStyles.label, { color: theme.text }]}>
                    Endereço
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {selectedRequisicao.endereco}
                  </Text>
                </View>
                <View style={{ marginBottom: 16 }}>
                  <Text style={[adminStyles.label, { color: theme.text }]}>
                    CEP
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {selectedRequisicao.cep}
                  </Text>
                </View>

                {/* Seção: Informações sobre Residência */}
                <Text
                  style={[
                    adminStyles.sectionTitle,
                    { color: theme.primary, marginTop: 16 },
                  ]}
                >
                  Informações sobre Residência
                </Text>
                <View style={{ marginBottom: 16 }}>
                  <Text style={[adminStyles.label, { color: theme.text }]}>
                    Tipo de Residência
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {selectedRequisicao.tipoResidencia}
                  </Text>
                </View>
                <View style={{ marginBottom: 16 }}>
                  <Text style={[adminStyles.label, { color: theme.text }]}>
                    Situação do Imóvel
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {selectedRequisicao.situacaoImovel}
                  </Text>
                </View>
                <View style={{ marginBottom: 16 }}>
                  <Text style={[adminStyles.label, { color: theme.text }]}>
                    Permite Animais
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {selectedRequisicao.permiteAnimais || "Não informado"}
                  </Text>
                </View>
                <View style={{ marginBottom: 16 }}>
                  <Text style={[adminStyles.label, { color: theme.text }]}>
                    Pessoas na Casa
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {selectedRequisicao.pessoasNaCasa}
                  </Text>
                </View>

                {/* Seção: Informações sobre Dependentes */}
                <Text
                  style={[
                    adminStyles.sectionTitle,
                    { color: theme.primary, marginTop: 16 },
                  ]}
                >
                  Informações sobre Dependentes
                </Text>
                <View style={{ marginBottom: 16 }}>
                  <Text style={[adminStyles.label, { color: theme.text }]}>
                    Tem Crianças
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {selectedRequisicao.temCriancas}
                  </Text>
                </View>
                <View style={{ marginBottom: 16 }}>
                  <Text style={[adminStyles.label, { color: theme.text }]}>
                    Tem Idosos
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {selectedRequisicao.temIdosos}
                  </Text>
                </View>
                <View style={{ marginBottom: 16 }}>
                  <Text style={[adminStyles.label, { color: theme.text }]}>
                    Tem Alergias
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {selectedRequisicao.temAlergias}
                  </Text>
                </View>

                {/* Seção: Experiência com Animais */}
                <Text
                  style={[
                    adminStyles.sectionTitle,
                    { color: theme.primary, marginTop: 16 },
                  ]}
                >
                  Experiência com Animais
                </Text>
                <View style={{ marginBottom: 16 }}>
                  <Text style={[adminStyles.label, { color: theme.text }]}>
                    Tem Animais Atualmente
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {selectedRequisicao.temAnimaisAtuais}
                  </Text>
                </View>
                <View style={{ marginBottom: 16 }}>
                  <Text style={[adminStyles.label, { color: theme.text }]}>
                    Teve Animais Anteriormente
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {selectedRequisicao.temAnimaisAnteriores}
                  </Text>
                </View>

                {/* Seção: Consciência Financeira e Compromisso */}
                <Text
                  style={[
                    adminStyles.sectionTitle,
                    { color: theme.primary, marginTop: 16 },
                  ]}
                >
                  Consciência Financeira e Compromisso
                </Text>
                <View style={{ marginBottom: 16 }}>
                  <Text style={[adminStyles.label, { color: theme.text }]}>
                    Consciência Financeira
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {selectedRequisicao.conscienciaFinanceira}
                  </Text>
                </View>
                <View style={{ marginBottom: 16 }}>
                  <Text style={[adminStyles.label, { color: theme.text }]}>
                    Mudanças na Rotina
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {selectedRequisicao.mudancasRotina}
                  </Text>
                </View>
                <View style={{ marginBottom: 16 }}>
                  <Text style={[adminStyles.label, { color: theme.text }]}>
                    Concorda com Acompanhamento
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {selectedRequisicao.concordaAcompanhamento}
                  </Text>
                </View>

                {/* Observações */}
                {selectedRequisicao.observacoes && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={[adminStyles.label, { color: theme.text }]}>
                      Observações
                    </Text>
                    <Text
                      style={[
                        adminStyles.itemDetail,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {selectedRequisicao.observacoes}
                    </Text>
                  </View>
                )}

                {/* Data de Criação */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={[adminStyles.label, { color: theme.text }]}>
                    Data de Submissão
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {formatDate(selectedRequisicao.criadoEm)}
                  </Text>
                </View>

                {/* Action Buttons */}
                {selectedRequisicao.status === "pendente" && (
                  <View
                    style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}
                  >
                    <TouchableOpacity
                      style={[
                        adminStyles.submitButton,
                        { backgroundColor: "#4CAF50", flex: 1 },
                      ]}
                      onPress={handleApproveRequisicao}
                    >
                      <Text style={adminStyles.submitButtonText}>Aprovar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        adminStyles.submitButton,
                        { backgroundColor: "#F44336", flex: 1 },
                      ]}
                      onPress={handleRejectRequisicao}
                    >
                      <Text style={adminStyles.submitButtonText}>Rejeitar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}
