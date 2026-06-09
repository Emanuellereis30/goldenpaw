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

  // Estados do Firebase
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados da Interface
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Buscar dados em tempo real
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "pedidos"), (snapshot) => {
      const docs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Pedido[];
      setPedidos(docs);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Funções do Firebase
  const onUpdateStatus = async (id: string, status: Pedido["status"]) => {
    await updateDoc(doc(db, "pedidos", id), { status });
  };

  const onDeletePedido = async (id: string) => {
    await deleteDoc(doc(db, "pedidos", id));
  };

  // Filtro protegido contra dados indefinidos (null/undefined)
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
      { text: "Cancelar" },
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
              // Prevenções garantidas para cada campo
              const status = pedido?.status || "pendente";
              const itens = pedido?.itens || [];
              const metodoPgto = pedido?.metodoPagamento || "Não informado";

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
                      }}
                    >
                      <Text
                        style={[adminStyles.itemName, { color: theme.text }]}
                      >
                        {pedido.clienteNome || "Cliente Desconhecido"}
                      </Text>
                      <View
                        style={{
                          backgroundColor: statusColors[status],
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 4,
                        }}
                      >
                        <Text
                          style={{
                            color: "#FFF",
                            fontSize: 10,
                            fontWeight: "bold",
                          }}
                        >
                          {statusLabels[status]}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        adminStyles.itemDetail,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {pedido.data || "Data não definida"} às{" "}
                      {pedido.horario || "--:--"}
                    </Text>
                    <Text
                      style={[
                        adminStyles.itemDetail,
                        { color: theme.textSecondary },
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

      {/* Modal de Detalhes do Pedido */}
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
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={adminStyles.modalContent}>
            {selectedPedido && (
              <View style={adminStyles.modalForm}>
                <Text
                  style={[adminStyles.sectionTitle, { color: theme.primary }]}
                >
                  Informações do Pedido
                </Text>

                <Text style={[adminStyles.label, { color: theme.text }]}>
                  ID do Pedido
                </Text>
                <Text
                  style={[
                    adminStyles.itemDetail,
                    { color: theme.textSecondary, marginBottom: 16 },
                  ]}
                >
                  {selectedPedido.id}
                </Text>

                <Text style={[adminStyles.label, { color: theme.text }]}>
                  Cliente
                </Text>
                <Text
                  style={[
                    adminStyles.itemDetail,
                    { color: theme.textSecondary, marginBottom: 16 },
                  ]}
                >
                  {selectedPedido.clienteNome || "N/A"}
                </Text>

                <View style={adminStyles.productInputRow}>
                  <View style={adminStyles.productInputColumn}>
                    <Text style={[adminStyles.label, { color: theme.text }]}>
                      Data
                    </Text>
                    <Text
                      style={[
                        adminStyles.itemDetail,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {selectedPedido.data || "N/A"}
                    </Text>
                  </View>
                  <View style={adminStyles.productInputColumn}>
                    <Text style={[adminStyles.label, { color: theme.text }]}>
                      Horário
                    </Text>
                    <Text
                      style={[
                        adminStyles.itemDetail,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {selectedPedido.horario || "N/A"}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    adminStyles.sectionTitle,
                    { color: theme.primary, marginTop: 20 },
                  ]}
                >
                  Itens do Pedido
                </Text>
                {(selectedPedido.itens || []).map((item, index) => (
                  <View
                    key={index}
                    style={[
                      adminStyles.listItem,
                      { borderBottomColor: theme.border, paddingVertical: 12 },
                    ]}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text
                        style={[
                          adminStyles.listItemTitle,
                          { color: theme.text },
                        ]}
                      >
                        {item.produtoNome}
                      </Text>
                      <Text
                        style={[{ fontWeight: "700", color: theme.primary }]}
                      >
                        {item.quantidade}x
                      </Text>
                    </View>
                    <Text
                      style={[
                        adminStyles.listItemSubtitle,
                        { color: theme.textSecondary },
                      ]}
                    >
                      R$ {item.preco} cada
                    </Text>
                  </View>
                ))}

                <Text
                  style={[
                    adminStyles.sectionTitle,
                    { color: theme.primary, marginTop: 20 },
                  ]}
                >
                  Endereço de Entrega
                </Text>
                <Text
                  style={[
                    adminStyles.itemDetail,
                    { color: theme.textSecondary, marginBottom: 16 },
                  ]}
                >
                  {selectedPedido.endereco || "Não informado"}
                </Text>

                <Text style={[adminStyles.label, { color: theme.text }]}>
                  Método de Pagamento
                </Text>
                <Text
                  style={[
                    adminStyles.itemDetail,
                    { color: theme.textSecondary, marginBottom: 16 },
                  ]}
                >
                  {(
                    selectedPedido.metodoPagamento || "Não informado"
                  ).toUpperCase()}
                </Text>

                <Text style={[adminStyles.label, { color: theme.text }]}>
                  Status
                </Text>
                <View
                  style={{
                    backgroundColor:
                      statusColors[selectedPedido.status || "pendente"],
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    marginBottom: 16,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text style={{ color: "#FFF", fontWeight: "bold" }}>
                    {statusLabels[selectedPedido.status || "pendente"]}
                  </Text>
                </View>

                <View
                  style={[
                    adminStyles.dashboardCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      adminStyles.dashboardCardTitle,
                      { color: theme.text },
                    ]}
                  >
                    Total do Pedido
                  </Text>
                  <Text
                    style={[
                      { fontSize: 24, fontWeight: "700", color: theme.primary },
                    ]}
                  >
                    R$ {selectedPedido.total || "0,00"}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    adminStyles.submitButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={() => setShowStatusModal(true)}
                >
                  <Text style={adminStyles.submitButtonText}>
                    Alterar Status
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    adminStyles.submitButton,
                    { backgroundColor: theme.error },
                  ]}
                  onPress={() => handleDeletePedido(selectedPedido.id)}
                >
                  <Text style={adminStyles.submitButtonText}>
                    Excluir Pedido
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Modal de Alterar Status */}
      <Modal visible={showStatusModal} animationType="fade" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 12,
              padding: 20,
              width: "100%",
            }}
          >
            <Text
              style={[
                adminStyles.modalTitle,
                { color: theme.text, marginBottom: 20 },
              ]}
            >
              Alterar Status
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
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  marginBottom: 8,
                  backgroundColor: statusColors[status] + "20",
                  borderWidth: 1,
                  borderColor: statusColors[status],
                }}
                onPress={() => handleStatusChange(status)}
              >
                <Text
                  style={{ color: statusColors[status], fontWeight: "600" }}
                >
                  {statusLabels[status]}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[
                adminStyles.submitButton,
                { backgroundColor: theme.textSecondary, marginTop: 12 },
              ]}
              onPress={() => setShowStatusModal(false)}
            >
              <Text style={adminStyles.submitButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
