import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
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
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../firebaseConfig";

// Importações dos componentes das abas administrativas
import DashboardTab from "./components/DashboardTab";
import FuncionariosTab from "./components/FuncionariosTab";
import PedidosTab from "./components/PedidosTab";
import PetsAdocaoTab from "./components/PetsAdocaoTab";
import ProdutosTab from "./components/ProdutosTab";
import UsuariosTab from "./components/UsuariosTab";

// Limiar para considerar estoque baixo
const LOW_STOCK_THRESHOLD = 5;

export default function AdminDashboard() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<
    "dashboard" | "produtos" | "pets" | "pedidos" | "usuarios" | "funcionarios"
  >("dashboard");
  const [petsInitialView, setPetsInitialView] = useState<
    "pets" | "requisicoes"
  >("pets");

  const [produtos, setProdutos] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [requisicoes, setRequisicoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Contadores de alertas ────────────────────────────────────────────────
  const lowStockCount = produtos.filter(
    (p) => (p.estoque ?? p.stock ?? p.quantidade ?? 0) <= LOW_STOCK_THRESHOLD,
  ).length;

  const newOrdersCount = pedidos.filter(
    (p) =>
      p.status === "confirmado" ||
      p.status === "pendente" ||
      p.status === "novo" ||
      p.status === "aguardando",
  ).length;

  const pendingAdoptionsCount = requisicoes.filter(
    (r) => r.status === "pendente",
  ).length;

  useEffect(() => {
    setLoading(true);

    const unsubProdutos = onSnapshot(collection(db, "produtos"), (snapshot) => {
      setProdutos(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubPets = onSnapshot(collection(db, "pets"), (snapshot) => {
      setPets(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubPedidos = onSnapshot(collection(db, "pedidos"), (snapshot) => {
      setPedidos(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubRequisicoes = onSnapshot(
      collection(db, "requisicoes_adocao"),
      (snapshot) => {
        setRequisicoes(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
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

  // ── FUNÇÕES DO PRODUTO ───────────────────────────────────────────────────
  const handleAddProduto = async (produtoData: any) => {
    await addDoc(collection(db, "produtos"), produtoData);
  };
  const handleEditProduto = async (id: string, produtoData: any) => {
    await updateDoc(doc(db, "produtos", id), produtoData);
  };
  const handleDeleteProduto = async (id: string) => {
    await deleteDoc(doc(db, "produtos", id));
  };

  const handleLogoutAdmin = () => {
    Alert.alert("Sair", "Desejas sair do painel administrativo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("isAdminLoggedIn");
          await signOut(auth);
          router.replace("/login" as any);
        },
      },
    ]);
  };

  // ── Definição das abas com badges de alerta ──────────────────────────────
  const tabs = [
    { id: "dashboard", label: "Geral", icon: "analytics", badge: 0 },
    {
      id: "produtos",
      label: "Produtos",
      icon: "cube",
      badge: lowStockCount,
      badgeColor: "#F59E0B", // âmbar — aviso de estoque
    },
    { id: "pets", label: "Adoção", icon: "paw", badge: 0 },
    {
      id: "pedidos",
      label: "Pedidos",
      icon: "cart",
      badge: newOrdersCount,
      badgeColor: theme.primary, // cor primária — novos pedidos
    },
    { id: "usuarios", label: "Usuários", icon: "people", badge: 0 },
    { id: "funcionarios", label: "Equipe", icon: "briefcase", badge: 0 },
  ];

  const navigateToPets = (view: "pets" | "requisicoes") => {
    setPetsInitialView(view);
    setCurrentTab("pets");
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case "dashboard":
        return (
          <DashboardTab
            produtos={produtos}
            pets={pets}
            pedidos={pedidos}
            requisicoes={requisicoes}
            lowStockCount={lowStockCount}
            newOrdersCount={newOrdersCount}
            pendingAdoptionsCount={pendingAdoptionsCount}
            onNavigate={(tab) => {
              if (tab === "pets:requisicoes") {
                navigateToPets("requisicoes");
              } else if (tab === "pets") {
                navigateToPets("pets");
              } else {
                setCurrentTab(tab as any);
              }
            }}
          />
        );
      case "produtos":
        return (
          <ProdutosTab
            produtos={produtos}
            loading={loading}
            onAddProduto={handleAddProduto}
            onEditProduto={handleEditProduto}
            onDeleteProduto={handleDeleteProduto}
          />
        );
      case "pets":
        return <PetsAdocaoTab initialView={petsInitialView} />;
      case "pedidos":
        return <PedidosTab />;
      case "usuarios":
        return <UsuariosTab />;
      case "funcionarios":
        return <FuncionariosTab />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)" as any)}
          style={[styles.headerBtn, { backgroundColor: theme.surface }]}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={16} color={theme.text} />
          <Text style={[styles.headerBtnText, { color: theme.text }]}>
            Home
          </Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Painel Geral
          </Text>
          {/* Indicadores rápidos no header */}
          {(lowStockCount > 0 || newOrdersCount > 0) && (
            <View style={styles.headerAlerts}>
              {lowStockCount > 0 && (
                <TouchableOpacity
                  onPress={() => setCurrentTab("produtos")}
                  style={[styles.alertPill, { backgroundColor: "#F59E0B18" }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="warning" size={11} color="#F59E0B" />
                  <Text style={[styles.alertPillText, { color: "#F59E0B" }]}>
                    {lowStockCount} estoque baixo
                  </Text>
                </TouchableOpacity>
              )}
              {newOrdersCount > 0 && (
                <TouchableOpacity
                  onPress={() => setCurrentTab("pedidos")}
                  style={[
                    styles.alertPill,
                    { backgroundColor: theme.primary + "18" },
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="flash" size={11} color={theme.primary} />
                  <Text
                    style={[styles.alertPillText, { color: theme.primary }]}
                  >
                    {newOrdersCount} novo{newOrdersCount > 1 ? "s" : ""}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={handleLogoutAdmin}
          style={[styles.headerBtn, { backgroundColor: theme.error + "15" }]}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={16} color={theme.error} />
          <Text style={[styles.headerBtnText, { color: theme.error }]}>
            Sair
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Tab Bar ── */}
      <View style={{ maxHeight: 54 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.tabBar,
            { borderBottomColor: theme.border },
          ]}
        >
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setCurrentTab(tab.id as any)}
                style={[
                  styles.tabItem,
                  isActive && { borderBottomColor: theme.primary },
                ]}
              >
                <View style={styles.tabIconWrap}>
                  <Ionicons
                    name={tab.icon as any}
                    size={16}
                    color={isActive ? theme.primary : theme.textSecondary}
                  />
                  {/* Badge numérico na aba */}
                  {tab.badge > 0 && (
                    <View
                      style={[
                        styles.tabBadge,
                        { backgroundColor: tab.badgeColor ?? theme.primary },
                      ]}
                    >
                      <Text style={styles.tabBadgeText}>
                        {tab.badge > 99 ? "99+" : tab.badge}
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isActive ? theme.primary : theme.textSecondary },
                    isActive && { fontWeight: "700" },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Conteúdo ── */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          renderTabContent()
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  headerTitle: { fontSize: 16, fontWeight: "800" },
  headerAlerts: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  alertPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
  },
  alertPillText: { fontSize: 11, fontWeight: "600" },
  headerBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  headerBtnText: { fontSize: 13, fontWeight: "600" },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    height: 52,
    alignItems: "center",
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: "100%",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    gap: 6,
  },
  tabIconWrap: {
    position: "relative",
  },
  tabBadge: {
    position: "absolute",
    top: -5,
    right: -7,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
  },
  tabLabel: { fontSize: 14, fontWeight: "500" },

  // Content
  content: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
