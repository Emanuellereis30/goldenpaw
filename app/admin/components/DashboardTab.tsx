import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { adminStyles } from "../styles/adminStyles";

interface DashboardTabProps {
  produtos: any[];
  pets: any[];
  pedidos: any[];
  requisicoes: any[];
  lowStockCount: number;
  newOrdersCount: number;
  pendingAdoptionsCount: number;
  onNavigate: (tab: string) => void;
}

export default function DashboardTab({
  produtos,
  pets,
  pedidos,
  requisicoes,
  lowStockCount,
  newOrdersCount,
  pendingAdoptionsCount,
  onNavigate,
}: DashboardTabProps) {
  const { theme } = useAppTheme();

  const totalGeralGanho = pedidos.reduce((acc, pedido) => {
    const valor = parseFloat(
      (pedido.total || "0")
        .replace("R$ ", "")
        .replace(".", "")
        .replace(",", "."),
    );
    return acc + (isNaN(valor) ? 0 : valor);
  }, 0);

  const adocoesAprovadas = requisicoes.filter(
    (r) => r.status === "aprovado",
  ).length;

  const hasAlerts =
    lowStockCount > 0 || newOrdersCount > 0 || pendingAdoptionsCount > 0;

  return (
    <View
      style={[
        adminStyles.contentContainer,
        { backgroundColor: theme.background },
      ]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Alertas ── */}
        {hasAlerts && (
          <View style={{ marginBottom: 20 }}>
            <Text style={[adminStyles.sectionTitle, { color: theme.primary }]}>
              Alertas Pendentes
            </Text>

            {lowStockCount > 0 && (
              <TouchableOpacity
                onPress={() => onNavigate("produtos")}
                activeOpacity={0.75}
                style={[
                  adminStyles.itemCard,
                  { backgroundColor: "#fef2f2", borderColor: "#fca5a5" },
                ]}
              >
                <Ionicons name="warning" size={24} color="#ef4444" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ fontWeight: "700", color: "#b91c1c" }}>
                    Estoque Baixo
                  </Text>
                  <Text style={{ color: "#7f1d1d" }}>
                    {lowStockCount} produto(s) com 5 ou menos unidades em
                    estoque. Toque para ver.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#ef4444" />
              </TouchableOpacity>
            )}

            {newOrdersCount > 0 && (
              <TouchableOpacity
                onPress={() => onNavigate("pedidos")}
                activeOpacity={0.75}
                style={[
                  adminStyles.itemCard,
                  {
                    backgroundColor: "#eff6ff",
                    borderColor: "#bfdbfe",
                    marginTop: 10,
                  },
                ]}
              >
                <Ionicons name="cart" size={24} color="#3b82f6" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ fontWeight: "700", color: "#1d4ed8" }}>
                    Pedidos Pendentes
                  </Text>
                  <Text style={{ color: "#1e3a8a" }}>
                    {newOrdersCount} novo(s) pedido(s) aguardando confirmação.
                    Toque para ver.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
              </TouchableOpacity>
            )}

            {pendingAdoptionsCount > 0 && (
              <TouchableOpacity
                onPress={() => onNavigate("pets:requisicoes")}
                activeOpacity={0.75}
                style={[
                  adminStyles.itemCard,
                  {
                    backgroundColor: "#fffbeb",
                    borderColor: "#fcd34d",
                    marginTop: 10,
                  },
                ]}
              >
                <Ionicons name="paw" size={24} color="#f59e0b" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ fontWeight: "700", color: "#b45309" }}>
                    Adoções Pendentes
                  </Text>
                  <Text style={{ color: "#78350f" }}>
                    {pendingAdoptionsCount} solicitação(ões) de adoção
                    aguardando análise. Toque para ver.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#f59e0b" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Visão Geral ── */}
        <Text style={[adminStyles.sectionTitle, { color: theme.primary }]}>
          Visão Geral
        </Text>

        <View style={adminStyles.dashboardGrid}>
          {/* Card Produtos */}
          <TouchableOpacity
            onPress={() => onNavigate("produtos")}
            activeOpacity={0.75}
            style={[
              adminStyles.dashboardCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Ionicons name="cube" size={32} color={theme.primary} />
            <Text
              style={[adminStyles.dashboardCardValue, { color: theme.text }]}
            >
              {produtos.length}
            </Text>
            <Text
              style={[
                adminStyles.dashboardCardTitle,
                { color: theme.textSecondary },
              ]}
            >
              Produtos
            </Text>
            {lowStockCount > 0 && (
              <View
                style={{
                  marginTop: 6,
                  backgroundColor: "#fef2f2",
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{ fontSize: 11, color: "#b91c1c", fontWeight: "600" }}
                >
                  {lowStockCount} em falta
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Card Pets */}
          <TouchableOpacity
            onPress={() => onNavigate("pets")}
            activeOpacity={0.75}
            style={[
              adminStyles.dashboardCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Ionicons name="paw" size={32} color={theme.primary} />
            <Text
              style={[adminStyles.dashboardCardValue, { color: theme.text }]}
            >
              {pets.length}
            </Text>
            <Text
              style={[
                adminStyles.dashboardCardTitle,
                { color: theme.textSecondary },
              ]}
            >
              Pets para Adoção
            </Text>
            {pendingAdoptionsCount > 0 && (
              <View
                style={{
                  marginTop: 6,
                  backgroundColor: "#fffbeb",
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{ fontSize: 11, color: "#b45309", fontWeight: "600" }}
                >
                  {pendingAdoptionsCount} pendente
                  {pendingAdoptionsCount > 1 ? "s" : ""}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Card Pedidos Total */}
          <TouchableOpacity
            onPress={() => onNavigate("pedidos")}
            activeOpacity={0.75}
            style={[
              adminStyles.dashboardCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Ionicons name="bag-check" size={32} color={theme.primary} />
            <Text
              style={[adminStyles.dashboardCardValue, { color: theme.text }]}
            >
              {pedidos.length}
            </Text>
            <Text
              style={[
                adminStyles.dashboardCardTitle,
                { color: theme.textSecondary },
              ]}
            >
              Pedidos Realizados
            </Text>
            {newOrdersCount > 0 && (
              <View
                style={{
                  marginTop: 6,
                  backgroundColor: theme.primary + "15",
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: theme.primary,
                    fontWeight: "600",
                  }}
                >
                  {newOrdersCount} novo{newOrdersCount > 1 ? "s" : ""}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Card Adoções Aprovadas */}
          <TouchableOpacity
            onPress={() => onNavigate("pets:requisicoes")}
            activeOpacity={0.75}
            style={[
              adminStyles.dashboardCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Ionicons name="heart" size={32} color={theme.primary} />
            <Text
              style={[adminStyles.dashboardCardValue, { color: theme.text }]}
            >
              {adocoesAprovadas}
            </Text>
            <Text
              style={[
                adminStyles.dashboardCardTitle,
                { color: theme.textSecondary },
              ]}
            >
              Adoções Aprovadas
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Financeiro ── */}
        <View style={{ marginTop: 24, marginBottom: 40 }}>
          <Text style={[adminStyles.sectionTitle, { color: theme.primary }]}>
            Financeiro da Loja
          </Text>
          <TouchableOpacity
            onPress={() => onNavigate("pedidos")}
            activeOpacity={0.75}
            style={[
              adminStyles.itemCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                padding: 20,
              },
            ]}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <View
                style={{
                  backgroundColor: "#10b98120",
                  padding: 12,
                  borderRadius: 12,
                }}
              >
                <Ionicons name="cash" size={28} color="#10b981" />
              </View>
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  Faturamento Total Bruto
                </Text>
                <Text
                  style={{
                    color: theme.text,
                    fontSize: 24,
                    fontWeight: "800",
                    marginTop: 4,
                  }}
                >
                  R${" "}
                  {totalGeralGanho.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.textSecondary}
              />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
