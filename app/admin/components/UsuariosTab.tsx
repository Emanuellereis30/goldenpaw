import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
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
import { Usuario } from "../types/admin.types";

const ORDENACOES = [
  { label: "Mais Recentes", value: "data_desc" },
  { label: "Mais Antigos", value: "data_asc" },
  { label: "A-Z", value: "nome_asc" },
  { label: "Z-A", value: "nome_desc" },
];

export default function UsuariosTab() {
  const { theme } = useAppTheme();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [ordenacao, setOrdenacao] = useState("data_desc");
  const [showOrdenacaoDropdown, setShowOrdenacaoDropdown] = useState(false);

  const [userPedidos, setUserPedidos] = useState<any[]>([]);
  const [userAdocoes, setUserAdocoes] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "usuarios"), (snapshot) => {
      const docs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Usuario[];
      setUsuarios(docs);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedUsuario) return;

    const qPedidos = query(
      collection(db, "pedidos"),
      where("userId", "==", selectedUsuario.id),
    );
    const unsubPedidos = onSnapshot(qPedidos, (snapshot) => {
      const pedidos = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUserPedidos(pedidos.reverse());
    });

    const qAdocoes = query(
      collection(db, "requisicoes_adocao"),
      where("email", "==", selectedUsuario.email),
    );
    const unsubAdocoes = onSnapshot(qAdocoes, (snapshot) => {
      setUserAdocoes(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubPedidos();
      unsubAdocoes();
    };
  }, [selectedUsuario]);

  const handleDeleteUsuario = (id: string) => {
    Alert.alert(
      "Confirmar",
      "Deseja realmente excluir este usuário? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "usuarios", id));
              Alert.alert("Sucesso", "Usuário removido com sucesso!");
              if (selectedUsuario?.id === id) setShowDetailModal(false);
            } catch (error) {
              Alert.alert("Erro", "Falha ao excluir o usuário.");
            }
          },
        },
      ],
    );
  };

  // ── Lógica Reforçada de Filtragem ──
  let filteredUsuarios = usuarios.filter((u) => {
    const nomeVal = String(u.nome || "").toLowerCase();
    const emailVal = String(u.email || "").toLowerCase();
    const queryVal = searchQuery.toLowerCase();
    return nomeVal.includes(queryVal) || emailVal.includes(queryVal);
  });

  // ── Lógica Reforçada de Ordenação (Proteção contra Timestamps do Firebase) ──
  filteredUsuarios.sort((a, b) => {
    if (ordenacao === "nome_asc")
      return String(a.nome || "").localeCompare(String(b.nome || ""));
    if (ordenacao === "nome_desc")
      return String(b.nome || "").localeCompare(String(a.nome || ""));

    // Função super segura para extrair a data, seja Firebase Timestamp, String ou Número
    const obterTempo = (valor: any) => {
      if (!valor) return 0;
      if (typeof valor.toDate === "function") return valor.toDate().getTime(); // Se for Timestamp
      if (typeof valor === "number") return valor; // Se for milissegundos
      const tempo = new Date(valor).getTime();
      return isNaN(tempo) ? 0 : tempo;
    };

    const dataA = obterTempo((a as any).criadoEm || (a as any).dataCadastro);
    const dataB = obterTempo((b as any).criadoEm || (b as any).dataCadastro);

    if (ordenacao === "data_desc") return dataB - dataA;
    return dataA - dataB;
  });

  const handleSelectUsuario = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setShowDetailModal(true);
  };

  const formatarEndereco = (end: any) => {
    if (!end) return "Endereço não informado";
    if (typeof end === "string") return end;
    return `${end.rua || ""}, ${end.numero || "S/N"} - ${end.bairro || ""}`;
  };

  const getCidade = (user: any) =>
    user?.endereco?.cidade || user?.cidade || "Não informada";
  const getEstado = (user: any) => user?.endereco?.uf || user?.estado || "N/A";
  const getCep = (user: any) =>
    user?.endereco?.cep || user?.cep || "Não informado";

  const exibirData = (valorData: any) => {
    if (!valorData) return "N/A";
    if (typeof valorData.toDate === "function")
      return valorData.toDate().toLocaleDateString("pt-BR");
    const data = new Date(valorData);
    return isNaN(data.getTime()) ? "N/A" : data.toLocaleDateString("pt-BR");
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
            placeholder="Pesquisar por nome ou email..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={localStyles.filtersRow}>
          <View style={localStyles.filterWrap}>
            <TouchableOpacity
              style={[
                localStyles.filterBtn,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => setShowOrdenacaoDropdown(!showOrdenacaoDropdown)}
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
                {ORDENACOES.find((o) => o.value === ordenacao)?.label}
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
            {filteredUsuarios.length} utilizador(es) encontrado(s)
          </Text>

          {filteredUsuarios.length > 0 ? (
            filteredUsuarios.map((usuario) => (
              <TouchableOpacity
                key={usuario.id}
                style={[
                  adminStyles.itemCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={() => handleSelectUsuario(usuario)}
                activeOpacity={0.7}
              >
                <View style={adminStyles.itemInfo}>
                  <Text style={[adminStyles.itemName, { color: theme.text }]}>
                    {usuario.nome}
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {usuario.email}
                  </Text>
                  <Text
                    style={[
                      adminStyles.itemDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {usuario.telefone || "Telefone não cadastrado"}
                  </Text>

                  {((usuario as any).criadoEm ||
                    (usuario as any).dataCadastro) && (
                    <Text
                      style={{
                        fontSize: 11,
                        color: theme.textSecondary,
                        marginTop: 4,
                        fontStyle: "italic",
                      }}
                    >
                      Registrado em:{" "}
                      {exibirData(
                        (usuario as any).criadoEm ||
                          (usuario as any).dataCadastro,
                      )}
                    </Text>
                  )}

                  <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
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

                {/* ── Botão Excluir Direto na Lista ── */}
                <View style={adminStyles.itemActions}>
                  <TouchableOpacity
                    style={[
                      adminStyles.actionButton,
                      { backgroundColor: theme.error },
                    ]}
                    onPress={(e) => {
                      e.stopPropagation(); // Impede que abra o modal ao clicar em excluir
                      handleDeleteUsuario(usuario.id);
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
              Nenhum usuário encontrado
            </Text>
          )}
        </ScrollView>
      </View>

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
              Detalhes do Cliente
            </Text>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={adminStyles.modalContent}
            contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}
          >
            {selectedUsuario && (
              <View
                style={{ width: "100%", maxWidth: 480, alignSelf: "center" }}
              >
                {/* INFORMAÇÕES PESSOAIS */}
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
                      Dados Cadastrais
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.text }]}>
                      Nome:
                    </Text>
                    <Text
                      style={[styles.infoValue, { color: theme.textSecondary }]}
                    >
                      {selectedUsuario.nome}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.text }]}>
                      E-mail:
                    </Text>
                    <Text
                      style={[styles.infoValue, { color: theme.textSecondary }]}
                    >
                      {selectedUsuario.email}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.text }]}>
                      Telefone:
                    </Text>
                    <Text
                      style={[styles.infoValue, { color: theme.textSecondary }]}
                    >
                      {selectedUsuario.telefone || "Não informado"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.text }]}>
                      CPF:
                    </Text>
                    <Text
                      style={[styles.infoValue, { color: theme.textSecondary }]}
                    >
                      {selectedUsuario.cpf || "Não informado"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.text }]}>
                      Cadastro:
                    </Text>
                    <Text
                      style={[styles.infoValue, { color: theme.textSecondary }]}
                    >
                      {exibirData(
                        (selectedUsuario as any).criadoEm ||
                          (selectedUsuario as any).dataCadastro,
                      )}
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
                      Endereço do Usuário
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: theme.textSecondary,
                      marginBottom: 6,
                      fontSize: 13,
                    }}
                  >
                    {formatarEndereco(selectedUsuario.endereco)}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                      <Text style={{ fontWeight: "600", color: theme.text }}>
                        Cidade:{" "}
                      </Text>
                      {getCidade(selectedUsuario)} /{" "}
                      {getEstado(selectedUsuario)}
                    </Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                      <Text style={{ fontWeight: "600", color: theme.text }}>
                        CEP:{" "}
                      </Text>
                      {getCep(selectedUsuario)}
                    </Text>
                  </View>
                </View>

                {/* PEDIDOS REALIZADOS */}
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
                      name="bag-handle-outline"
                      size={18}
                      color={theme.primary}
                    />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>
                      Pedidos ({userPedidos.length})
                    </Text>
                  </View>
                  {userPedidos.length > 0 ? (
                    userPedidos.map((pedido, index) => (
                      <View
                        key={pedido.id}
                        style={[
                          styles.listItem,
                          {
                            borderBottomColor: theme.border,
                            borderBottomWidth:
                              index === userPedidos.length - 1 ? 0 : 1,
                          },
                        ]}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginBottom: 2,
                          }}
                        >
                          <Text
                            style={{
                              color: theme.text,
                              fontWeight: "700",
                              fontSize: 13,
                            }}
                          >
                            #{pedido.id.substring(0, 8)}
                          </Text>
                          <Text
                            style={{
                              color: theme.primary,
                              fontWeight: "700",
                              fontSize: 13,
                            }}
                          >
                            R$ {pedido.total || "0,00"}
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
                            style={{ color: theme.textSecondary, fontSize: 11 }}
                          >
                            {pedido.data || "--"} às {pedido.horario || "--:--"}
                          </Text>
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "800",
                              color:
                                pedido.status === "cancelado"
                                  ? "#ef4444"
                                  : pedido.status === "entregue"
                                    ? "#10b981"
                                    : theme.primary,
                            }}
                          >
                            {(pedido.status || "pendente").toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text
                      style={{
                        color: theme.textSecondary,
                        fontStyle: "italic",
                        fontSize: 13,
                      }}
                    >
                      Nenhuma compra realizada.
                    </Text>
                  )}
                </View>

                {/* ADOÇÕES REALIZADAS */}
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
                      name="heart-outline"
                      size={18}
                      color={theme.primary}
                    />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>
                      Adoções ({userAdocoes.length})
                    </Text>
                  </View>
                  {userAdocoes.length > 0 ? (
                    userAdocoes.map((adocao, index) => (
                      <View
                        key={adocao.id}
                        style={[
                          styles.listItem,
                          {
                            borderBottomColor: theme.border,
                            borderBottomWidth:
                              index === userAdocoes.length - 1 ? 0 : 1,
                          },
                        ]}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginBottom: 2,
                          }}
                        >
                          <Text
                            style={{
                              color: theme.text,
                              fontWeight: "700",
                              fontSize: 13,
                            }}
                          >
                            {adocao.petNome}
                          </Text>
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "800",
                              color:
                                adocao.status === "rejeitado"
                                  ? "#ef4444"
                                  : adocao.status === "aprovado"
                                    ? "#10b981"
                                    : theme.primary,
                            }}
                          >
                            {(adocao.status || "pendente").toUpperCase()}
                          </Text>
                        </View>
                        <Text
                          style={{ color: theme.textSecondary, fontSize: 11 }}
                        >
                          {adocao.petRaca} • {adocao.petPorte}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text
                      style={{
                        color: theme.textSecondary,
                        fontStyle: "italic",
                        fontSize: 13,
                      }}
                    >
                      Sem registros de adoção.
                    </Text>
                  )}
                </View>

                {/* PETS CADASTRADOS */}
                {selectedUsuario.pets && selectedUsuario.pets.length > 0 && (
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
                        Pets Cadastrados ({selectedUsuario.pets.length})
                      </Text>
                    </View>
                    {selectedUsuario.pets.map((pet, index) => (
                      <View
                        key={index}
                        style={[
                          styles.listItem,
                          {
                            borderBottomColor: theme.border,
                            borderBottomWidth:
                              index === selectedUsuario.pets.length - 1 ? 0 : 1,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: theme.text,
                            fontWeight: "700",
                            marginBottom: 2,
                            fontSize: 13,
                          }}
                        >
                          {pet.nome}
                        </Text>
                        <Text
                          style={{ color: theme.textSecondary, fontSize: 11 }}
                        >
                          {pet.tipo} • {pet.raca} • {pet.idade} anos
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Total Gasto */}
                <View
                  style={[
                    styles.totalCard,
                    {
                      backgroundColor: theme.primary + "10",
                      borderColor: theme.primary,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: theme.text,
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    Total em Compras
                  </Text>
                  <Text
                    style={{
                      color: theme.primary,
                      fontSize: 20,
                      fontWeight: "900",
                    }}
                  >
                    R${" "}
                    {userPedidos
                      .reduce(
                        (acc, p) =>
                          acc + parseFloat(p.total?.replace(",", ".") || 0),
                        0,
                      )
                      .toFixed(2)
                      .replace(".", ",")}
                  </Text>
                </View>

                {/* ── Botão Excluir Usuário no final do modal ── */}
                <TouchableOpacity
                  style={[
                    adminStyles.submitButton,
                    { backgroundColor: theme.error, marginTop: 4 },
                  ]}
                  onPress={() => handleDeleteUsuario(selectedUsuario.id)}
                >
                  <Text
                    style={[adminStyles.submitButtonText, { fontSize: 14 }]}
                  >
                    Excluir Usuário
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

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
  infoLabel: { fontWeight: "600", width: 75, fontSize: 13 },
  infoValue: { flex: 1, fontSize: 13, lineHeight: 18 },
  listItem: { paddingVertical: 8 },
  totalCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
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
