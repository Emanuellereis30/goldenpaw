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

export default function PedidosTab() {
  const { theme } = useAppTheme();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

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

  const filteredPedidos = pedidos.filter(
    (p) =>
      (p?.clienteNome || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (p?.id || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelectPedido = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setShowDetailModal(true);
  };

  const handleStatusChange = async (newStatus: Pedido["status"]) => {
    if (!selectedPedido) return;
    try {
      await onUpdateStatus(selectedPedido.id, newStatus);
      Alert.alert("Sucesso", "Status atualizado!");
      setShowStatusModal(false);
      setShowDetailModal(false);
    } catch (error) {
      Alert.alert("Erro", "Falha ao atualizar status");
    }
  };

  const handleDeletePedido = (id: string) => {
    Alert.alert("Confirmar", "Deseja excluir este pedido?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await onDeletePedido(id);
            Alert.alert("Sucesso", "Pedido removido!");
            setShowDetailModal(false);
          } catch (error) {
            Alert.alert("Erro", "Falha ao excluir pedido");
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

  // --- Função de Formatação do Pagamento ---
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

        <ScrollView showsVerticalScrollIndicator={false}>
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
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {selectedPedido && (
              <View>
                {/* Banner de Status Mais Compacto */}
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
                        fontSize: 16,
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
                      size={22}
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
                      size={22}
                      color={theme.primary}
                    />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>
                      Endereço de Entrega
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: theme.textSecondary,
                      lineHeight: 22,
                      fontSize: 14,
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
                      size={22}
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
                      size={22}
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
                            fontSize: 12,
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
                            fontSize: 14,
                          }}
                        >
                          {item.produtoNome}
                        </Text>
                        <Text
                          style={{
                            color: theme.textSecondary,
                            fontSize: 12,
                            marginTop: 2,
                          }}
                        >
                          Unidade: R$ {item.preco}
                        </Text>
                      </View>
                      <Text style={{ color: theme.primary, fontWeight: "700" }}>
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

                {/* Resumo Total Mais Compacto */}
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
                      style={[adminStyles.submitButtonText, { fontSize: 15 }]}
                    >
                      Alterar Status
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      adminStyles.submitButton,
                      { backgroundColor: theme.error, flex: 1 },
                    ]}
                    onPress={() => handleDeletePedido(selectedPedido.id)}
                  >
                    <Text
                      style={[adminStyles.submitButtonText, { fontSize: 15 }]}
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
                    fontSize: 16,
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
    </>
  );
}

const styles = StyleSheet.create({
  // Status Banner mais compacto (espaçamentos menores)
  statusBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12, // Antes era 16
    borderRadius: 10, // Antes era 12
    borderWidth: 1,
    marginBottom: 16, // Antes era 20
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#00000010",
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "flex-start",
  },
  infoLabel: {
    fontWeight: "600",
    width: 90,
    fontSize: 14,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  itemQtyBadge: {
    backgroundColor: "#3b82f6",
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  // Card de Valor Total mais compacto (espaçamentos e fontes menores)
  totalCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14, // Antes era 20
    borderRadius: 10, // Antes era 12
    borderWidth: 1,
    marginBottom: 16, // Antes era 20
  },
});
