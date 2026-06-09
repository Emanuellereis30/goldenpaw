import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { db } from "../../../firebaseConfig";
import { adminStyles } from "../styles/adminStyles";

export default function DashboardTab() {
  const { theme } = useAppTheme();

  const [produtos, setProdutos] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [requisicoes, setRequisicoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca Produtos
    const unsubProdutos = onSnapshot(collection(db, "produtos"), (snapshot) => {
      setProdutos(snapshot.docs.map((doc) => doc.data()));
    });

    // Busca Pets
    const unsubPets = onSnapshot(collection(db, "pets"), (snapshot) => {
      setPets(snapshot.docs.map((doc) => doc.data()));
    });

    // Busca Pedidos
    const unsubPedidos = onSnapshot(collection(db, "pedidos"), (snapshot) => {
      setPedidos(snapshot.docs.map((doc) => doc.data()));
    });

    // Busca Requisições de Adoção
    const unsubRequisicoes = onSnapshot(
      collection(db, "requisicoes_adocao"),
      (snapshot) => {
        setRequisicoes(snapshot.docs.map((doc) => doc.data()));
        setLoading(false);
      },
    );

    return () => {
      unsubProdutos();
      unsubPets();
      unsubPedidos();
      unsubRequisicoes();
    };
  }, []);

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

  // Cálculos de Estatísticas
  const baixoEstoque = produtos.filter((p) => (p.estoque || 0) <= 5).length;
  const requisicoesPendentes = requisicoes.filter(
    (r) => r.status === "pendente",
  ).length;
  const pedidosPendentes = pedidos.filter(
    (p) => p.status === "pendente",
  ).length;

  const totalGeralGanho = pedidos.reduce((acc, pedido) => {
    const valor = parseFloat(
      (pedido.total || "0")
        .replace("R$ ", "")
        .replace(".", "")
        .replace(",", "."),
    );
    return acc + (isNaN(valor) ? 0 : valor);
  }, 0);

  return (
    <View
      style={[
        adminStyles.contentContainer,
        { backgroundColor: theme.background },
      ]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Bloco de Avisos / Alertas */}
        {(baixoEstoque > 0 ||
          requisicoesPendentes > 0 ||
          pedidosPendentes > 0) && (
          <View style={{ marginBottom: 20 }}>
            <Text style={[adminStyles.sectionTitle, { color: theme.primary }]}>
              Alertas Pendentes
            </Text>

            {baixoEstoque > 0 && (
              <View
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
                    Você tem {baixoEstoque} produto(s) com 5 ou menos unidades
                    em estoque.
                  </Text>
                </View>
              </View>
            )}

            {requisicoesPendentes > 0 && (
              <View
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
                    Existem {requisicoesPendentes} solicitação(ões) de adoção
                    aguardando análise.
                  </Text>
                </View>
              </View>
            )}

            {pedidosPendentes > 0 && (
              <View
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
                    Você tem {pedidosPendentes} novo(s) pedido(s) na loja para
                    confirmar e enviar.
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        <Text style={[adminStyles.sectionTitle, { color: theme.primary }]}>
          Visão Geral
        </Text>

        <View style={adminStyles.dashboardGrid}>
          {/* Card Produtos */}
          <View
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
          </View>

          {/* Card Pets */}
          <View
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
          </View>

          {/* Card Pedidos Total */}
          <View
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
          </View>

          {/* Card Adoções (Revisadas e Concluídas) */}
          <View
            style={[
              adminStyles.dashboardCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Ionicons name="heart" size={32} color={theme.primary} />
            <Text
              style={[adminStyles.dashboardCardValue, { color: theme.text }]}
            >
              {requisicoes.filter((r) => r.status === "aprovado").length}
            </Text>
            <Text
              style={[
                adminStyles.dashboardCardTitle,
                { color: theme.textSecondary },
              ]}
            >
              Adoções Aprovadas
            </Text>
          </View>
        </View>

        {/* Resumo Financeiro Simples */}
        <View style={{ marginTop: 24, marginBottom: 40 }}>
          <Text style={[adminStyles.sectionTitle, { color: theme.primary }]}>
            Financeiro da Loja
          </Text>
          <View
            style={[
              adminStyles.itemCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                padding: 20,
              },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  backgroundColor: "#10b98120",
                  padding: 12,
                  borderRadius: 12,
                }}
              >
                <Ionicons name="cash" size={28} color="#10b981" />
              </View>
              <View style={{ marginLeft: 16 }}>
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
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
