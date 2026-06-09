import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
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
import { db } from "../../../firebaseConfig";
import { adminStyles } from "../styles/adminStyles";
import { Funcionario } from "../types/admin.types";

export default function FuncionariosTab() {
  const { theme } = useAppTheme();

  // Estados do Firebase
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados da Interface
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingFuncionario, setEditingFuncionario] =
    useState<Funcionario | null>(null);

  const [form, setForm] = useState<{
    nome: string;
    email: string;
    telefone: string;
    cargo: string;
    dataAdmissao: string;
    salario: string;
    status: "ativo" | "inativo";
    endereco: string;
  }>({
    nome: "",
    email: "",
    telefone: "",
    cargo: "",
    dataAdmissao: "",
    salario: "",
    status: "ativo",
    endereco: "",
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "funcionarios"), (snapshot) => {
      const docs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Funcionario[];
      setFuncionarios(docs);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const onAddFuncionario = async (funcionario: Omit<Funcionario, "id">) => {
    await addDoc(collection(db, "funcionarios"), funcionario);
  };

  const onEditFuncionario = async (
    id: string,
    funcionario: Omit<Funcionario, "id">,
  ) => {
    await updateDoc(doc(db, "funcionarios", id), funcionario);
  };

  const onDeleteFuncionario = async (id: string) => {
    await deleteDoc(doc(db, "funcionarios", id));
  };

  const filteredFuncionarios = funcionarios.filter(
    (f) =>
      f.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSave = async () => {
    if (
      !form.nome ||
      !form.email ||
      !form.cargo ||
      !form.dataAdmissao ||
      !form.salario
    ) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const funcionarioData = {
        nome: form.nome,
        email: form.email,
        telefone: form.telefone,
        cargo: form.cargo,
        dataAdmissao: form.dataAdmissao,
        salario: form.salario,
        status: form.status,
        endereco: form.endereco,
      };

      if (editingFuncionario) {
        await onEditFuncionario(editingFuncionario.id, funcionarioData);
        Alert.alert("Sucesso", "Funcionário atualizado!");
      } else {
        await onAddFuncionario(funcionarioData);
        Alert.alert("Sucesso", "Funcionário adicionado!");
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      Alert.alert("Erro", "Falha ao salvar funcionário");
    }
  };

  const resetForm = () => {
    setForm({
      nome: "",
      email: "",
      telefone: "",
      cargo: "",
      dataAdmissao: "",
      salario: "",
      status: "ativo",
      endereco: "",
    });
    setEditingFuncionario(null);
  };

  const handleEdit = (funcionario: Funcionario) => {
    setEditingFuncionario(funcionario);
    setForm({
      nome: funcionario.nome,
      email: funcionario.email,
      telefone: funcionario.telefone,
      cargo: funcionario.cargo,
      dataAdmissao: funcionario.dataAdmissao,
      salario: funcionario.salario,
      status: funcionario.status,
      endereco: funcionario.endereco || "",
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Confirmar", "Deseja excluir este funcionário?", [
      { text: "Cancelar" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await onDeleteFuncionario(id);
            Alert.alert("Sucesso", "Funcionário removido!");
          } catch (error) {
            Alert.alert("Erro", "Falha ao excluir funcionário");
          }
        },
      },
    ]);
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
        <View
          style={[
            adminStyles.searchBar,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[adminStyles.searchInput, { color: theme.text }]}
            placeholder="Pesquisar funcionário..."
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
          <Text style={adminStyles.addButtonText}>Novo Funcionário</Text>
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false}>
          {filteredFuncionarios.length > 0 ? (
            filteredFuncionarios.map((funcionario) => (
              <View
                key={funcionario.id}
                style={[
                  adminStyles.itemCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={adminStyles.itemInfo}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text style={[adminStyles.itemName, { color: theme.text }]}>
                      {funcionario.nome}
                    </Text>
                    <View
                      style={{
                        backgroundColor:
                          funcionario.status === "ativo"
                            ? "#10b98120"
                            : "#ef444420",
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 4,
                      }}
                    >
                      <Text
                        style={[
                          {
                            fontSize: 10,
                            fontWeight: "bold",
                            color:
                              funcionario.status === "ativo"
                                ? "#10b981"
                                : "#ef4444",
                          },
                        ]}
                      >
                        {funcionario.status === "ativo" ? "ATIVO" : "INATIVO"}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {funcionario.cargo}
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {funcionario.email}
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Admissão: {funcionario.dataAdmissao}
                  </Text>
                </View>
                <View style={adminStyles.itemActions}>
                  <TouchableOpacity
                    style={[
                      adminStyles.actionButton,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={() => handleEdit(funcionario)}
                  >
                    <Ionicons name="pencil" size={18} color="#000" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      adminStyles.actionButton,
                      { backgroundColor: theme.error },
                    ]}
                    onPress={() => handleDelete(funcionario.id)}
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
              Nenhum funcionário encontrado
            </Text>
          )}
        </ScrollView>
      </View>

      {/* Modal de Funcionário */}
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
              {editingFuncionario ? "Editar Funcionário" : "Novo Funcionário"}
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
                Informações Pessoais
              </Text>

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
                placeholder="Nome completo"
                placeholderTextColor={theme.textSecondary}
                value={form.nome}
                onChangeText={(text) => setForm({ ...form, nome: text })}
              />

              <Text style={[adminStyles.label, { color: theme.text }]}>
                Email *
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
                placeholder="email@exemplo.com"
                placeholderTextColor={theme.textSecondary}
                value={form.email}
                onChangeText={(text) => setForm({ ...form, email: text })}
                keyboardType="email-address"
              />

              <Text style={[adminStyles.label, { color: theme.text }]}>
                Telefone
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
                placeholder="(11) 99999-9999"
                placeholderTextColor={theme.textSecondary}
                value={form.telefone}
                onChangeText={(text) => setForm({ ...form, telefone: text })}
                keyboardType="phone-pad"
              />

              <Text style={[adminStyles.label, { color: theme.text }]}>
                Endereço
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
                placeholder="Rua, número, complemento"
                placeholderTextColor={theme.textSecondary}
                value={form.endereco}
                onChangeText={(text) => setForm({ ...form, endereco: text })}
              />

              <Text
                style={[
                  adminStyles.sectionTitle,
                  { color: theme.primary, marginTop: 20 },
                ]}
              >
                Informações Profissionais
              </Text>

              <Text style={[adminStyles.label, { color: theme.text }]}>
                Cargo *
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
                placeholder="Ex: Gerente, Vendedor"
                placeholderTextColor={theme.textSecondary}
                value={form.cargo}
                onChangeText={(text) => setForm({ ...form, cargo: text })}
              />

              <Text style={[adminStyles.label, { color: theme.text }]}>
                Data de Admissão *
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
                placeholder="DD/MM/YYYY"
                placeholderTextColor={theme.textSecondary}
                value={form.dataAdmissao}
                onChangeText={(text) =>
                  setForm({ ...form, dataAdmissao: text })
                }
              />

              <Text style={[adminStyles.label, { color: theme.text }]}>
                Salário *
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
                placeholder="Ex: 2.500,00"
                placeholderTextColor={theme.textSecondary}
                value={form.salario}
                onChangeText={(text) => setForm({ ...form, salario: text })}
                keyboardType="decimal-pad"
              />

              <Text style={[adminStyles.label, { color: theme.text }]}>
                Status
              </Text>
              <View style={adminStyles.typeSelector}>
                {["ativo", "inativo"].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      adminStyles.typeButton,
                      {
                        backgroundColor:
                          form.status === status
                            ? theme.primary
                            : theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => setForm({ ...form, status: status as any })}
                  >
                    <Text
                      style={[
                        adminStyles.typeButtonText,
                        { color: form.status === status ? "#000" : theme.text },
                      ]}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  adminStyles.submitButton,
                  { backgroundColor: theme.primary },
                ]}
                onPress={handleSave}
              >
                <Text style={adminStyles.submitButtonText}>
                  {editingFuncionario ? "Atualizar" : "Salvar"} Funcionário
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}
