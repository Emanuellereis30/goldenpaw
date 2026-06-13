// app/admin/components/PedidosTab.tsx
import { useNotification } from "@/contexts/NotificationContext";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { Pedido } from "../types/admin.types";

const statusColors: Record<string, string> = {
  pendente: "#f59e0b",
  confirmado: "#3b82f6",
  enviado: "#8b5cf6",
  entregue: "#10b981",
  cancelado: "#ef4444",
};

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const STATUS_FILTRO = [
  "Todos",
  "pendente",
  "confirmado",
  "enviado",
  "entregue",
  "cancelado",
];
const ORDENACOES = [
  { label: "Mais Recentes", value: "data_desc" },
  { label: "Mais Antigos", value: "data_asc" },
  { label: "A-Z (Cliente)", value: "nome_asc" },
];

export default function PedidosTab() {
  const { theme } = useAppTheme();
  const { showNotification } = useNotification();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Estado para o Modal de Exclusão
  const [pedidoToDelete, setPedidoToDelete] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("Todos");
  const [ordenacao, setOrdenacao] = useState("data_desc");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showOrdenacaoDropdown, setShowOrdenacaoDropdown] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "pedidos"), (snapshot) => {
      const docs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Pedido[];

      setPedidos(docs.reverse());
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const onUpdateStatus = async (id: string, status: Pedido["status"]) => {
    await updateDoc(doc(db, "pedidos", id), { status });
  };

  const onDeletePedido = async (id: string) => {
    await deleteDoc(doc(db, "pedidos", id));
  };

  let filteredPedidos = pedidos.filter((p) => {
    const matchSearch =
      (p?.clienteNome || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (p?.id || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus =
      statusFilter === "Todos" || (p?.status || "pendente") === statusFilter;
    return matchSearch && matchStatus;
  });

  filteredPedidos.sort((a, b) => {
    if (ordenacao === "nome_asc")
      return (a.clienteNome || "").localeCompare(b.clienteNome || "");
    const parseDate = (p: any) => {
      try {
        const [d, m, y] = (p.data || "01/01/2000").split("/");
        const [h, min] = (p.horario || "00:00").split(":");
        return new Date(+y, +m - 1, +d, +h, +min).getTime();
      } catch {
        return 0;
      }
    };
    const diff = parseDate(a) - parseDate(b);
    return ordenacao === "data_desc" ? -diff : diff;
  });

  const handleSelectPedido = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setShowDetailModal(true);
  };

  const handleStatusChange = async (newStatus: Pedido["status"]) => {
    if (!selectedPedido) return;
    try {
      await onUpdateStatus(selectedPedido.id, newStatus);
      showNotification("Sucesso", "Status atualizado!", "success");
      setShowStatusModal(false);
      setShowDetailModal(false);
    } catch (error) {
      showNotification("Erro", "Falha ao atualizar status", "error");
    }
  };

  const confirmDeletePedido = async () => {
    if (!pedidoToDelete) return;
    try {
      await onDeletePedido(pedidoToDelete);
      showNotification("Sucesso", "Pedido removido!", "success");
      setShowDetailModal(false);
    } catch (error) {
      showNotification("Erro", "Falha ao excluir pedido", "error");
    } finally {
      setPedidoToDelete(null);
    }
  };

  const formatarMetodoPagamento = (pedido: Pedido) => {
    let formPagamento = pedido.metodoPagamento || "Não informado";
    if (formPagamento === "card" || formPagamento === "credito")
      formPagamento = "Cartão de Crédito";
    else if (formPagamento === "debito") formPagamento = "Cartão de Débito";
    else if (formPagamento === "pix") formPagamento = "PIX";
    else if (formPagamento === "boleto") formPagamento = "Boleto";

    if (pedido.parcelas && pedido.parcelas > 1) {
      formPagamento += ` em ${pedido.parcelas}x`;
    } else if (formPagamento === "Cartão de Crédito") {
      formPagamento += " à vista";
    }

    return formPagamento;
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
            placeholder="Pesquisar por cliente ou ID..."
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
                {statusFilter === "Todos"
                  ? "Status"
                  : statusLabels[statusFilter]}
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
                {STATUS_FILTRO.map((st) => (
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
                      {st === "Todos" ? "Todos os Status" : statusLabels[st]}
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
            {filteredPedidos.length} pedido(s) encontrado(s)
          </Text>
          {filteredPedidos.length > 0 ? (
            filteredPedidos.map((pedido) => {
              const status = pedido?.status || "pendente";
              const itens = pedido?.itens || [];

              return (
                <TouchableOpacity
                  key={pedido.id}
                  style={[
                    adminStyles.itemCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => handleSelectPedido(pedido)}
                  activeOpacity={0.7}
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
                          { color: theme.text, flex: 1 },
                        ]}
                        numberOfLines={1}
                      >
                        {pedido.clienteNome || "Não informado"}
                      </Text>
                      <View
                        style={{
                          backgroundColor: statusColors[status] + "20",
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: statusColors[status],
                        }}
                      >
                        <Text
                          style={{
                            color: statusColors[status],
                            fontSize: 10,
                            fontWeight: "bold",
                          }}
                        >
                          {statusLabels[status].toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        adminStyles.itemDetail,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {pedido.data || "--"} às {pedido.horario || "--:--"}
                    </Text>
                    <Text
                      style={[
                        adminStyles.itemDetail,
                        {
                          color: theme.primary,
                          fontWeight: "600",
                          marginTop: 4,
                        },
                      ]}
                    >
                      {itens.length} item(ns) • R$ {pedido.total || "0,00"}
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
              Nenhum pedido encontrado
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
              Detalhes do Pedido
            </Text>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={adminStyles.modalContent}
            contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}
          >
            {selectedPedido && (
              <View
                style={{ width: "100%", maxWidth: 480, alignSelf: "center" }}
              >
                <View
                  style={[
                    styles.statusBanner,
                    {
                      backgroundColor:
                        statusColors[selectedPedido.status || "pendente"] +
                        "15",
                      borderColor:
                        statusColors[selectedPedido.status || "pendente"],
                    },
                  ]}
                >
                  <View>
                    <Text
                      style={{
                        color: theme.textSecondary,
                        fontSize: 11,
                        marginBottom: 2,
                      }}
                    >
                      Status Atual
                    </Text>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "800",
                        color:
                          statusColors[selectedPedido.status || "pendente"],
                      }}
                    >
                      {statusLabels[
                        selectedPedido.status || "pendente"
                      ].toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={{
                        color: theme.textSecondary,
                        fontSize: 11,
                        marginBottom: 2,
                      }}
                    >
                      ID do Pedido
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: theme.text,
                        fontFamily: "monospace",
                      }}
                    >
                      {selectedPedido.id.substring(0, 8).toUpperCase()}...
                    </Text>
                  </View>
                </View>

                {/* Card do Cliente */}
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
                      Informações do Cliente
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.text }]}>
                      Nome:
                    </Text>
                    <Text
                      style={[styles.infoValue, { color: theme.textSecondary }]}
                    >
                      {selectedPedido.clienteNome || "Não informado"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.text }]}>
                      E-mail:
                    </Text>
                    <Text
                      style={[styles.infoValue, { color: theme.textSecondary }]}
                    >
                      {selectedPedido.clienteEmail || "Não informado"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.text }]}>
                      Telefone:
                    </Text>
                    <Text
                      style={[styles.infoValue, { color: theme.textSecondary }]}
                    >
                      {selectedPedido.clienteTelefone || "Não informado"}
                    </Text>
                  </View>
                </View>

                {/* Card de Entrega */}
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
                      Endereço de Entrega
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: theme.textSecondary,
                      lineHeight: 20,
                      fontSize: 13,
                    }}
                  >
                    {selectedPedido.endereco || "Endereço não fornecido"}
                  </Text>
                </View>

                {/* Card de Compra */}
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
                      name="receipt-outline"
                      size={18}
                      color={theme.primary}
                    />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>
                      Detalhes da Compra
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.text }]}>
                      Data:
                    </Text>
                    <Text
                      style={[styles.infoValue, { color: theme.textSecondary }]}
                    >
                      {selectedPedido.data} às {selectedPedido.horario}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.text }]}>
                      Pagamento:
                    </Text>
                    <Text
                      style={[styles.infoValue, { color: theme.textSecondary }]}
                    >
                      {formatarMetodoPagamento(selectedPedido)}
                    </Text>
                  </View>
                </View>

                {/* Lista de Itens */}
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
                      name="cart-outline"
                      size={18}
                      color={theme.primary}
                    />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>
                      Itens do Pedido ({(selectedPedido.itens || []).length})
                    </Text>
                  </View>

                  {(selectedPedido.itens || []).map((item, index) => (
                    <View
                      key={index}
                      style={[
                        styles.itemRow,
                        {
                          borderBottomColor: theme.border,
                          borderBottomWidth:
                            index === selectedPedido.itens.length - 1 ? 0 : 1,
                        },
                      ]}
                    >
                      <View style={styles.itemQtyBadge}>
                        <Text
                          style={{
                            color: "#FFF",
                            fontWeight: "bold",
                            fontSize: 11,
                          }}
                        >
                          {item.quantidade}x
                        </Text>
                      </View>
                      <View style={{ flex: 1, paddingHorizontal: 10 }}>
                        <Text
                          style={{
                            color: theme.text,
                            fontWeight: "600",
                            fontSize: 13,
                          }}
                        >
                          {item.produtoNome}
                        </Text>
                        <Text
                          style={{
                            color: theme.textSecondary,
                            fontSize: 11,
                            marginTop: 2,
                          }}
                        >
                          Unidade: R$ {item.preco}
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: theme.primary,
                          fontWeight: "700",
                          fontSize: 13,
                        }}
                      >
                        R${" "}
                        {(
                          parseFloat(item.preco.replace(",", ".")) *
                          item.quantidade
                        )
                          .toFixed(2)
                          .replace(".", ",")}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Resumo Total */}
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
                    Valor Total
                  </Text>
                  <Text
                    style={{
                      color: theme.primary,
                      fontSize: 20,
                      fontWeight: "900",
                    }}
                  >
                    R$ {selectedPedido.total || "0,00"}
                  </Text>
                </View>

                {/* AÇÕES: Botões lado a lado */}
                <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
                  <TouchableOpacity
                    style={[
                      adminStyles.submitButton,
                      { backgroundColor: theme.primary, flex: 1 },
                    ]}
                    onPress={() => setShowStatusModal(true)}
                  >
                    <Text
                      style={[adminStyles.submitButtonText, { fontSize: 14 }]}
                    >
                      Alterar Status
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      adminStyles.submitButton,
                      { backgroundColor: theme.error, flex: 1 },
                    ]}
                    onPress={() => setPedidoToDelete(selectedPedido.id)}
                  >
                    <Text
                      style={[adminStyles.submitButtonText, { fontSize: 14 }]}
                    >
                      Excluir Pedido
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={showStatusModal} animationType="fade" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 16,
              padding: 24,
              width: "100%",
              maxWidth: 400,
            }}
          >
            <Text
              style={[
                adminStyles.modalTitle,
                { color: theme.text, marginBottom: 20, textAlign: "center" },
              ]}
            >
              Selecione o Novo Status
            </Text>

            {(
              [
                "pendente",
                "confirmado",
                "enviado",
                "entregue",
                "cancelado",
              ] as Pedido["status"][]
            ).map((status) => (
              <TouchableOpacity
                key={status}
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 10,
                  marginBottom: 10,
                  backgroundColor:
                    selectedPedido?.status === status
                      ? statusColors[status]
                      : statusColors[status] + "15",
                  borderWidth: 1,
                  borderColor: statusColors[status],
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
                onPress={() => handleStatusChange(status)}
              >
                <Text
                  style={{
                    color:
                      selectedPedido?.status === status
                        ? "#FFF"
                        : statusColors[status],
                    fontWeight: "700",
                    fontSize: 15,
                  }}
                >
                  {statusLabels[status]}
                </Text>
                {selectedPedido?.status === status && (
                  <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[
                adminStyles.submitButton,
                {
                  backgroundColor: "transparent",
                  borderWidth: 1,
                  borderColor: theme.border,
                  marginTop: 12,
                },
              ]}
              onPress={() => setShowStatusModal(false)}
            >
              <Text
                style={[adminStyles.submitButtonText, { color: theme.text }]}
              >
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE PEDIDO ── */}
      <Modal visible={!!pedidoToDelete} transparent animationType="fade">
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
              Confirmar Exclusão
            </Text>
            <Text
              style={[
                modalConfirmStyles.subtitle,
                { color: theme.textSecondary },
              ]}
            >
              Deseja realmente excluir este pedido? Esta ação não pode ser
              desfeita.
            </Text>
            <View style={modalConfirmStyles.btnRow}>
              <TouchableOpacity
                style={[modalConfirmStyles.btn, { borderColor: theme.border }]}
                onPress={() => setPedidoToDelete(null)}
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
                onPress={confirmDeletePedido}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>
                  Excluir
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  statusBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
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
  itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  itemQtyBadge: {
    backgroundColor: "#3b82f6",
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
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
