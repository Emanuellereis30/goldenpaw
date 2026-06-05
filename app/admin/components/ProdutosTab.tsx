import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

export default function ProdutosTab({
  produtos,
  loading,
  onAddProduto,
  onEditProduto,
  onDeleteProduto,
}: ProdutosTabProps) {
  const { theme } = useAppTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [form, setForm] = useState({
    nome: "",
    preco: "",
    kg: "",
    image: "",
    tag: "",
    estoque: "0",
  });

  const ehRacao = form.nome.toLowerCase().includes("ração");

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

  const validarUrl = (url: string) => /^https?:\/\/.+\..+/.test(url.trim());

  const handleSave = async () => {
    if (!form.nome || !form.preco || !form.image) {
      Alert.alert("Erro", "Preencha nome, preço e link da imagem");
      return;
    }

    if (ehRacao && !form.kg) {
      Alert.alert("Erro", "Informe o KG da ração");
      return;
    }

    if (!validarUrl(form.image)) {
      Alert.alert(
        "Erro",
        "Link da imagem inválido (comece com http:// ou https://)",
      );
      return;
    }

    try {
      const produtoData = {
        nome: form.nome,
        preco: form.preco,
        kg: ehRacao ? form.kg : "",
        image: form.image,
        tag: form.tag,
        estoque: parseInt(form.estoque) || 0,
      };

      if (editingProduto) {
        await onEditProduto(editingProduto.id, produtoData);
        Alert.alert("Sucesso", "Produto atualizado!");
      } else {
        await onAddProduto(produtoData);
        Alert.alert("Sucesso", "Produto adicionado!");
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      Alert.alert("Erro", "Falha ao salvar produto");
    }
  };

  const resetForm = () => {
    setForm({ nome: "", preco: "", kg: "", image: "", tag: "", estoque: "0" });
    setEditingProduto(null);
  };

  const handleEdit = (produto: Produto) => {
    setEditingProduto(produto);
    setForm({
      nome: produto.nome,
      preco: produto.preco,
      kg: produto.kg || "",
      image: produto.image,
      tag: produto.tag || "",
      estoque: (produto.estoque || 0).toString(),
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
                <View style={adminStyles.itemInfo}>
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
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Estoque: {produto.estoque || 0} unidades
                  </Text>
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
                Link da Imagem (URL) *
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
                placeholder="https://exemplo.com/imagem.jpg"
                placeholderTextColor={theme.textSecondary}
                value={form.image}
                autoCapitalize="none"
                keyboardType="url"
                onChangeText={(text) =>
                  setForm({ ...form, image: text.trim() })
                }
              />

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
                  { backgroundColor: theme.primary },
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
