import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View
} from "react-native";
import { adminStyles } from "../styles/adminStyles";
import {
  DashboardStats
} from "../types/admin.types";

interface DashboardTabProps {
  stats?: DashboardStats | null;
  loading?: boolean;
  produtos?: any[];
  pedidos?: any[];
  usuarios?: any[];
  pets?: any[];
}

export default function DashboardTab({
  stats,
  loading = false,
  produtos = [],
  pedidos = [],
  usuarios = [],
  pets = [],
}: DashboardTabProps) {
  const { theme } = useAppTheme();

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

  if (!stats) {
    return (
      <View
        style={[
          adminStyles.centerContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <Text style={{ color: theme.text }}>Nenhum dado disponível</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[
        adminStyles.contentContainer,
        { backgroundColor: theme.background },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Cartões de Resumo */}
      <View style={adminStyles.dashboardGrid}>
        <View
          style={[
            adminStyles.dashboardGridItem,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons name="cart" size={24} color={theme.primary} />
          <Text style={[adminStyles.dashboardGridValue, { color: theme.text }]}>
            {stats.totalPedidos}
          </Text>
          <Text
            style={[
              adminStyles.dashboardGridLabel,
              { color: theme.textSecondary },
            ]}
          >
            Pedidos
          </Text>
        </View>

        <View
          style={[
            adminStyles.dashboardGridItem,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons name="people" size={24} color={theme.primary} />
          <Text style={[adminStyles.dashboardGridValue, { color: theme.text }]}>
            {stats.totalUsuarios}
          </Text>
          <Text
            style={[
              adminStyles.dashboardGridLabel,
              { color: theme.textSecondary },
            ]}
          >
            Usuários
          </Text>
        </View>

        <View
          style={[
            adminStyles.dashboardGridItem,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons name="paw" size={24} color={theme.primary} />
          <Text style={[adminStyles.dashboardGridValue, { color: theme.text }]}>
            {stats.totalPets}
          </Text>
          <Text
            style={[
              adminStyles.dashboardGridLabel,
              { color: theme.textSecondary },
            ]}
          >
            Pets
          </Text>
        </View>
      </View>

      {/* Total de Vendas */}
      <View
        style={[
          adminStyles.dashboardCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="trending-up" size={20} color={theme.primary} />
          <Text style={[adminStyles.dashboardCardTitle, { color: theme.text }]}>
            Total de Vendas
          </Text>
        </View>
        <Text
          style={[{ fontSize: 24, fontWeight: "700", color: theme.primary }]}
        >
          R$ {stats.totalVendas}
        </Text>
      </View>

      {/* Produtos Mais Vendidos */}
      <View
        style={[
          adminStyles.dashboardCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <Ionicons name="star" size={20} color={theme.primary} />
          <Text style={[adminStyles.dashboardCardTitle, { color: theme.text }]}>
            Produtos Mais Vendidos
          </Text>
        </View>
        {stats.produtosMaisVendidos.length > 0 ? (
          stats.produtosMaisVendidos.slice(0, 5).map((produto, index) => (
            <View
              key={index}
              style={[
                adminStyles.listItem,
                { borderBottomColor: theme.border },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={[adminStyles.listItemTitle, { color: theme.text }]}
                >
                  {index + 1}. {produto.produtoNome}
                </Text>
                <Text style={[{ fontWeight: "700", color: theme.primary }]}>
                  {produto.quantidade}x
                </Text>
              </View>
              <Text
                style={[
                  adminStyles.listItemSubtitle,
                  { color: theme.textSecondary },
                ]}
              >
                Total: R$ {produto.total}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[adminStyles.emptyText, { color: theme.textSecondary }]}>
            Nenhum produto vendido ainda
          </Text>
        )}
      </View>

      {/* Usuários que Mais Compram */}
      <View
        style={[
          adminStyles.dashboardCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <Ionicons name="person-circle" size={20} color={theme.primary} />
          <Text style={[adminStyles.dashboardCardTitle, { color: theme.text }]}>
            Clientes Top
          </Text>
        </View>
        {stats.usuariosMaisCompram.length > 0 ? (
          stats.usuariosMaisCompram.slice(0, 5).map((usuario, index) => (
            <View
              key={index}
              style={[
                adminStyles.listItem,
                { borderBottomColor: theme.border },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={[adminStyles.listItemTitle, { color: theme.text }]}
                >
                  {index + 1}. {usuario.usuarioNome}
                </Text>
                <Text style={[{ fontWeight: "700", color: theme.primary }]}>
                  {usuario.quantidadePedidos} pedidos
                </Text>
              </View>
              <Text
                style={[
                  adminStyles.listItemSubtitle,
                  { color: theme.textSecondary },
                ]}
              >
                Gasto: R$ {usuario.totalGasto}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[adminStyles.emptyText, { color: theme.textSecondary }]}>
            Nenhuma compra registrada
          </Text>
        )}
      </View>

      {/* Pets com Mais Interesse */}
      <View
        style={[
          adminStyles.dashboardCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <Ionicons name="heart" size={20} color={theme.primary} />
          <Text style={[adminStyles.dashboardCardTitle, { color: theme.text }]}>
            Pets com Mais Interesse
          </Text>
        </View>
        {stats.petsInteresse.length > 0 ? (
          stats.petsInteresse.slice(0, 5).map((pet, index) => (
            <View
              key={index}
              style={[
                adminStyles.listItem,
                { borderBottomColor: theme.border },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={[adminStyles.listItemTitle, { color: theme.text }]}
                >
                  {index + 1}. {pet.petNome}
                </Text>
                <Text style={[{ fontWeight: "700", color: theme.primary }]}>
                  {pet.quantidadeInteresse} interessados
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={[adminStyles.emptyText, { color: theme.textSecondary }]}>
            Nenhum pet com interesse registrado
          </Text>
        )}
      </View>

      {/* Pedidos Recentes */}
      <View
        style={[
          adminStyles.dashboardCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <Ionicons name="time" size={20} color={theme.primary} />
          <Text style={[adminStyles.dashboardCardTitle, { color: theme.text }]}>
            Pedidos Recentes
          </Text>
        </View>
        {stats.pedidosRecentes.length > 0 ? (
          stats.pedidosRecentes.slice(0, 5).map((pedido, index) => (
            <View
              key={index}
              style={[
                adminStyles.listItem,
                { borderBottomColor: theme.border },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={[adminStyles.listItemTitle, { color: theme.text }]}
                >
                  {pedido.clienteNome}
                </Text>
                <Text
                  style={[
                    { fontWeight: "700", fontSize: 12 },
                    {
                      color:
                        pedido.status === "entregue"
                          ? "#10b981"
                          : pedido.status === "cancelado"
                            ? "#ef4444"
                            : theme.primary,
                    },
                  ]}
                >
                  {pedido.status.toUpperCase()}
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
                  {pedido.data} às {pedido.horario}
                </Text>
                <Text
                  style={[
                    adminStyles.listItemSubtitle,
                    { color: theme.primary, fontWeight: "600" },
                  ]}
                >
                  R$ {pedido.total}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={[adminStyles.emptyText, { color: theme.textSecondary }]}>
            Nenhum pedido registrado
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
