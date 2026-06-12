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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../../firebaseConfig";
import { adminStyles } from "../styles/adminStyles";
import { Funcionario } from "../types/admin.types";

const STATUS_FUNC = ["Todos", "Ativos", "Inativos"];
const ORDENACOES_FUNC = [
  { label: "A-Z", value: "nome_asc" },
  { label: "Z-A", value: "nome_desc" },
];

export default function FuncionariosTab() {
  const { theme } = useAppTheme();

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingFuncionario, setEditingFuncionario] =
    useState<Funcionario | null>(null);
  const [selectedFuncionario, setSelectedFuncionario] = useState<any>(null);

  const [statusFilter, setStatusFilter] = useState("Todos");
  const [ordenacao, setOrdenacao] = useState("nome_asc");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showOrdenacaoDropdown, setShowOrdenacaoDropdown] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    email: "",
    telefone: "",
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    cargo: "",
    dataAdmissao: "",
    salario: "",
    status: "ativo" as "ativo" | "inativo",
    isAdmin: false,
  });

  const maskCpf = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length <= 11) {
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return v;
  };

  const maskPhone = (v: string) => {
    v = v.replace(/\D/g, "");
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d{5})(\d)/, "$1-$2");
    return v;
  };

  const maskCep = (v: string) => {
    v = v.replace(/\D/g, "");
    v = v.replace(/(\d{5})(\d)/, "$1-$2");
    return v;
  };

  const maskDate = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 8) v = v.slice(0, 8);
    v = v.replace(/(\d{2})(\d)/, "$1/$2");
    v = v.replace(/(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
    return v;
  };

  const maskSalario = (v: string) => {
    v = v.replace(/\D/g, "");
    if (!v) return "";
    const num = parseInt(v, 10);
    return (num / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleCepChange = async (text: string) => {
    const formatted = maskCep(text);
    setForm((prev) => ({ ...prev, cep: formatted }));

    const cleanCep = formatted.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${cleanCep}/json/`,
        );
        const data = await response.json();
        if (!data.erro) {
          setForm((prev) => ({
            ...prev,
            rua: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf,
          }));
        }
      } catch (e) {
        console.error("Erro ao buscar CEP");
      }
    }
  };

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

  const handleSave = async () => {
    if (
      !form.nome ||
      !form.email ||
      !form.cargo ||
      !form.dataAdmissao ||
      !form.salario
    ) {
      Alert.alert(
        "Erro",
        "Preencha os campos obrigatórios (Nome, Email, Cargo, Admissão, Salário)",
      );
      return;
    }

    try {
      const funcionarioData = {
        nome: form.nome,
        cpf: form.cpf,
        email: form.email,
        telefone: form.telefone,
        endereco: {
          cep: form.cep,
          rua: form.rua,
          numero: form.numero,
          bairro: form.bairro,
          cidade: form.cidade,
          uf: form.estado,
        },
        cargo: form.cargo,
        dataAdmissao: form.dataAdmissao,
        salario: form.salario,
        status: form.status,
        isAdmin: form.isAdmin,
      };

      if (editingFuncionario) {
        await updateDoc(
          doc(db, "funcionarios", editingFuncionario.id),
          funcionarioData,
        );
        Alert.alert("Sucesso", "Funcionário atualizado!");
      } else {
        await addDoc(collection(db, "funcionarios"), funcionarioData);
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
      cpf: "",
      email: "",
      telefone: "",
      cep: "",
      rua: "",
      numero: "",
      bairro: "",
      cidade: "",
      estado: "",
      cargo: "",
      dataAdmissao: "",
      salario: "",
      status: "ativo",
      isAdmin: false,
    });
    setEditingFuncionario(null);
  };

  const handleEdit = (funcionario: any) => {
    setEditingFuncionario(funcionario);
    setForm({
      nome: funcionario.nome || "",
      cpf: funcionario.cpf || "",
      email: funcionario.email || "",
      telefone: funcionario.telefone || "",
      cep: funcionario.endereco?.cep || "",
      rua: funcionario.endereco?.rua || "",
      numero: funcionario.endereco?.numero || "",
      bairro: funcionario.endereco?.bairro || "",
      cidade: funcionario.endereco?.cidade || "",
      estado: funcionario.endereco?.uf || "",
      cargo: funcionario.cargo || "",
      dataAdmissao: funcionario.dataAdmissao || "",
      salario: funcionario.salario || "",
      status: funcionario.status || "ativo",
      isAdmin: funcionario.isAdmin || false,
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Confirmar", "Deseja excluir este funcionário?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "funcionarios", id));
            Alert.alert("Sucesso", "Funcionário removido!");
            if (selectedFuncionario?.id === id) setShowDetailModal(false);
          } catch (error) {
            Alert.alert("Erro", "Falha ao excluir funcionário");
          }
        },
      },
    ]);
  };

  const handleSelectFuncionario = (funcionario: Funcionario) => {
    setSelectedFuncionario(funcionario);
    setShowDetailModal(true);
  };

  let filteredFuncionarios = funcionarios.filter((f) => {
    const matchSearch =
      f.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus =
      statusFilter === "Todos" ||
      (statusFilter === "Ativos" && f.status === "ativo") ||
      (statusFilter === "Inativos" && f.status === "inativo");

    return matchSearch && matchStatus;
  });

  filteredFuncionarios.sort((a, b) => {
    if (ordenacao === "nome_asc")
      return (a.nome || "").localeCompare(b.nome || "");
    return (b.nome || "").localeCompare(a.nome || "");
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

        {/* ── Filtros ── */}
        <View style={localStyles.filtersRow}>
          <View style={localStyles.filterWrap}>
            <TouchableOpacity
              style={[
                localStyles.filterBtn,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => {
                setShowStatusDropdown(!showStatusDropdown);
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
                {statusFilter === "Todos" ? "Status" : statusFilter}
              </Text>
              <Ionicons
                name="chevron-down"
                size={14}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
            {showStatusDropdown && (
              <View
                style={[
                  localStyles.dropdown,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                {STATUS_FUNC.map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      localStyles.dropdownItem,
                      { borderBottomColor: theme.border },
                    ]}
                    onPress={() => {
                      setStatusFilter(st);
                      setShowStatusDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        localStyles.dropdownText,
                        {
                          color:
                            statusFilter === st ? theme.primary : theme.text,
                        },
                      ]}
                    >
                      {st}
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
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => {
                setShowOrdenacaoDropdown(!showOrdenacaoDropdown);
                setShowStatusDropdown(false);
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
                {ORDENACOES_FUNC.find((o) => o.value === ordenacao)?.label}
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
                {ORDENACOES_FUNC.map((ord) => (
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
          <Text style={adminStyles.addButtonText}>Novo Funcionário</Text>
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
            {filteredFuncionarios.length} funcionário(s) encontrado(s)
          </Text>

          {filteredFuncionarios.length > 0 ? (
            filteredFuncionarios.map((funcionario) => (
              <TouchableOpacity
                key={funcionario.id}
                style={[
                  adminStyles.itemCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                activeOpacity={0.7}
                onPress={() => handleSelectFuncionario(funcionario)}
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
                        style={{
                          fontSize: 10,
                          fontWeight: "bold",
                          color:
                            funcionario.status === "ativo"
                              ? "#10b981"
                              : "#ef4444",
                        }}
                      >
                        {funcionario.status === "ativo" ? "ATIVO" : "INATIVO"}
                      </Text>
                    </View>

                    {funcionario.isAdmin && (
                      <View
                        style={{
                          backgroundColor: "#8b5cf620",
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "bold",
                            color: "#8b5cf6",
                          }}
                        >
                          ADMIN
                        </Text>
                      </View>
                    )}
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

                  <View style={{ flexDirection: "row", marginTop: 8 }}>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: theme.primary + "20" },
                      ]}
                    >
                      <Text
                        style={[styles.badgeText, { color: theme.primary }]}
                      >
                        Ver Detalhes
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={adminStyles.itemActions}>
                  <TouchableOpacity
                    style={[
                      adminStyles.actionButton,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEdit(funcionario);
                    }}
                  >
                    <Ionicons name="pencil" size={18} color="#000" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      adminStyles.actionButton,
                      { backgroundColor: theme.error },
                    ]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(funcionario.id);
                    }}
                  >
                    <Ionicons name="trash" size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
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

      {/* ── MODAL DE DETALHES DO FUNCIONÁRIO ── */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
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
              Detalhes do Funcionário
            </Text>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Adicionado paddingHorizontal para não colar nas bordas e Wrapper centralizado */}
          <ScrollView
            style={adminStyles.modalContent}
            contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}
          >
            {selectedFuncionario && (
              <View
                style={{ width: "100%", maxWidth: 480, alignSelf: "center" }}
              >
                {/* DADOS PESSOAIS */}
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
                      Dados Pessoais
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.text }]}>
                      Nome:
                    </Text>
                    <Text
                      style={[styles.infoValue, { color: theme.textSecondary }]}
                    >
                      {selectedFuncionario.nome}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.text }]}>
                      CPF:
                    </Text>
                    <Text
                      style={[styles.infoValue, { color: theme.textSecondary }]}
                    >
                      {selectedFuncionario.cpf || "Não informado"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.text }]}>
                      E-mail:
                    </Text>
                    <Text
                      style={[styles.infoValue, { color: theme.textSecondary }]}
                    >
                      {selectedFuncionario.email}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.text }]}>
                      Telefone:
                    </Text>
                    <Text
                      style={[styles.infoValue, { color: theme.textSecondary }]}
                    >
                      {selectedFuncionario.telefone || "Não informado"}
                    </Text>
                  </View>
                </View>

                {/* ENDEREÇO */}
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
                      name="location-outline"
                      size={18}
                      color={theme.primary}
                    />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>
                      Endereço
                    </Text>
                  </View>
                  {selectedFuncionario.endereco?.rua ? (
                    <>
                      <Text
                        style={{
                          color: theme.textSecondary,
                          marginBottom: 6,
                          fontSize: 13,
                        }}
                      >
                        {selectedFuncionario.endereco.rua},{" "}
                        {selectedFuncionario.endereco.numero || "S/N"} -{" "}
                        {selectedFuncionario.endereco.bairro}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text
                          style={{ color: theme.textSecondary, fontSize: 12 }}
                        >
                          <Text
                            style={{ fontWeight: "600", color: theme.text }}
                          >
                            Cidade:{" "}
                          </Text>
                          {selectedFuncionario.endereco.cidade} /{" "}
                          {selectedFuncionario.endereco.uf}
                        </Text>
                        <Text
                          style={{ color: theme.textSecondary, fontSize: 12 }}
                        >
                          <Text
                            style={{ fontWeight: "600", color: theme.text }}
                          >
                            CEP:{" "}
                          </Text>
                          {selectedFuncionario.endereco.cep}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                      Endereço não cadastrado detalhadamente.
                    </Text>
                  )}
                </View>

                {/* INFORMAÇÕES PROFISSIONAIS */}
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
                      name="briefcase-outline"
                      size={18}
                      color={theme.primary}
                    />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>
                      Informações Profissionais
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.text }]}>
                      Cargo:
                    </Text>
                    <Text
                      style={[styles.infoValue, { color: theme.textSecondary }]}
                    >
                      {selectedFuncionario.cargo}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.text }]}>
                      Admissão:
                    </Text>
                    <Text
                      style={[styles.infoValue, { color: theme.textSecondary }]}
                    >
                      {selectedFuncionario.dataAdmissao}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.text }]}>
                      Salário:
                    </Text>
                    <Text
                      style={[styles.infoValue, { color: theme.textSecondary }]}
                    >
                      R$ {selectedFuncionario.salario}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.text }]}>
                      Status:
                    </Text>
                    <Text
                      style={[
                        styles.infoValue,
                        {
                          color:
                            selectedFuncionario.status === "ativo"
                              ? "#10b981"
                              : "#ef4444",
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {(selectedFuncionario.status || "Ativo").toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.text }]}>
                      Acesso:
                    </Text>
                    <Text
                      style={[
                        styles.infoValue,
                        {
                          color: selectedFuncionario.isAdmin
                            ? "#8b5cf6"
                            : theme.textSecondary,
                          fontWeight: selectedFuncionario.isAdmin
                            ? "700"
                            : "400",
                        },
                      ]}
                    >
                      {selectedFuncionario.isAdmin ? "ADMINISTRADOR" : "PADRÃO"}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    adminStyles.submitButton,
                    { backgroundColor: theme.primary, marginTop: 4 },
                  ]}
                  onPress={() => {
                    setShowDetailModal(false);
                    handleEdit(selectedFuncionario);
                  }}
                >
                  <Text
                    style={[adminStyles.submitButtonText, { fontSize: 14 }]}
                  >
                    Editar Funcionário
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── MODAL DE ADICIONAR / EDITAR FUNCIONÁRIO ── */}
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

          {/* Form modal também centralizado e com limite de largura */}
          <ScrollView
            style={adminStyles.modalContent}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          >
            <View
              style={[
                adminStyles.modalForm,
                { width: "100%", maxWidth: 480, alignSelf: "center" },
              ]}
            >
              <Text
                style={[
                  adminStyles.sectionTitle,
                  { color: theme.primary, marginBottom: 15 },
                ]}
              >
                Informações Pessoais
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
                placeholder="Nome Completo *"
                placeholderTextColor={theme.textSecondary}
                value={form.nome}
                onChangeText={(text) => setForm({ ...form, nome: text })}
              />

              <TextInput
                style={[
                  adminStyles.input,
                  {
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="CPF"
                placeholderTextColor={theme.textSecondary}
                value={form.cpf}
                onChangeText={(t) => setForm({ ...form, cpf: maskCpf(t) })}
                keyboardType="numeric"
                maxLength={14}
              />

              <TextInput
                style={[
                  adminStyles.input,
                  {
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Telefone / Celular"
                placeholderTextColor={theme.textSecondary}
                value={form.telefone}
                onChangeText={(t) =>
                  setForm({ ...form, telefone: maskPhone(t) })
                }
                keyboardType="phone-pad"
                maxLength={15}
              />

              <TextInput
                style={[
                  adminStyles.input,
                  {
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="E-mail *"
                placeholderTextColor={theme.textSecondary}
                value={form.email}
                onChangeText={(text) => setForm({ ...form, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* ENDEREÇO */}
              <View style={styles.divider} />
              <Text
                style={[
                  adminStyles.sectionTitle,
                  { color: theme.primary, marginVertical: 15 },
                ]}
              >
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
                placeholder="CEP"
                placeholderTextColor={theme.textSecondary}
                value={form.cep}
                onChangeText={handleCepChange}
                keyboardType="numeric"
                maxLength={9}
              />

              <TextInput
                style={[
                  adminStyles.input,
                  {
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Rua"
                placeholderTextColor={theme.textSecondary}
                value={form.rua}
                onChangeText={(text) => setForm({ ...form, rua: text })}
              />

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TextInput
                  style={[
                    adminStyles.input,
                    {
                      flex: 1,
                      backgroundColor: theme.surface,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder="Nº"
                  placeholderTextColor={theme.textSecondary}
                  value={form.numero}
                  onChangeText={(text) => setForm({ ...form, numero: text })}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[
                    adminStyles.input,
                    {
                      flex: 2,
                      backgroundColor: theme.surface,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder="Bairro"
                  placeholderTextColor={theme.textSecondary}
                  value={form.bairro}
                  onChangeText={(text) => setForm({ ...form, bairro: text })}
                />
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TextInput
                  style={[
                    adminStyles.input,
                    {
                      flex: 3,
                      backgroundColor: theme.surface,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder="Cidade"
                  placeholderTextColor={theme.textSecondary}
                  value={form.cidade}
                  onChangeText={(text) => setForm({ ...form, cidade: text })}
                />
                <TextInput
                  style={[
                    adminStyles.input,
                    {
                      flex: 1,
                      backgroundColor: theme.surface,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder="UF"
                  placeholderTextColor={theme.textSecondary}
                  value={form.estado}
                  onChangeText={(text) => setForm({ ...form, estado: text })}
                  maxLength={2}
                />
              </View>

              <View style={styles.divider} />
              <Text
                style={[
                  adminStyles.sectionTitle,
                  { color: theme.primary, marginVertical: 15 },
                ]}
              >
                Informações Profissionais
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
                placeholder="Cargo *"
                placeholderTextColor={theme.textSecondary}
                value={form.cargo}
                onChangeText={(text) => setForm({ ...form, cargo: text })}
              />

              <TextInput
                style={[
                  adminStyles.input,
                  {
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Data de Admissão (DD/MM/AAAA) *"
                placeholderTextColor={theme.textSecondary}
                value={form.dataAdmissao}
                onChangeText={(text) =>
                  setForm({ ...form, dataAdmissao: maskDate(text) })
                }
                keyboardType="numeric"
                maxLength={10}
              />

              <TextInput
                style={[
                  adminStyles.input,
                  {
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Salário *"
                placeholderTextColor={theme.textSecondary}
                value={form.salario}
                onChangeText={(text) =>
                  setForm({ ...form, salario: maskSalario(text) })
                }
                keyboardType="numeric"
              />

              <Text
                style={[
                  adminStyles.label,
                  { color: theme.text, marginTop: 10 },
                ]}
              >
                Nível de Acesso
              </Text>
              <View style={[adminStyles.typeSelector, { marginBottom: 16 }]}>
                <TouchableOpacity
                  style={[
                    adminStyles.typeButton,
                    {
                      backgroundColor: !form.isAdmin
                        ? theme.primary
                        : theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => setForm({ ...form, isAdmin: false })}
                >
                  <Text
                    style={[
                      adminStyles.typeButtonText,
                      { color: !form.isAdmin ? "#000" : theme.text },
                    ]}
                  >
                    Padrão
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    adminStyles.typeButton,
                    {
                      backgroundColor: form.isAdmin
                        ? theme.primary
                        : theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => setForm({ ...form, isAdmin: true })}
                >
                  <Text
                    style={[
                      adminStyles.typeButtonText,
                      { color: form.isAdmin ? "#000" : theme.text },
                    ]}
                  >
                    Administrador
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[adminStyles.label, { color: theme.text }]}>
                Status do Funcionário
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
                  { backgroundColor: theme.primary, marginTop: 30 },
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

// ── ESTILOS ATUALIZADOS (MAIS COMPACTOS) ──
const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#00000010",
    paddingBottom: 6,
  },
  cardTitle: { fontSize: 14, fontWeight: "700" },
  infoRow: { flexDirection: "row", marginBottom: 6, alignItems: "flex-start" },
  infoLabel: { fontWeight: "600", width: 80, fontSize: 13 },
  infoValue: { flex: 1, fontSize: 13, lineHeight: 18 },
  divider: {
    height: 1,
    width: "100%",
    backgroundColor: "#ccc",
    marginVertical: 10,
    opacity: 0.3,
  },
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
