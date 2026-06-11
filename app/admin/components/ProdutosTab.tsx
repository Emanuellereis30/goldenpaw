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
  const [showModal, setShowModal] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [imagePicked, setImagePicked] = useState(false);

  // O estado do formulário agora inclui 'categorias' como um array de strings
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

  const shouldUploadImage = (uri: string) => {
    if (!uri) return false;
    return !/^(https?:\/\/|data:|gs:\/\/)/i.test(uri);
  };

  const uriToBlob = async (uri: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => resolve(xhr.response as Blob);
      xhr.onerror = () => reject(new TypeError("Falha na requisição de rede"));
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });
  };

  const uploadImageAsync = async (uri: string): Promise<string> => {
    const blob = await uriToBlob(uri);
    const filename = `produtos/${Date.now()}-${form.nome
      .replace(/\s+/g, "")
      .toLowerCase()}.jpg`;
    const storageRef = ref(storage, filename);

    const uploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        null,
        (error) => {
          console.error("Erro ao subir imagem do produto:", error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        },
      );
    });
  };

  const formatarPrecoDinheiro = (text: string) => {
    const apenasNumeros = text.replace(/\D/g, "").slice(0, 8);
    if (!apenasNumeros) return "";
    const valor = Number(apenasNumeros) / 100;
    return valor.toLocaleString("pt-BR", {
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
      aspect: [1, 1],
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      setForm((prev) => ({ ...prev, image: result.assets[0].uri }));
      setImagePicked(true);
    }
  };

  // Função para selecionar ou desmarcar categorias
  const toggleCategoria = (cat: string) => {
    setForm((prev) => {
      if (prev.categorias.includes(cat)) {
        return {
          ...prev,
          categorias: prev.categorias.filter((c) => c !== cat),
        };
      } else {
        return { ...prev, categorias: [...prev.categorias, cat] };
      }
    });
  };

  const handleSave = async () => {
    if (!form.nome || !form.preco || !form.image) {
      Alert.alert("Erro", "Preencha nome, preço e selecione uma imagem");
      return;
    }

    if (form.categorias.length === 0) {
      Alert.alert("Erro", "Selecione pelo menos uma categoria para o produto");
      return;
    }

    if (ehRacao && !form.kg) {
      Alert.alert("Erro", "Informe o KG da ração");
      return;
    }

    try {
      let finalImageUrl = form.image;

      if (imagePicked && shouldUploadImage(form.image)) {
        finalImageUrl = await uploadImageAsync(form.image);
      }

      // Converte o array de categorias numa string separada por vírgula (ex: "Cães, Gatos")
      // para facilitar a leitura no filtro da Loja
      const produtoData = {
        nome: form.nome,
        preco: form.preco,
        kg: ehRacao ? form.kg : "",
        image: finalImageUrl,
        tag: form.tag,
        estoque: parseInt(form.estoque) || 0,
        category: form.categorias.join(", "),
      };

      if (editingProduto) {
        await onEditProduto(editingProduto.id, produtoData as any);
        Alert.alert("Sucesso", "Produto atualizado!");
      } else {
        await onAddProduto(produtoData as any);
        Alert.alert("Sucesso", "Produto adicionado!");
      }

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

    // Tenta ler as categorias antigas do banco, separando por vírgula se for string
    let categoriasAtuais: string[] = [];
    const catBanco = (produto as any).category || (produto as any).categoria;

    if (typeof catBanco === "string") {
      categoriasAtuais = catBanco
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
    } else if (Array.isArray(catBanco)) {
      categoriasAtuais = catBanco;
    }

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
        onPress: async () => {
          try {
            await onDeleteProduto(id);
            Alert.alert("Sucesso", "Produto removido!");
          } catch (error) {
            Alert.alert("Erro", "Falha ao excluir produto");
          }
        },
      },
    ]);
  };

  const filteredProdutos = produtos.filter((p) =>
    p.nome.toLowerCase().includes(searchQuery.toLowerCase()),
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

        <ScrollView showsVerticalScrollIndicator={false}>
          {filteredProdutos.length > 0 ? (
            filteredProdutos.map((produto) => (
              <View
                key={produto.id}
                style={[
                  adminStyles.itemCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                {produto.image ? (
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
                ) : null}

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

                  {/* Exibe as categorias na listagem */}
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
                    ) : produto.estoque <= 5 ? (
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
                    ) : null}
                  </View>
                  {produto.tag && (
                    <Text
                      style={[
                        { fontSize: 12, color: theme.primary, marginTop: 4 },
                      ]}
                    >
                      Tag: {produto.tag}
                    </Text>
                  )}
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

      {/* Modal de Produto */}
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
                placeholder="Ex: Ração Premium 10kg"
                placeholderTextColor={theme.textSecondary}
                value={form.nome}
                onChangeText={(text) => setForm({ ...form, nome: text })}
              />

              {/* ── SEÇÃO DE CATEGORIAS (MÚLTIPLA ESCOLHA) ── */}
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
                    {ehRacao ? "Preço por KG (R$) *" : "Preço (R$) *"}
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
                    onChangeText={(text) =>
                      setForm({ ...form, preco: formatarPrecoDinheiro(text) })
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
                    onChangeText={(text) =>
                      setForm({ ...form, estoque: text.replace(/[^0-9]/g, "") })
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
                    onChangeText={(text) =>
                      setForm({ ...form, kg: formatarKg(text) })
                    }
                    keyboardType="decimal-pad"
                  />
                  <Text
                    style={[
                      adminStyles.helperText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Máximo: 50kg
                  </Text>
                </View>
              )}

              <Text style={[adminStyles.label, { color: theme.text }]}>
                Foto do Produto *
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
                  {form.image
                    ? "Trocar foto"
                    : "Selecionar foto do dispositivo"}
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
                onChangeText={(text) => setForm({ ...form, tag: text })}
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
