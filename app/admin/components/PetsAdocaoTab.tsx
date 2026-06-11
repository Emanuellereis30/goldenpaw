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
import { db } from "../../../firebaseConfig";
import { adminStyles } from "../styles/adminStyles";

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
export default function PetsAdocaoTab() {
  const { theme } = useAppTheme();
  const storage = getStorage();

  const [pets, setPets] = useState<any[]>([]);
  const [requisicoes, setRequisicoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSave, setLoadingSave] = useState(false);

  const [currentView, setCurrentView] = useState<"pets" | "requisicoes">(
    "pets",
  );
  const [searchQuery, setSearchQuery] = useState("");

  const [showPetModal, setShowPetModal] = useState(false);
  const [editingPet, setEditingPet] = useState<any | null>(null);
  const [imagePicked, setImagePicked] = useState(false);

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
      Alert.alert(
        "Permissão",
        "Precisamos de acesso à galeria para a foto do pet.",
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
      Alert.alert(
        "Erro",
        "Preencha todos os campos obrigatórios e adicione uma foto.",
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
        Alert.alert("Sucesso", "Pet atualizado!");
      } else {
        await addDoc(collection(db, "pets"), petData);
        Alert.alert("Sucesso", "Pet cadastrado!");
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
      Alert.alert("Erro", "Falha ao salvar o pet. Verifique a sua ligação.");
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

  const handleDeletePet = (id: string) => {
    Alert.alert("Confirmar", "Deseja remover este pet da lista de adoção?", [
      { text: "Cancelar" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => await deleteDoc(doc(db, "pets", id)),
      },
    ]);
  };

  const handleUpdateRequisicao = async (status: "aprovado" | "rejeitado") => {
    if (!selectedReq) return;
    try {
      await updateDoc(doc(db, "requisicoes_adocao", selectedReq.id), {
        status,
        visualizado: true,
      });
      Alert.alert("Sucesso", `Requisição ${status} com sucesso!`);
      setShowReqModal(false);
    } catch (error) {
      Alert.alert("Erro", "Falha ao atualizar o status.");
    }
  };

  const filteredPets = pets.filter((p) =>
    (p.nome || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Utilizar o nomeCompleto (novo) ou as variáveis antigas para a pesquisa
  const filteredReqs = requisicoes.filter(
    (r) =>
      (r.nomeCompleto || r.usuarioNome || r.clienteNome || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (r.petNome || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

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

        {/* VIEW: PETS */}
        {currentView === "pets" && (
          <>
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

            <ScrollView showsVerticalScrollIndicator={false}>
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
                        onPress={() => handleDeletePet(pet.id)}
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

        {/* VIEW: REQUISIÇÕES */}
        {currentView === "requisicoes" && (
          <ScrollView showsVerticalScrollIndicator={false}>
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
                        Queria adotar:{" "}
                        <Text style={{ fontWeight: "700" }}>{req.petNome}</Text>
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
                style={[adminStyles.emptyText, { color: theme.textSecondary }]}
              >
                Nenhuma requisição encontrada
              </Text>
            )}
          </ScrollView>
        )}
      </View>

      {/* MODAL: REGISTRO DE PET */}
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

              <View
                style={[
                  adminStyles.tipsBox,
                  { borderColor: theme.border, backgroundColor: theme.surface },
                ]}
              >
                <View style={adminStyles.tipsTitleRow}>
                  <Ionicons
                    name="bulb-outline"
                    size={18}
                    color={theme.primary}
                  />
                  <Text style={[adminStyles.tipsTitle, { color: theme.text }]}>
                    Dica de Preenchimento
                  </Text>
                </View>
                <Text
                  style={[adminStyles.tipText, { color: theme.textSecondary }]}
                >
                  Mantenha os dados atualizados para facilitar o contato com os
                  possíveis adotantes.
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  adminStyles.submitButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: loadingSave ? 0.6 : 1,
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

      {/* MODAL: DETALHES DA REQUISIÇÃO (TUDO ATUALIZADO AQUI) */}
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
            showsVerticalScrollIndicator={false}
          >
            {selectedReq && (
              <View style={[adminStyles.modalForm, { paddingBottom: 40 }]}>
                {/* INFO DO PET */}
                <Text
                  style={[
                    adminStyles.sectionTitle,
                    { color: theme.primary, marginTop: 0 },
                  ]}
                >
                  Sobre o Pet
                </Text>
                <View
                  style={[
                    adminStyles.itemCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      padding: 12,
                      marginBottom: 20,
                    },
                  ]}
                >
                  <Text style={[adminStyles.itemName, { color: theme.text }]}>
                    {selectedReq.petNome}
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                    ID do Pet: {selectedReq.petId}
                  </Text>
                </View>

                {/* ETAPA 1 */}
                <Text
                  style={[adminStyles.sectionTitle, { color: theme.primary }]}
                >
                  1. Dados Pessoais
                </Text>
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
                      label="Celular / Telefone"
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

                {/* ETAPA 2 */}
                <Text
                  style={[
                    adminStyles.sectionTitle,
                    { color: theme.primary, marginTop: 10 },
                  ]}
                >
                  2. Informações de Moradia
                </Text>
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
                      label="Tipo de Imóvel"
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
                        label="Proprietário permite?"
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
                />
                <DetailItem
                  theme={theme}
                  label="Existem rotas de fuga?"
                  value={formatBoolean(selectedReq.rotasFuga)}
                />
                <DetailItem
                  theme={theme}
                  label="Possui telas de proteção?"
                  value={formatBoolean(selectedReq.telasProtecao)}
                />

                {/* ETAPA 3 */}
                <Text
                  style={[
                    adminStyles.sectionTitle,
                    { color: theme.primary, marginTop: 10 },
                  ]}
                >
                  3. Dinâmica Familiar
                </Text>
                <DetailItem
                  theme={theme}
                  label="Quantidade de pessoas na casa"
                  value={selectedReq.quantidadePessoas}
                />

                <View style={{ flexDirection: "row", gap: 16 }}>
                  <View style={{ flex: 1 }}>
                    <DetailItem
                      theme={theme}
                      label="Há crianças?"
                      value={formatBoolean(selectedReq.temCriancas)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <DetailItem
                      theme={theme}
                      label="Há idosos?"
                      value={formatBoolean(selectedReq.temIdosos)}
                    />
                  </View>
                </View>

                <DetailItem
                  theme={theme}
                  label="Todos concordam com a adoção?"
                  value={formatBoolean(selectedReq.todosAcordam)}
                />
                <DetailItem
                  theme={theme}
                  label="Alguém possui alergia a pelos?"
                  value={
                    selectedReq.temAlergias
                      ? `Sim - Quem: ${selectedReq.temAlergiasQuem}`
                      : formatBoolean(selectedReq.temAlergias)
                  }
                />
                <DetailItem
                  theme={theme}
                  label="Tempo diário que o pet ficará sozinho"
                  value={selectedReq.tempoSozinho}
                />

                {/* ETAPA 4 */}
                <Text
                  style={[
                    adminStyles.sectionTitle,
                    { color: theme.primary, marginTop: 10 },
                  ]}
                >
                  4. Histórico com Animais
                </Text>
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

                {/* ETAPA 5 */}
                <Text
                  style={[
                    adminStyles.sectionTitle,
                    { color: theme.primary, marginTop: 10 },
                  ]}
                >
                  5. Termo de Responsabilidade
                </Text>
                <DetailItem
                  theme={theme}
                  label="Ciente dos custos financeiros e saúde?"
                  value={formatBoolean(selectedReq.cienteFinanceiro)}
                />
                <DetailItem
                  theme={theme}
                  label="Planos para viagens e mudanças"
                  value={selectedReq.planosViagem}
                />
                <DetailItem
                  theme={theme}
                  label="Concorda com acompanhamento / fotos?"
                  value={formatBoolean(selectedReq.concordaAcompanhamento)}
                />

                <DetailItem
                  theme={theme}
                  label="Observações / Motivo da adoção"
                  value={
                    selectedReq.observacoes ||
                    selectedReq.motivo ||
                    selectedReq.mensagem
                  }
                />

                {/* BOTÕES DE APROVAÇÃO */}
                {selectedReq.status === "pendente" ? (
                  <View
                    style={{ flexDirection: "row", gap: 12, marginTop: 20 }}
                  >
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
                          fontSize: 16,
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
                          fontSize: 16,
                        }}
                      >
                        Rejeitar
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View
                    style={{
                      marginTop: 20,
                      alignItems: "center",
                      padding: 16,
                      backgroundColor:
                        selectedReq.status === "aprovado"
                          ? "#10b98120"
                          : "#ef444420",
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "bold",
                        fontSize: 16,
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
    </>
  );
}

// ── Componente de Layout do Modal ─────────────────────────────────────────────
function DetailItem({
  label,
  value,
  theme,
}: {
  label: string;
  value: any;
  theme: any;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "700",
          color: theme.text,
          marginBottom: 4,
          opacity: 0.8,
        }}
      >
        {label}
      </Text>
      <Text style={{ fontSize: 15, color: theme.textSecondary }}>
        {value || "Não informado"}
      </Text>
    </View>
  );
}
