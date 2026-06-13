// app/admin/components/PetsAdocaoTab.tsx
import { useNotification } from "@/contexts/NotificationContext";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../../firebaseConfig";
import { adminStyles } from "../styles/adminStyles";

// ── Constantes dos Filtros ───────────────────────────────────────────────────
const PORTES = ["Porte", "pequeno", "médio", "grande"];
const SEXOS = ["Sexo", "macho", "fêmea"];

const REQ_STATUS_FILTRO = ["Todos", "pendente", "aprovado", "rejeitado"];
const REQ_ORDENACOES = [
  { label: "Mais Recentes", value: "data_desc" },
  { label: "Mais Antigos", value: "data_asc" },
];

// ── Funções Auxiliares ────────────────────────────────────────────────────────
const uriToBlob = async (uri: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function (e) {
      console.log(e);
      reject(new TypeError("Falha na requisição de rede"));
    };
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });
};

const formatBoolean = (val: boolean | null | undefined) => {
  if (val === true) return "Sim";
  if (val === false) return "Não";
  return "Não informado";
};

// ── Componente Principal ──────────────────────────────────────────────────────
export default function PetsAdocaoTab({
  initialView = "pets",
}: {
  initialView?: "pets" | "requisicoes";
}) {
  const { theme } = useAppTheme();
  const { showNotification } = useNotification();
  const storage = getStorage();

  const [pets, setPets] = useState<any[]>([]);
  const [requisicoes, setRequisicoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSave, setLoadingSave] = useState(false);

  const [currentView, setCurrentView] = useState<"pets" | "requisicoes">(
    initialView,
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Filtros - Pets
  const [porteFilter, setPorteFilter] = useState("Porte");
  const [sexoFilter, setSexoFilter] = useState("Sexo");
  const [showPorteDropdown, setShowPorteDropdown] = useState(false);
  const [showSexoDropdown, setShowSexoDropdown] = useState(false);

  // Filtros - Requisições
  const [reqStatusFilter, setReqStatusFilter] = useState("Todos");
  const [reqOrdenacao, setReqOrdenacao] = useState("data_desc");
  const [showReqStatusDropdown, setShowReqStatusDropdown] = useState(false);
  const [showReqOrdenacaoDropdown, setShowReqOrdenacaoDropdown] =
    useState(false);

  // Modais - Pets
  const [showPetModal, setShowPetModal] = useState(false);
  const [editingPet, setEditingPet] = useState<any | null>(null);
  const [imagePicked, setImagePicked] = useState(false);

  // Estado para exclusão de pet
  const [petToDelete, setPetToDelete] = useState<string | null>(null);

  const [form, setForm] = useState<any>({
    nome: "",
    raca: "SRD",
    idadeNum: 1,
    idadeUnidade: "anos",
    sexo: "macho",
    image: "",
    descricao: "",
    porte: "médio",
    tags: "",
  });

  // Modais - Requisições
  const [showReqModal, setShowReqModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState<any | null>(null);

  const racasSugeridas = ["SRD", "Poodle", "Pinscher", "Persa", "Siamês"];

  const shouldUploadImage = (uri: string) => {
    if (!uri) return false;
    return !/^(https?:\/\/|data:|gs:\/\/)/i.test(uri);
  };

  useEffect(() => {
    const unsubPets = onSnapshot(collection(db, "pets"), (snapshot) => {
      setPets(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubRequisicoes = onSnapshot(
      collection(db, "requisicoes_adocao"),
      (snapshot) => {
        setRequisicoes(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
    );

    return () => {
      unsubPets();
      unsubRequisicoes();
    };
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showNotification(
        "Atenção",
        "Precisamos de acesso à galeria para a foto do pet.",
        "info",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) {
      setForm((prev: any) => ({ ...prev, image: result.assets[0].uri }));
      setImagePicked(true);
    }
  };

  const uploadImageAsync = async (uri: string): Promise<string> => {
    const blob = await uriToBlob(uri);
    const filename = `pets/${Date.now()}-${form.nome.replace(/\s+/g, "").toLowerCase()}.jpg`;
    const storageRef = ref(storage, filename);
    const uploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        null,
        (error) => {
          console.error("Erro no upload:", error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        },
      );
    });
  };

  const handleSavePet = async () => {
    if (!form.nome || !form.raca || !form.image) {
      showNotification(
        "Atenção",
        "Preencha todos os campos obrigatórios e adicione uma foto.",
        "error",
      );
      return;
    }
    setLoadingSave(true);
    try {
      let finalImageUrl = form.image;
      if (imagePicked && shouldUploadImage(form.image)) {
        finalImageUrl = await uploadImageAsync(form.image);
      }
      const idadeFormatada = `${form.idadeNum} ${form.idadeUnidade === "anos" && form.idadeNum === 1 ? "ano" : form.idadeUnidade}`;
      const petData = {
        nome: form.nome,
        raca: form.raca,
        idade: idadeFormatada,
        sexo: form.sexo,
        image: finalImageUrl,
        descricao: form.descricao,
        porte: form.porte,
        tags: form.tags,
      };

      if (editingPet) {
        await updateDoc(doc(db, "pets", editingPet.id), petData);
        showNotification("Sucesso", "Pet atualizado!", "success");
      } else {
        await addDoc(collection(db, "pets"), petData);
        showNotification("Sucesso", "Pet cadastrado!", "success");
      }
      setShowPetModal(false);
      setEditingPet(null);
      setImagePicked(false);
      setForm({
        nome: "",
        raca: "SRD",
        idadeNum: 1,
        idadeUnidade: "anos",
        sexo: "macho",
        image: "",
        descricao: "",
        porte: "médio",
        tags: "",
      });
    } catch (error) {
      showNotification(
        "Erro",
        "Falha ao salvar o pet. Verifique a sua ligação.",
        "error",
      );
    } finally {
      setLoadingSave(false);
    }
  };

  const handleEditOpen = (pet: any) => {
    setEditingPet(pet);
    const isMeses = pet.idade && pet.idade.includes("mes");
    const parsedNum = parseInt(pet.idade) || 1;

    setForm({
      nome: pet.nome,
      raca: pet.raca || "SRD",
      idadeNum: parsedNum,
      idadeUnidade: isMeses ? "meses" : "anos",
      sexo: pet.sexo || "macho",
      image: pet.image || "",
      descricao: pet.descricao || "",
      porte: pet.porte || "médio",
      tags: pet.tags || "",
    });
    setImagePicked(false);
    setShowPetModal(true);
  };

  const confirmDeletePet = async () => {
    if (!petToDelete) return;
    try {
      await deleteDoc(doc(db, "pets", petToDelete));
      showNotification("Sucesso", "Pet removido da lista!", "success");
    } catch (error) {
      showNotification("Erro", "Falha ao excluir o pet.", "error");
    } finally {
      setPetToDelete(null);
    }
  };

  const handleUpdateRequisicao = async (status: "aprovado" | "rejeitado") => {
    if (!selectedReq) return;
    try {
      await updateDoc(doc(db, "requisicoes_adocao", selectedReq.id), {
        status,
        visualizado: true,
      });
      showNotification(
        "Sucesso",
        `Requisição ${status} com sucesso!`,
        "success",
      );
      setShowReqModal(false);
    } catch (error) {
      showNotification("Erro", "Falha ao atualizar o status.", "error");
    }
  };

  // ── Filtragem de Pets ──
  const filteredPets = pets.filter((p) => {
    const matchSearch = (p.nome || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchPorte = porteFilter === "Porte" || p.porte === porteFilter;
    const matchSexo = sexoFilter === "Sexo" || p.sexo === sexoFilter;
    return matchSearch && matchPorte && matchSexo;
  });

  // ── Filtragem e Ordenação de Requisições ──
  let filteredReqs = requisicoes.filter((r) => {
    const matchSearch =
      (r.nomeCompleto || r.usuarioNome || r.clienteNome || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (r.petNome || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus =
      reqStatusFilter === "Todos" ||
      (r.status || "pendente") === reqStatusFilter;
    return matchSearch && matchStatus;
  });

  filteredReqs.sort((a, b) => {
    const dateA = a.criadoEm ? new Date(a.criadoEm).getTime() : a.id;
    const dateB = b.criadoEm ? new Date(b.criadoEm).getTime() : b.id;

    if (reqOrdenacao === "data_desc") {
      return a.criadoEm
        ? (dateB as number) - (dateA as number)
        : b.id.localeCompare(a.id);
    } else {
      return a.criadoEm
        ? (dateA as number) - (dateB as number)
        : a.id.localeCompare(b.id);
    }
  });

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
        {/* Toggle / Sub-abas */}
        <View
          style={{
            flexDirection: "row",
            marginBottom: 16,
            backgroundColor: theme.surface,
            borderRadius: 12,
            padding: 4,
            borderWidth: 1,
            borderColor: theme.border,
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 10,
              alignItems: "center",
              borderRadius: 8,
              backgroundColor:
                currentView === "pets" ? theme.primary : "transparent",
            }}
            onPress={() => setCurrentView("pets")}
          >
            <Text
              style={{
                fontWeight: "700",
                color: currentView === "pets" ? "#000" : theme.textSecondary,
              }}
            >
              Pets Cadastrados
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 10,
              alignItems: "center",
              borderRadius: 8,
              backgroundColor:
                currentView === "requisicoes" ? theme.primary : "transparent",
            }}
            onPress={() => setCurrentView("requisicoes")}
          >
            <Text
              style={{
                fontWeight: "700",
                color:
                  currentView === "requisicoes" ? "#000" : theme.textSecondary,
              }}
            >
              Requisições{" "}
              {requisicoes.filter((r) => r.status === "pendente").length > 0 &&
                `(${requisicoes.filter((r) => r.status === "pendente").length})`}
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            adminStyles.searchBar,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[adminStyles.searchInput, { color: theme.text }]}
            placeholder={
              currentView === "pets"
                ? "Pesquisar pet..."
                : "Pesquisar por adotante ou pet..."
            }
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* ── VIEW: PETS ── */}
        {currentView === "pets" && (
          <>
            <View style={localStyles.filtersRow}>
              <View style={localStyles.filterWrap}>
                <TouchableOpacity
                  style={[
                    localStyles.filterBtn,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
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
                  <Text
                    style={[localStyles.filterText, { color: theme.text }]}
                    numberOfLines={1}
                  >
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
                      localStyles.dropdown,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    {PORTES.map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[
                          localStyles.dropdownItem,
                          { borderBottomColor: theme.border },
                        ]}
                        onPress={() => {
                          setPorteFilter(p);
                          setShowPorteDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            localStyles.dropdownText,
                            {
                              color:
                                porteFilter === p ? theme.primary : theme.text,
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
              <View style={localStyles.filterWrap}>
                <TouchableOpacity
                  style={[
                    localStyles.filterBtn,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => {
                    setShowSexoDropdown(!showSexoDropdown);
                    setShowPorteDropdown(false);
                  }}
                >
                  <Ionicons
                    name="male-female-outline"
                    size={16}
                    color={theme.textSecondary}
                  />
                  <Text
                    style={[localStyles.filterText, { color: theme.text }]}
                    numberOfLines={1}
                  >
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
                      localStyles.dropdown,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    {SEXOS.map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[
                          localStyles.dropdownItem,
                          { borderBottomColor: theme.border },
                        ]}
                        onPress={() => {
                          setSexoFilter(s);
                          setShowSexoDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            localStyles.dropdownText,
                            {
                              color:
                                sexoFilter === s ? theme.primary : theme.text,
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

            <TouchableOpacity
              style={[
                adminStyles.addButton,
                { backgroundColor: theme.primary },
              ]}
              onPress={() => {
                setEditingPet(null);
                setImagePicked(false);
                setForm({
                  nome: "",
                  raca: "SRD",
                  idadeNum: 1,
                  idadeUnidade: "anos",
                  sexo: "macho",
                  image: "",
                  descricao: "",
                  porte: "médio",
                  tags: "",
                });
                setShowPetModal(true);
              }}
            >
              <Ionicons name="add" size={24} color="#000" />
              <Text style={adminStyles.addButtonText}>
                Novo Pet para Adoção
              </Text>
            </TouchableOpacity>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              <Text
                style={{
                  fontSize: 13,
                  marginBottom: 12,
                  color: theme.textSecondary,
                }}
              >
                {filteredPets.length} pet(s) encontrado(s)
              </Text>
              {filteredPets.length > 0 ? (
                filteredPets.map((pet) => (
                  <View
                    key={pet.id}
                    style={[
                      adminStyles.itemCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    {pet.image && (
                      <Image
                        source={{ uri: pet.image }}
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 30,
                          marginRight: 12,
                          backgroundColor: theme.border,
                        }}
                        resizeMode="cover"
                      />
                    )}
                    <View style={[adminStyles.itemInfo, { flex: 1 }]}>
                      <View style={adminStyles.idBadge}>
                        <Text style={adminStyles.idBadgeText}>
                          ID: {(pet.id || "").substring(0, 5).toUpperCase()}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Text
                          style={[adminStyles.itemName, { color: theme.text }]}
                        >
                          {pet.nome}
                        </Text>
                        <Ionicons
                          name={pet.sexo === "macho" ? "male" : "female"}
                          size={14}
                          color={pet.sexo === "macho" ? "#3b82f6" : "#ec4899"}
                        />
                      </View>
                      <Text
                        style={[
                          adminStyles.itemDetail,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {pet.raca} • {pet.idade} • {pet.porte}
                      </Text>
                      {pet.tags ? (
                        <Text
                          style={{
                            fontSize: 11,
                            color: theme.primary,
                            fontWeight: "700",
                            marginTop: 4,
                          }}
                        >
                          {pet.tags}
                        </Text>
                      ) : null}
                    </View>
                    <View style={adminStyles.itemActions}>
                      <TouchableOpacity
                        style={[
                          adminStyles.actionButton,
                          { backgroundColor: theme.primary },
                        ]}
                        onPress={() => handleEditOpen(pet)}
                      >
                        <Ionicons name="pencil" size={18} color="#000" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          adminStyles.actionButton,
                          { backgroundColor: theme.error },
                        ]}
                        onPress={() => setPetToDelete(pet.id)}
                      >
                        <Ionicons name="trash" size={18} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <Text
                  style={[
                    adminStyles.emptyText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Nenhum pet encontrado
                </Text>
              )}
            </ScrollView>
          </>
        )}

        {/* ── VIEW: REQUISIÇÕES ── */}
        {currentView === "requisicoes" && (
          <>
            <View style={localStyles.filtersRow}>
              <View style={localStyles.filterWrap}>
                <TouchableOpacity
                  style={[
                    localStyles.filterBtn,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => {
                    setShowReqStatusDropdown(!showReqStatusDropdown);
                    setShowReqOrdenacaoDropdown(false);
                  }}
                >
                  <Ionicons
                    name="filter-outline"
                    size={16}
                    color={theme.textSecondary}
                  />
                  <Text
                    style={[localStyles.filterText, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {reqStatusFilter === "Todos"
                      ? "Status"
                      : reqStatusFilter.toUpperCase()}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
                {showReqStatusDropdown && (
                  <View
                    style={[
                      localStyles.dropdown,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    {REQ_STATUS_FILTRO.map((st) => (
                      <TouchableOpacity
                        key={st}
                        style={[
                          localStyles.dropdownItem,
                          { borderBottomColor: theme.border },
                        ]}
                        onPress={() => {
                          setReqStatusFilter(st);
                          setShowReqStatusDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            localStyles.dropdownText,
                            {
                              color:
                                reqStatusFilter === st
                                  ? theme.primary
                                  : theme.text,
                            },
                          ]}
                        >
                          {st === "Todos"
                            ? "Todos os Status"
                            : st.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={localStyles.filterWrap}>
                <TouchableOpacity
                  style={[
                    localStyles.filterBtn,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => {
                    setShowReqOrdenacaoDropdown(!showReqOrdenacaoDropdown);
                    setShowReqStatusDropdown(false);
                  }}
                >
                  <Ionicons
                    name="swap-vertical-outline"
                    size={16}
                    color={theme.textSecondary}
                  />
                  <Text
                    style={[localStyles.filterText, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {
                      REQ_ORDENACOES.find((o) => o.value === reqOrdenacao)
                        ?.label
                    }
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
                {showReqOrdenacaoDropdown && (
                  <View
                    style={[
                      localStyles.dropdown,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    {REQ_ORDENACOES.map((ord) => (
                      <TouchableOpacity
                        key={ord.value}
                        style={[
                          localStyles.dropdownItem,
                          { borderBottomColor: theme.border },
                        ]}
                        onPress={() => {
                          setReqOrdenacao(ord.value);
                          setShowReqOrdenacaoDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            localStyles.dropdownText,
                            {
                              color:
                                reqOrdenacao === ord.value
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

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              <Text
                style={{
                  fontSize: 13,
                  marginBottom: 12,
                  color: theme.textSecondary,
                }}
              >
                {filteredReqs.length} requisição(ões) encontrada(s)
              </Text>
              {filteredReqs.length > 0 ? (
                filteredReqs.map((req) => {
                  return (
                    <TouchableOpacity
                      key={req.id}
                      style={[
                        adminStyles.itemCard,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        },
                      ]}
                      onPress={() => {
                        setSelectedReq(req);
                        setShowReqModal(true);
                      }}
                    >
                      <View style={adminStyles.itemInfo}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 4,
                          }}
                        >
                          <Text
                            style={[
                              adminStyles.itemName,
                              { color: theme.text, marginBottom: 0 },
                            ]}
                          >
                            {req.nomeCompleto ||
                              req.usuarioNome ||
                              req.clienteNome ||
                              "Adotante"}
                          </Text>
                          <View
                            style={{
                              backgroundColor:
                                req.status === "aprovado"
                                  ? "#10b98120"
                                  : req.status === "rejeitado"
                                    ? "#ef444420"
                                    : "#f59e0b20",
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 4,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: "bold",
                                color:
                                  req.status === "aprovado"
                                    ? "#10b981"
                                    : req.status === "rejeitado"
                                      ? "#ef4444"
                                      : "#f59e0b",
                              }}
                            >
                              {req.status?.toUpperCase() || "PENDENTE"}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={[
                            adminStyles.itemDetail,
                            { color: theme.textSecondary },
                          ]}
                        >
                          Pet desejado:{" "}
                          <Text style={{ fontWeight: "700" }}>
                            {req.petNome}
                          </Text>
                        </Text>
                        <Text
                          style={[
                            adminStyles.itemDetail,
                            { color: theme.textSecondary },
                          ]}
                        >
                          Feito em: {req.data || "Recente"}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={theme.textSecondary}
                      />
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text
                  style={[
                    adminStyles.emptyText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Nenhuma requisição encontrada
                </Text>
              )}
            </ScrollView>
          </>
        )}
      </View>

      {/* ── MODAL: REGISTRO DE PET ── */}
      <Modal visible={showPetModal} animationType="slide" transparent>
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
            <TouchableOpacity onPress={() => setShowPetModal(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={adminStyles.modalContent}>
            <View style={adminStyles.modalForm}>
              <Text style={[adminStyles.label, { color: theme.text }]}>
                Nome *
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
                value={form.nome}
                onChangeText={(t) => setForm({ ...form, nome: t })}
                placeholder="Nome do pet"
                placeholderTextColor={theme.textSecondary}
              />

              <Text style={[adminStyles.label, { color: theme.text }]}>
                Raça *
              </Text>
              <View style={adminStyles.breedSelector}>
                {racasSugeridas.map((raca) => (
                  <TouchableOpacity
                    key={raca}
                    style={[
                      adminStyles.breedButton,
                      {
                        borderColor: theme.border,
                        backgroundColor:
                          form.raca === raca ? theme.primary : theme.surface,
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
              <TextInput
                style={[
                  adminStyles.input,
                  {
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                value={form.raca}
                onChangeText={(t) => setForm({ ...form, raca: t })}
                placeholder="Ou digite outra raça..."
                placeholderTextColor={theme.textSecondary}
              />

              <Text style={[adminStyles.label, { color: theme.text }]}>
                Idade *
              </Text>
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
                <View
                  style={[
                    adminStyles.ageSelector,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.surface,
                      flex: 1,
                      marginBottom: 0,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      adminStyles.ageButton,
                      { backgroundColor: theme.background },
                    ]}
                    onPress={() =>
                      setForm((prev: any) => ({
                        ...prev,
                        idadeNum: Math.max(1, Number(prev.idadeNum) - 1),
                      }))
                    }
                  >
                    <Text style={[adminStyles.ageText, { color: theme.text }]}>
                      -
                    </Text>
                  </TouchableOpacity>
                  <Text style={[adminStyles.ageText, { color: theme.text }]}>
                    {form.idadeNum}
                  </Text>
                  <TouchableOpacity
                    style={[
                      adminStyles.ageButton,
                      { backgroundColor: theme.background },
                    ]}
                    onPress={() =>
                      setForm((prev: any) => ({
                        ...prev,
                        idadeNum: Number(prev.idadeNum) + 1,
                      }))
                    }
                  >
                    <Text style={[adminStyles.ageText, { color: theme.text }]}>
                      +
                    </Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    adminStyles.typeSelector,
                    { flex: 1, marginBottom: 0 },
                  ]}
                >
                  {["anos", "meses"].map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[
                        adminStyles.typeButton,
                        {
                          backgroundColor:
                            form.idadeUnidade === u
                              ? theme.primary
                              : theme.surface,
                          borderColor: theme.border,
                        },
                      ]}
                      onPress={() => setForm({ ...form, idadeUnidade: u })}
                    >
                      <Text
                        style={{
                          fontWeight: "700",
                          color: form.idadeUnidade === u ? "#000" : theme.text,
                        }}
                      >
                        {u.charAt(0).toUpperCase() + u.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Text style={[adminStyles.label, { color: theme.text }]}>
                Sexo
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
                    onPress={() => setForm({ ...form, sexo: s })}
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
                Porte do Animal
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
                    onPress={() => setForm({ ...form, porte: p })}
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
                Tags / Características
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
                value={form.tags}
                onChangeText={(t) => setForm({ ...form, tags: t })}
                placeholder="Ex: Dócil, Vacinado, Castrado"
                placeholderTextColor={theme.textSecondary}
              />

              <Text style={[adminStyles.label, { color: theme.text }]}>
                Foto *
              </Text>
              <TouchableOpacity
                style={[
                  adminStyles.imagePickerButton,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={pickImage}
                disabled={loadingSave}
              >
                <Ionicons
                  name="image-outline"
                  size={20}
                  color={theme.primary}
                />
                <Text
                  style={{
                    color: theme.primary,
                    fontWeight: "600",
                    marginLeft: 8,
                  }}
                >
                  {form.image ? "Trocar foto" : "Selecionar da galeria"}
                </Text>
              </TouchableOpacity>
              {form.image ? (
                <View style={adminStyles.imagePreviewContainer}>
                  <Image
                    source={{ uri: form.image }}
                    style={adminStyles.imagePreview}
                    resizeMode="cover"
                  />
                </View>
              ) : null}

              <Text style={[adminStyles.label, { color: theme.text }]}>
                Descrição / História (Opcional)
              </Text>
              <TextInput
                style={[
                  adminStyles.input,
                  {
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border,
                    height: 80,
                  },
                ]}
                multiline
                value={form.descricao}
                onChangeText={(t) => setForm({ ...form, descricao: t })}
                placeholder="História do pet..."
                placeholderTextColor={theme.textSecondary}
              />

              <TouchableOpacity
                style={[
                  adminStyles.submitButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: loadingSave ? 0.6 : 1,
                    marginTop: 20,
                  },
                ]}
                onPress={handleSavePet}
                disabled={loadingSave}
              >
                {loadingSave ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <ActivityIndicator size="small" color="#000" />
                    <Text style={adminStyles.submitButtonText}>
                      A enviar foto...
                    </Text>
                  </View>
                ) : (
                  <Text style={adminStyles.submitButtonText}>Salvar Pet</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── MODAL: DETALHES DA REQUISIÇÃO (Design Compacto e Centralizado) ── */}
      <Modal visible={showReqModal} animationType="slide" transparent>
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
              Detalhes da Adoção
            </Text>
            <TouchableOpacity onPress={() => setShowReqModal(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={adminStyles.modalContent}
            contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {selectedReq && (
              <View
                style={{ width: "100%", maxWidth: 480, alignSelf: "center" }}
              >
                {/* INFO DO PET */}
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: theme.primary,
                      fontWeight: "800",
                      fontSize: 13,
                      marginBottom: 8,
                      textTransform: "uppercase",
                    }}
                  >
                    PET DESEJADO
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: theme.text,
                    }}
                  >
                    {selectedReq.petNome}
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                    ID do Pet: {selectedReq.petId}
                  </Text>
                </View>

                {/* ETAPA 1 */}
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Ionicons
                      name="person-circle-outline"
                      size={18}
                      color={theme.primary}
                    />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>
                      1. Dados Pessoais
                    </Text>
                  </View>
                  <DetailItem
                    theme={theme}
                    label="Nome Completo"
                    value={
                      selectedReq.nomeCompleto ||
                      selectedReq.usuarioNome ||
                      selectedReq.clienteNome
                    }
                  />
                  <View style={{ flexDirection: "row", gap: 16 }}>
                    <View style={{ flex: 1 }}>
                      <DetailItem
                        theme={theme}
                        label="CPF"
                        value={selectedReq.cpf}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <DetailItem
                        theme={theme}
                        label="Nascimento"
                        value={selectedReq.dataNascimento}
                      />
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: 16 }}>
                    <View style={{ flex: 1 }}>
                      <DetailItem
                        theme={theme}
                        label="Celular"
                        value={selectedReq.celular || selectedReq.telefone}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <DetailItem
                        theme={theme}
                        label="E-mail"
                        value={selectedReq.email}
                      />
                    </View>
                  </View>
                </View>

                {/* ETAPA 2 */}
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Ionicons
                      name="home-outline"
                      size={18}
                      color={theme.primary}
                    />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>
                      2. Informações de Moradia
                    </Text>
                  </View>
                  <DetailItem
                    theme={theme}
                    label="Endereço Completo"
                    value={
                      selectedReq.endereco
                        ? `${selectedReq.endereco}${selectedReq.bairro ? `, ${selectedReq.bairro}` : ""}${selectedReq.cidade ? ` - ${selectedReq.cidade}` : ""}`
                        : selectedReq.cidade
                    }
                  />
                  <View style={{ flexDirection: "row", gap: 16 }}>
                    <View style={{ flex: 1 }}>
                      <DetailItem
                        theme={theme}
                        label="CEP"
                        value={selectedReq.cep}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <DetailItem
                        theme={theme}
                        label="Imóvel"
                        value={selectedReq.tipoResidencia}
                      />
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: 16 }}>
                    <View style={{ flex: 1 }}>
                      <DetailItem
                        theme={theme}
                        label="Situação"
                        value={selectedReq.situacaoImovel}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      {selectedReq.situacaoImovel === "alugado" && (
                        <DetailItem
                          theme={theme}
                          label="Permite Animais?"
                          value={formatBoolean(
                            selectedReq.proprietarioPermiteAnimais,
                          )}
                        />
                      )}
                    </View>
                  </View>
                  <DetailItem
                    theme={theme}
                    label="Quintal fechado?"
                    value={formatBoolean(selectedReq.quintalFechado)}
                    inline
                  />
                  <DetailItem
                    theme={theme}
                    label="Rotas de fuga?"
                    value={formatBoolean(selectedReq.rotasFuga)}
                    inline
                  />
                  <DetailItem
                    theme={theme}
                    label="Telas de proteção?"
                    value={formatBoolean(selectedReq.telasProtecao)}
                    inline
                  />
                </View>

                {/* ETAPA 3 */}
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Ionicons
                      name="people-outline"
                      size={18}
                      color={theme.primary}
                    />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>
                      3. Dinâmica Familiar
                    </Text>
                  </View>
                  <DetailItem
                    theme={theme}
                    label="Pessoas na casa"
                    value={selectedReq.quantidadePessoas}
                    inline
                  />
                  <DetailItem
                    theme={theme}
                    label="Há crianças?"
                    value={formatBoolean(selectedReq.temCriancas)}
                    inline
                  />
                  <DetailItem
                    theme={theme}
                    label="Há idosos?"
                    value={formatBoolean(selectedReq.temIdosos)}
                    inline
                  />
                  <DetailItem
                    theme={theme}
                    label="Todos concordam?"
                    value={formatBoolean(selectedReq.todosAcordam)}
                    inline
                  />
                  <DetailItem
                    theme={theme}
                    label="Alergia a pelos?"
                    value={
                      selectedReq.temAlergias
                        ? `Sim - ${selectedReq.temAlergiasQuem}`
                        : formatBoolean(selectedReq.temAlergias)
                    }
                    inline
                  />
                  <DetailItem
                    theme={theme}
                    label="Tempo diário sozinho"
                    value={selectedReq.tempoSozinho}
                    inline
                  />
                </View>

                {/* ETAPA 4 */}
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Ionicons
                      name="paw-outline"
                      size={18}
                      color={theme.primary}
                    />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>
                      4. Histórico com Animais
                    </Text>
                  </View>
                  <DetailItem
                    theme={theme}
                    label="Possui outros animais?"
                    value={
                      selectedReq.possuiOutrosAnimais
                        ? `Sim - ${selectedReq.outrosAnimaisDescricao}`
                        : formatBoolean(selectedReq.possuiOutrosAnimais)
                    }
                  />
                  <DetailItem
                    theme={theme}
                    label="Já teve animais antes?"
                    value={
                      selectedReq.jaTeveAnimais
                        ? `Sim - ${selectedReq.jaTeveAnimaisDescricao}`
                        : formatBoolean(selectedReq.jaTeveAnimais)
                    }
                  />
                </View>

                {/* ETAPA 5 */}
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Ionicons
                      name="document-text-outline"
                      size={18}
                      color={theme.primary}
                    />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>
                      5. Termo de Responsabilidade
                    </Text>
                  </View>
                  <DetailItem
                    theme={theme}
                    label="Ciente dos custos (financeiro e saúde)?"
                    value={formatBoolean(selectedReq.cienteFinanceiro)}
                  />
                  <DetailItem
                    theme={theme}
                    label="Planos para viagens e mudanças"
                    value={selectedReq.planosViagem}
                  />
                  <DetailItem
                    theme={theme}
                    label="Concorda com acompanhamento (fotos)?"
                    value={formatBoolean(selectedReq.concordaAcompanhamento)}
                  />
                  <DetailItem
                    theme={theme}
                    label="Motivo da adoção / Observações"
                    value={
                      selectedReq.observacoes ||
                      selectedReq.motivo ||
                      selectedReq.mensagem
                    }
                  />
                </View>

                {/* BOTÕES DE APROVAÇÃO */}
                {selectedReq.status === "pendente" ? (
                  <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
                    <TouchableOpacity
                      style={[
                        adminStyles.submitButton,
                        { flex: 1, backgroundColor: "#10b981", marginTop: 0 },
                      ]}
                      onPress={() => handleUpdateRequisicao("aprovado")}
                    >
                      <Text
                        style={{
                          color: "#FFF",
                          fontWeight: "700",
                          fontSize: 15,
                        }}
                      >
                        Aprovar
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        adminStyles.submitButton,
                        { flex: 1, backgroundColor: "#ef4444", marginTop: 0 },
                      ]}
                      onPress={() => handleUpdateRequisicao("rejeitado")}
                    >
                      <Text
                        style={{
                          color: "#FFF",
                          fontWeight: "700",
                          fontSize: 15,
                        }}
                      >
                        Rejeitar
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View
                    style={{
                      marginTop: 4,
                      alignItems: "center",
                      padding: 14,
                      borderRadius: 10,
                      backgroundColor:
                        selectedReq.status === "aprovado"
                          ? "#10b98115"
                          : "#ef444415",
                      borderWidth: 1,
                      borderColor:
                        selectedReq.status === "aprovado"
                          ? "#10b981"
                          : "#ef4444",
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "800",
                        fontSize: 14,
                        color:
                          selectedReq.status === "aprovado"
                            ? "#10b981"
                            : "#ef4444",
                      }}
                    >
                      ESTA REQUISIÇÃO FOI {selectedReq.status?.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE PET ── */}
      <Modal visible={!!petToDelete} transparent animationType="fade">
        <View style={modalConfirmStyles.overlay}>
          <View
            style={[
              modalConfirmStyles.box,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
          >
            <Ionicons
              name="trash-outline"
              size={36}
              color={theme.error || "#ef4444"}
              style={{ marginBottom: 12 }}
            />
            <Text style={[modalConfirmStyles.title, { color: theme.text }]}>
              Remover Pet
            </Text>
            <Text
              style={[
                modalConfirmStyles.subtitle,
                { color: theme.textSecondary },
              ]}
            >
              Deseja realmente remover este pet da lista de adoção? Esta ação
              não pode ser desfeita.
            </Text>
            <View style={modalConfirmStyles.btnRow}>
              <TouchableOpacity
                style={[modalConfirmStyles.btn, { borderColor: theme.border }]}
                onPress={() => setPetToDelete(null)}
              >
                <Text style={{ color: theme.text, fontWeight: "600" }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  modalConfirmStyles.btn,
                  {
                    backgroundColor: theme.error || "#ef4444",
                    borderColor: theme.error || "#ef4444",
                  },
                ]}
                onPress={confirmDeletePet}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>
                  Remover
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ── Componente de Layout do Modal ─────────────────────────────────────────────
function DetailItem({
  label,
  value,
  theme,
  inline = false,
}: {
  label: string;
  value: any;
  theme: any;
  inline?: boolean;
}) {
  if (inline) {
    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: "#00000008",
          paddingBottom: 6,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: theme.text,
            opacity: 0.8,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: theme.textSecondary,
            fontWeight: "500",
          }}
        >
          {value || "N/I"}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 12 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "700",
          color: theme.text,
          marginBottom: 4,
          opacity: 0.8,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      <Text
        style={{ fontSize: 14, color: theme.textSecondary, lineHeight: 20 }}
      >
        {value || "Não informado"}
      </Text>
    </View>
  );
}

// ── ESTILOS ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#00000010",
    paddingBottom: 8,
  },
  cardTitle: { fontSize: 14, fontWeight: "700" },
});

const localStyles = StyleSheet.create({
  filtersRow: { flexDirection: "row", gap: 12, marginBottom: 16, zIndex: 10 },
  filterWrap: { flex: 1, zIndex: 10 },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 6,
  },
  filterText: { flex: 1, fontSize: 14, fontWeight: "500" },
  dropdown: {
    position: "absolute",
    top: 52,
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
});

const modalConfirmStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  box: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  btnRow: { flexDirection: "row", gap: 12, width: "100%" },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
