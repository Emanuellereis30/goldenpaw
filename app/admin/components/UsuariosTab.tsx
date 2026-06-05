import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { adminStyles } from "../styles/adminStyles";
import { Usuario } from "../types/admin.types";

interface UsuariosTabProps {
  usuarios: Usuario[];
  loading: boolean;
}

export default function UsuariosTab({ usuarios, loading }: UsuariosTabProps) {
  const { theme } = useAppTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredUsuarios = usuarios.filter(
    (u) =>
      u.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelectUsuario = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setShowDetailModal(true);
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
                    {usuario.telefone}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                    <View
                      style={[
                        {
                          backgroundColor: theme.primary + "20",
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 4,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          {
                            fontSize: 12,
                            color: theme.primary,
                            fontWeight: "600",
                          },
                        ]}
                      >
                        {usuario.pets.length} pets
                      </Text>
                    </View>
                    <View
                      style={[
                        {
                          backgroundColor: theme.primary + "20",
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 4,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          {
                            fontSize: 12,
                            color: theme.primary,
                            fontWeight: "600",
                          },
                        ]}
                      >
                        {usuario.historicoCompras.length} compras
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
              Detalhes do Usuário
            </Text>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={adminStyles.modalContent}>
            {selectedUsuario && (
              <View style={adminStyles.modalForm}>
                {/* Informações Pessoais */}
                <Text
                  style={[adminStyles.sectionTitle, { color: theme.primary }]}
                >
                  Informações Pessoais
                </Text>

                <Text style={[adminStyles.label, { color: theme.text }]}>
                  Nome
                </Text>
                <Text
                  style={[
                    adminStyles.itemDetail,
                    { color: theme.textSecondary, marginBottom: 16 },
                  ]}
                >
                  {selectedUsuario.nome}
                </Text>

                <Text style={[adminStyles.label, { color: theme.text }]}>
                  Email
                </Text>
                <Text
                  style={[
                    adminStyles.itemDetail,
                    { color: theme.textSecondary, marginBottom: 16 },
                  ]}
                >
                  {selectedUsuario.email}
                </Text>

                <Text style={[adminStyles.label, { color: theme.text }]}>
                  Telefone
                </Text>
                <Text
                  style={[
                    adminStyles.itemDetail,
                    { color: theme.textSecondary, marginBottom: 16 },
                  ]}
                >
                  {selectedUsuario.telefone}
                </Text>

                {selectedUsuario.cpf && (
                  <>
                    <Text style={[adminStyles.label, { color: theme.text }]}>
                      CPF
                    </Text>
                    <Text
                      style={[
                        adminStyles.itemDetail,
                        { color: theme.textSecondary, marginBottom: 16 },
                      ]}
                    >
                      {selectedUsuario.cpf}
                    </Text>
                  </>
                )}

                <Text style={[adminStyles.label, { color: theme.text }]}>
                  Data de Cadastro
                </Text>
                <Text
                  style={[
                    adminStyles.itemDetail,
                    { color: theme.textSecondary, marginBottom: 16 },
                  ]}
                >
                  {selectedUsuario.dataCadastro}
                </Text>

                {/* Endereço */}
                <Text
                  style={[
                    adminStyles.sectionTitle,
                    { color: theme.primary, marginTop: 20 },
                  ]}
                >
                  Endereço
                </Text>

                <Text style={[adminStyles.label, { color: theme.text }]}>
                  Endereço
                </Text>
                <Text
                  style={[
                    adminStyles.itemDetail,
                    { color: theme.textSecondary, marginBottom: 16 },
                  ]}
                >
                  {selectedUsuario.endereco}
                </Text>

                <View style={adminStyles.productInputRow}>
                  <View style={adminStyles.productInputColumn}>
                    <Text style={[adminStyles.label, { color: theme.text }]}>
                      Cidade
                    </Text>
                    <Text
                      style={[
                        adminStyles.itemDetail,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {selectedUsuario.cidade}
                    </Text>
                  </View>
                  <View style={adminStyles.productInputColumn}>
                    <Text style={[adminStyles.label, { color: theme.text }]}>
                      Estado
                    </Text>
                    <Text
                      style={[
                        adminStyles.itemDetail,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {selectedUsuario.estado}
                    </Text>
                  </View>
                </View>

                <Text style={[adminStyles.label, { color: theme.text }]}>
                  CEP
                </Text>
                <Text
                  style={[
                    adminStyles.itemDetail,
                    { color: theme.textSecondary, marginBottom: 16 },
                  ]}
                >
                  {selectedUsuario.cep}
                </Text>

                {/* Pets do Usuário */}
                {selectedUsuario.pets.length > 0 && (
                  <>
                    <Text
                      style={[
                        adminStyles.sectionTitle,
                        { color: theme.primary, marginTop: 20 },
                      ]}
                    >
                      Pets Cadastrados ({selectedUsuario.pets.length})
                    </Text>
                    {selectedUsuario.pets.map((pet, index) => (
                      <View
                        key={index}
                        style={[
                          adminStyles.listItem,
                          {
                            borderBottomColor: theme.border,
                            paddingVertical: 12,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            adminStyles.listItemTitle,
                            { color: theme.text },
                          ]}
                        >
                          {pet.nome}
                        </Text>
                        <Text
                          style={[
                            adminStyles.listItemSubtitle,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {pet.tipo} • {pet.raca} • {pet.idade} anos
                        </Text>
                      </View>
                    ))}
                  </>
                )}

                {/* Histórico de Compras */}
                {selectedUsuario.historicoCompras.length > 0 && (
                  <>
                    <Text
                      style={[
                        adminStyles.sectionTitle,
                        { color: theme.primary, marginTop: 20 },
                      ]}
                    >
                      Histórico de Compras (
                      {selectedUsuario.historicoCompras.length})
                    </Text>
                    {selectedUsuario.historicoCompras.map((compra, index) => (
                      <View
                        key={index}
                        style={[
                          adminStyles.listItem,
                          {
                            borderBottomColor: theme.border,
                            paddingVertical: 12,
                          },
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
                            Pedido #{compra.pedidoId}
                          </Text>
                          <Text
                            style={[
                              { fontWeight: "700", color: theme.primary },
                            ]}
                          >
                            R$ {compra.total}
                          </Text>
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                          }}
                        >
                          <Text
                            style={[
                              adminStyles.listItemSubtitle,
                              { color: theme.textSecondary },
                            ]}
                          >
                            {compra.data}
                          </Text>
                          <Text
                            style={[
                              { fontSize: 12, fontWeight: "600" },
                              {
                                color:
                                  compra.status === "entregue"
                                    ? "#10b981"
                                    : compra.status === "cancelado"
                                      ? "#ef4444"
                                      : theme.primary,
                              },
                            ]}
                          >
                            {compra.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </>
                )}

                {/* Total Gasto */}
                <View
                  style={[
                    adminStyles.dashboardCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      marginTop: 20,
                    },
                  ]}
                >
                  <Text
                    style={[
                      adminStyles.dashboardCardTitle,
                      { color: theme.text },
                    ]}
                  >
                    Total Gasto
                  </Text>
                  <Text
                    style={[
                      { fontSize: 24, fontWeight: "700", color: theme.primary },
                    ]}
                  >
                    R$ {selectedUsuario.totalGasto}
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
