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

export default function AdminDashboard() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<
    "dashboard" | "produtos" | "pets" | "pedidos" | "usuarios" | "funcionarios"
  >("dashboard");

  const [produtos, setProdutos] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubProdutos = onSnapshot(collection(db, "produtos"), (snapshot) => {
      setProdutos(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubPets = onSnapshot(collection(db, "pets"), (snapshot) => {
      setPets(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unsubProdutos();
      unsubPets();
    };
  }, []);

  // ── FUNÇÕES DO PRODUTO (Que estavam a faltar no ProdutosTab) ────────────
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

  const renderTabContent = () => {
    switch (currentTab) {
      case "dashboard":
        return <DashboardTab />;

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
        return <PetsAdocaoTab />;
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
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)" as any)}
          style={[styles.backButton, { backgroundColor: theme.surface }]}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={16} color={theme.text} />
          <Text style={[styles.backButtonText, { color: theme.text }]}>
            Home
          </Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Painel Geral
        </Text>

        <TouchableOpacity
          onPress={handleLogoutAdmin}
          style={[styles.backButton, { backgroundColor: theme.error + "15" }]}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={16} color={theme.error} />
          <Text style={[styles.backButtonText, { color: theme.error }]}>
            Sair
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ maxHeight: 54 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.tabBar,
            { borderBottomColor: theme.border },
          ]}
        >
          {[
            { id: "dashboard", label: "Geral", icon: "analytics" },
            { id: "produtos", label: "Produtos", icon: "cube" },
            { id: "pets", label: "Adoção", icon: "paw" },
            { id: "pedidos", label: "Pedidos", icon: "cart" },
            { id: "usuarios", label: "Usuários", icon: "people" },
            { id: "funcionarios", label: "Equipa", icon: "briefcase" },
          ].map((tab) => {
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
                <Ionicons
                  name={tab.icon as any}
                  size={16}
                  color={isActive ? theme.primary : theme.textSecondary}
                  style={{ marginRight: 6 }}
                />
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  backButtonText: { fontSize: 13, fontWeight: "600" },
  headerTitle: { fontSize: 16, fontWeight: "800" },
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
  },
  tabLabel: { fontSize: 14, fontWeight: "500" },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});
