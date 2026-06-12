import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { adminStyles } from "../styles/adminStyles";
import { Produto } from "../types/admin.types";

interface ProdutosTabProps {
  produtos: Produto[];
  loading: boolean;
  onAddProduto: (produto: Omit<Produto, "id">) => Promise<void>;
  onEditProduto: (id: string, produto: Omit<Produto, "id">) => Promise<void>;
  onDeleteProduto: (id: string) => Promise<void>;
}

const CATEGORIAS_DISPONIVEIS = ["Cães", "Gatos", "Aves", "Peixes", "Outros"];
const CATEGORIAS_FILTRO = [
  "Categorias",
  ...CATEGORIAS_DISPONIVEIS,
  "Baixo Estoque",
  "Esgotado",
];
const ORDENACOES = [
  { label: "A-Z", value: "nome_asc" },
  { label: "Menor Preço", value: "preco_asc" },
  { label: "Maior Preço", value: "preco_desc" },
];

export default function ProdutosTab({
  produtos,
  loading,
  onAddProduto,
  onEditProduto,
  onDeleteProduto,
}: ProdutosTabProps) {
  const { theme } = useAppTheme();
  const storage = getStorage();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState("Categorias");
  const [ordenacao, setOrdenacao] = useState("nome_asc");
  const [showCategoriaDropdown, setShowCategoriaDropdown] = useState(false);
  const [showOrdenacaoDropdown, setShowOrdenacaoDropdown] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [imagePicked, setImagePicked] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    preco: "",
    kg: "",
    image: "",
    tag: "",
    estoque: "0",
    categorias: [] as string[],
  });

  const ehRacao = form.nome.toLowerCase().includes("ração");

  const shouldUploadImage = (uri: string) =>
    uri && !/^(https?:\/\/|data:|gs:\/\/)/i.test(uri);

  const uriToBlob = async (uri: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => resolve(xhr.response as Blob);
      xhr.onerror = () => reject(new TypeError("Falha na requisição"));
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });
  };

  const uploadImageAsync = async (uri: string): Promise<string> => {
    const blob = await uriToBlob(uri);
    const filename = `produtos/${Date.now()}-${form.nome.replace(/\s+/g, "").toLowerCase()}.jpg`;
    const storageRef = ref(storage, filename);
    const uploadTask = uploadBytesResumable(storageRef, blob);
    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        null,
        (error) => reject(error),
        async () => resolve(await getDownloadURL(uploadTask.snapshot.ref)),
      );
    });
  };

  const formatarPrecoDinheiro = (text: string) => {
    const apenasNumeros = text.replace(/\D/g, "").slice(0, 8);
    if (!apenasNumeros) return "";
    return (Number(apenasNumeros) / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatarKg = (text: string) => {
    const valor = text.replace(/[^0-9,.]/g, "").replace(",", ".");
    const kgNumero = Number(valor);
    if (!valor) return "";
    if (kgNumero > 50) return "50";
    if (kgNumero < 0) return "0";
    return valor.replace(".", ",");
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted")
      return Alert.alert(
        "Permissão necessária",
        "Precisamos de acesso à galeria.",
      );
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setForm((prev) => ({ ...prev, image: result.assets[0].uri }));
      setImagePicked(true);
    }
  };

  const toggleCategoria = (cat: string) => {
    setForm((prev) => ({
      ...prev,
      categorias: prev.categorias.includes(cat)
        ? prev.categorias.filter((c) => c !== cat)
        : [...prev.categorias, cat],
    }));
  };

  const handleSave = async () => {
    if (
      !form.nome ||
      !form.preco ||
      !form.image ||
      form.categorias.length === 0 ||
      (ehRacao && !form.kg)
    ) {
      return Alert.alert(
        "Erro",
        "Preencha os campos obrigatórios e categorias.",
      );
    }
    try {
      let finalImageUrl = form.image;
      if (imagePicked && shouldUploadImage(form.image))
        finalImageUrl = await uploadImageAsync(form.image);
      const produtoData = {
        nome: form.nome,
        preco: form.preco,
        kg: ehRacao ? form.kg : "",
        image: finalImageUrl,
        tag: form.tag,
        estoque: parseInt(form.estoque) || 0,
        category: form.categorias.join(", "),
      };
      if (editingProduto)
        await onEditProduto(editingProduto.id, produtoData as any);
      else await onAddProduto(produtoData as any);
      Alert.alert("Sucesso", "Produto guardado!");
      setShowModal(false);
      resetForm();
    } catch (error) {
      Alert.alert("Erro", "Falha ao salvar produto");
    }
  };

  const resetForm = () => {
    setForm({
      nome: "",
      preco: "",
      kg: "",
      image: "",
      tag: "",
      estoque: "0",
      categorias: [],
    });
    setEditingProduto(null);
    setImagePicked(false);
  };

  const handleEdit = (produto: Produto) => {
    setEditingProduto(produto);
    setImagePicked(false);
    let categoriasAtuais: string[] = [];
    const catBanco = (produto as any).category || (produto as any).categoria;
    if (typeof catBanco === "string")
      categoriasAtuais = catBanco
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
    else if (Array.isArray(catBanco)) categoriasAtuais = catBanco;
    setForm({
      nome: produto.nome,
      preco: produto.preco,
      kg: produto.kg || "",
      image: produto.image,
      tag: produto.tag || "",
      estoque: (produto.estoque || 0).toString(),
      categorias: categoriasAtuais,
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Confirmar", "Deseja excluir este produto?", [
      { text: "Cancelar" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => await onDeleteProduto(id),
      },
    ]);
  };

  // 1. Filtrar Produtos
  let produtosFiltrados = produtos.filter((item) => {
    const matchSearch = item.nome
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (categoriaSelecionada === "Baixo Estoque") {
      const estoque = item.estoque ?? 0;
      return matchSearch && estoque > 0 && estoque <= 5;
    }

    if (categoriaSelecionada === "Esgotado") {
      return matchSearch && (item.estoque ?? 0) === 0;
    }

    if (categoriaSelecionada === "Categorias") return matchSearch;
    const catBanco = (item as any).category || (item as any).categoria || "";
    const norm = (t: string) =>
      t
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    const catSelNorm = norm(categoriaSelecionada);
    const catBancoNorm = norm(catBanco);
    let matchCat = false;
    if (
      catSelNorm === "caes" &&
      (catBancoNorm.includes("caes") ||
        catBancoNorm.includes("cao") ||
        catBancoNorm.includes("cachorro"))
    )
      matchCat = true;
    else if (catSelNorm === "gatos" && catBancoNorm.includes("gato"))
      matchCat = true;
    else if (catSelNorm === "aves" && catBancoNorm.includes("ave"))
      matchCat = true;
    else if (catSelNorm === "peixes" && catBancoNorm.includes("peixe"))
      matchCat = true;
    else if (catBancoNorm.includes(catSelNorm)) matchCat = true;
    return matchSearch && matchCat;
  });

  // 2. Ordenar Produtos
  produtosFiltrados.sort((a, b) => {
    const conv = (v: any) => {
      if (!v) return 0;
      if (typeof v === "number") return v;
      const num = parseFloat(
        String(v)
          .replace(/[^\d.,]/g, "")
          .replace(",", "."),
      );
      return isNaN(num) ? 0 : num;
    };
    switch (ordenacao) {
      case "nome_asc":
        return (a.nome || "").localeCompare(b.nome || "");
      case "preco_asc":
        return conv(a.preco) - conv(b.preco);
      case "preco_desc":
        return conv(b.preco) - conv(a.preco);
      default:
        return 0;
    }
  });

  if (loading)
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

  return (
    <>
      <View
        style={[
          adminStyles.contentContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <View
          style={[
            adminStyles.searchBar,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[adminStyles.searchInput, { color: theme.text }]}
            placeholder="Pesquisar produto..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* ── Filtros Estilo Adoção (Dropdown) ── */}
        <View style={localStyles.filtersRow}>
          <View style={localStyles.filterWrap}>
            <TouchableOpacity
              style={[
                localStyles.filterBtn,
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
                style={[localStyles.filterText, { color: theme.text }]}
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
                  localStyles.dropdown,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                {CATEGORIAS_FILTRO.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      localStyles.dropdownItem,
                      { borderBottomColor: theme.border },
                    ]}
                    onPress={() => {
                      setCategoriaSelecionada(cat);
                      setShowCategoriaDropdown(false);
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {cat === "Baixo Estoque" && (
                        <Ionicons
                          name="warning-outline"
                          size={14}
                          color="#f59e0b"
                        />
                      )}
                      {cat === "Esgotado" && (
                        <Ionicons
                          name="close-circle-outline"
                          size={14}
                          color="#ef4444"
                        />
                      )}
                      <Text
                        style={[
                          localStyles.dropdownText,
                          {
                            color:
                              cat === "Esgotado"
                                ? "#ef4444"
                                : cat === "Baixo Estoque"
                                  ? "#f59e0b"
                                  : categoriaSelecionada === cat
                                    ? theme.primary
                                    : theme.text,
                            fontWeight:
                              cat === "Baixo Estoque" || cat === "Esgotado"
                                ? "700"
                                : "500",
                          },
                        ]}
                      >
                        {cat}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          <View style={localStyles.filterWrap}>
            <TouchableOpacity
              style={[
                localStyles.filterBtn,
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
                style={[localStyles.filterText, { color: theme.text }]}
                numberOfLines={1}
              >
                {ORDENACOES.find((o) => o.value === ordenacao)?.label ||
                  "Ordenar"}
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
                  localStyles.dropdown,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                {ORDENACOES.map((ord) => (
                  <TouchableOpacity
                    key={ord.value}
                    style={[
                      localStyles.dropdownItem,
                      { borderBottomColor: theme.border },
                    ]}
                    onPress={() => {
                      setOrdenacao(ord.value);
                      setShowOrdenacaoDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        localStyles.dropdownText,
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

        <TouchableOpacity
          style={[adminStyles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <Ionicons name="add" size={24} color="#000" />
          <Text style={adminStyles.addButtonText}>Novo Produto</Text>
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
            {produtosFiltrados.length} produto(s)
            {categoriaSelecionada === "Baixo Estoque"
              ? " com baixo estoque (1–5 unidades)"
              : categoriaSelecionada === "Esgotado"
                ? " esgotado(s)"
                : " encontrado(s)"}
          </Text>
          {produtosFiltrados.length > 0 ? (
            produtosFiltrados.map((produto) => (
              <View
                key={produto.id}
                style={[
                  adminStyles.itemCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                {produto.image && (
                  <Image
                    source={{ uri: produto.image }}
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
                  <Text style={[adminStyles.itemName, { color: theme.text }]}>
                    {produto.nome}
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    R$ {produto.preco}
                    {produto.kg ? ` • ${produto.kg}kg` : ""}
                  </Text>
                  {((produto as any).category ||
                    (produto as any).categoria) && (
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.textSecondary,
                        marginTop: 2,
                      }}
                    >
                      Cat:{" "}
                      {(produto as any).category || (produto as any).categoria}
                    </Text>
                  )}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 4,
                    }}
                  >
                    <Text
                      style={[
                        adminStyles.itemDetail,
                        { color: theme.textSecondary, marginTop: 0 },
                      ]}
                    >
                      Estoque: {produto.estoque || 0}
                    </Text>
                    {!produto.estoque || produto.estoque <= 0 ? (
                      <View
                        style={{
                          backgroundColor: "#ef444420",
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "bold",
                            color: "#ef4444",
                          }}
                        >
                          ESGOTADO
                        </Text>
                      </View>
                    ) : (
                      produto.estoque <= 5 && (
                        <View
                          style={{
                            backgroundColor: "#f59e0b20",
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "bold",
                              color: "#f59e0b",
                            }}
                          >
                            BAIXO ESTOQUE
                          </Text>
                        </View>
                      )
                    )}
                  </View>
                </View>
                <View style={adminStyles.itemActions}>
                  <TouchableOpacity
                    style={[
                      adminStyles.actionButton,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={() => handleEdit(produto)}
                  >
                    <Ionicons name="pencil" size={18} color="#000" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      adminStyles.actionButton,
                      { backgroundColor: theme.error },
                    ]}
                    onPress={() => handleDelete(produto.id)}
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
              Nenhum produto encontrado
            </Text>
          )}
        </ScrollView>
      </View>

      {/* Modal de Produto mantido como antes... (código resumido visualmente) */}
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
              {editingProduto ? "Editar Produto" : "Novo Produto"}
            </Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={adminStyles.modalContent}>
            <View style={adminStyles.modalForm}>
              <Text style={[adminStyles.label, { color: theme.text }]}>
                Nome do Produto *
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
                placeholder="Ex: Ração..."
                placeholderTextColor={theme.textSecondary}
                value={form.nome}
                onChangeText={(t) => setForm({ ...form, nome: t })}
              />

              <Text
                style={[adminStyles.label, { color: theme.text, marginTop: 8 }]}
              >
                Categorias *
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                {CATEGORIAS_DISPONIVEIS.map((cat) => {
                  const isSelected = form.categorias.includes(cat);
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => toggleCategoria(cat)}
                      activeOpacity={0.7}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: isSelected ? theme.primary : theme.border,
                        backgroundColor: isSelected
                          ? theme.primary
                          : theme.surface,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: isSelected ? "700" : "500",
                          color: isSelected ? "#000" : theme.textSecondary,
                        }}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={adminStyles.productInputRow}>
                <View style={adminStyles.productInputColumn}>
                  <Text style={[adminStyles.label, { color: theme.text }]}>
                    Preço (R$) *
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
                    placeholder="Ex: 12,00"
                    placeholderTextColor={theme.textSecondary}
                    value={form.preco}
                    onChangeText={(t) =>
                      setForm({ ...form, preco: formatarPrecoDinheiro(t) })
                    }
                    keyboardType="numeric"
                  />
                </View>
                <View style={adminStyles.productInputColumn}>
                  <Text style={[adminStyles.label, { color: theme.text }]}>
                    Estoque
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
                    placeholder="Ex: 50"
                    placeholderTextColor={theme.textSecondary}
                    value={form.estoque}
                    onChangeText={(t) =>
                      setForm({ ...form, estoque: t.replace(/[^0-9]/g, "") })
                    }
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {ehRacao && (
                <View>
                  <Text style={[adminStyles.label, { color: theme.text }]}>
                    KG da Ração *
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
                    placeholder="Ex: 10"
                    placeholderTextColor={theme.textSecondary}
                    value={form.kg}
                    onChangeText={(t) =>
                      setForm({ ...form, kg: formatarKg(t) })
                    }
                    keyboardType="decimal-pad"
                  />
                </View>
              )}

              <Text style={[adminStyles.label, { color: theme.text }]}>
                Foto do Produto *
              </Text>
              <TouchableOpacity
                style={[
                  adminStyles.imagePickerButton,
                  { backgroundColor: theme.surface, borderColor: theme.border },
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
                  {form.image ? "Trocar foto" : "Selecionar foto"}
                </Text>
              </TouchableOpacity>
              {form.image ? (
                <View style={adminStyles.imagePreviewContainer}>
                  <Image
                    source={{ uri: form.image }}
                    style={adminStyles.imagePreview}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={[
                      adminStyles.removeImageButton,
                      { backgroundColor: theme.error },
                    ]}
                    onPress={() => setForm((prev) => ({ ...prev, image: "" }))}
                  >
                    <Ionicons name="close" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ) : null}

              <Text style={[adminStyles.label, { color: theme.text }]}>
                Tag (Opcional)
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
                placeholder="Ex: Promoção, Novo"
                placeholderTextColor={theme.textSecondary}
                value={form.tag}
                onChangeText={(t) => setForm({ ...form, tag: t })}
              />

              <TouchableOpacity
                style={[
                  adminStyles.submitButton,
                  { backgroundColor: theme.primary, marginTop: 10 },
                ]}
                onPress={handleSave}
              >
                <Text style={adminStyles.submitButtonText}>
                  {editingProduto ? "Atualizar" : "Salvar"} Produto
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const localStyles = StyleSheet.create({
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
});
