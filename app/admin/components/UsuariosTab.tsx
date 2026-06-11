import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import { collection, onSnapshot, query, where } from "firebase/firestore";
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
import { Usuario } from "../types/admin.types";

export default function UsuariosTab() {
  const { theme } = useAppTheme();

  // Estados do Firebase
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados da Interface
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Estados para buscar os dados reais do usuário clicado
  const [userPedidos, setUserPedidos] = useState<any[]>([]);
  const [userAdocoes, setUserAdocoes] = useState<any[]>([]);

  // Busca todos os usuários
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

  // Busca pedidos e adoções quando um usuário é selecionado
  useEffect(() => {
    if (!selectedUsuario) return;

    // Buscar Pedidos pelo ID do Usuário
    const qPedidos = query(
      collection(db, "pedidos"),
      where("userId", "==", selectedUsuario.id),
    );
    const unsubPedidos = onSnapshot(qPedidos, (snapshot) => {
      const pedidos = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Ordena do mais recente para o mais antigo (opcional, dependendo do campo createdAt)
      setUserPedidos(pedidos.reverse());
    });

    // Buscar Adoções pelo E-mail do Usuário
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

  const filteredUsuarios = usuarios.filter(
    (u) =>
      u.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelectUsuario = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setShowDetailModal(true);
  };

  // Funções para formatar o endereço com segurança (Evita o erro de Object as Child)
  const formatarEndereco = (end: any) => {
    if (!end) return "Endereço não informado";
    if (typeof end === "string") return end; // Caso de dados antigos salvos como string
    return `${end.rua || ""}, ${end.numero || "S/N"} - ${end.bairro || ""}`;
  };

  const getCidade = (user: any) =>
    user?.endereco?.cidade || user?.cidade || "Não informada";
  const getEstado = (user: any) => user?.endereco?.uf || user?.estado || "N/A";
  const getCep = (user: any) =>
    user?.endereco?.cep || user?.cep || "Não informado";

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

        <ScrollView showsVerticalScrollIndicator={false}>
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
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.textSecondary}
                />
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

      {/* Modal de Detalhes do Usuário */}
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
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {selectedUsuario && (
              <View>
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
                      size={22}
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
                      {selectedUsuario.dataCadastro
                        ? new Date(
                            selectedUsuario.dataCadastro,
                          ).toLocaleDateString("pt-BR")
                        : "N/A"}
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
                      size={22}
                      color={theme.primary}
                    />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>
                      Endereço do Usuário
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: theme.textSecondary,
                      marginBottom: 8,
                      fontSize: 14,
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
                    <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                      <Text style={{ fontWeight: "600", color: theme.text }}>
                        Cidade:{" "}
                      </Text>
                      {getCidade(selectedUsuario)} /{" "}
                      {getEstado(selectedUsuario)}
                    </Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
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
                      size={22}
                      color={theme.primary}
                    />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>
                      Pedidos Realizados ({userPedidos.length})
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
                            marginBottom: 4,
                          }}
                        >
                          <Text
                            style={{ color: theme.text, fontWeight: "700" }}
                          >
                            #{pedido.id.substring(0, 8)}
                          </Text>
                          <Text
                            style={{ color: theme.primary, fontWeight: "700" }}
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
                            style={{ color: theme.textSecondary, fontSize: 12 }}
                          >
                            {pedido.data || "--"} às {pedido.horario || "--:--"}
                          </Text>
                          <Text
                            style={{
                              fontSize: 11,
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
                      }}
                    >
                      Este usuário ainda não fez compras.
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
                      size={22}
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
                            marginBottom: 4,
                          }}
                        >
                          <Text
                            style={{ color: theme.text, fontWeight: "700" }}
                          >
                            {adocao.petNome}
                          </Text>
                          <Text
                            style={{
                              fontSize: 11,
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
                          style={{ color: theme.textSecondary, fontSize: 12 }}
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
                      }}
                    >
                      Este usuário não possui registros de adoção.
                    </Text>
                  )}
                </View>

                {/* PETS CADASTRADOS (Pelo próprio app para perfil) */}
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
                        size={22}
                        color={theme.primary}
                      />
                      <Text style={[styles.cardTitle, { color: theme.text }]}>
                        Meus Pets Cadastrados ({selectedUsuario.pets.length})
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
                          }}
                        >
                          {pet.nome}
                        </Text>
                        <Text
                          style={{ color: theme.textSecondary, fontSize: 12 }}
                        >
                          {pet.tipo} • {pet.raca} • {pet.idade} anos
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Total Gasto Calculado em Tempo Real */}
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
                      fontSize: 15,
                      fontWeight: "600",
                    }}
                  >
                    Total Gasto em Compras
                  </Text>
                  <Text
                    style={{
                      color: theme.primary,
                      fontSize: 24,
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
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
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
    marginBottom: 8,
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
  listItem: {
    paddingVertical: 12,
  },
  totalCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
});
