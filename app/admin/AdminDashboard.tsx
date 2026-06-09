import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebaseConfig";

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

  // Estados para dados em tempo real vindos do Firestore
  const [produtos, setProdutos] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [requisicoes, setRequisicoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Ativa listeners em tempo real para sincronização imediata
  useEffect(() => {
    setLoading(true);

    const unsubProdutos = onSnapshot(collection(db, "produtos"), (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProdutos(docs);
    });

    const unsubPets = onSnapshot(collection(db, "pets"), (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPets(docs);
    });

    const unsubRequisicoes = onSnapshot(
      collection(db, "requisicoes_adocao"),
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRequisicoes(docs);
        setLoading(false);
      },
    );

    return () => {
      unsubProdutos();
      unsubPets();
      unsubRequisicoes();
    };
  }, []);

  // ── OPERAÇÕES DO FIRESTORE: PRODUTOS ───────────────────────────────────────
  const handleAddProduto = async (produtoData: any) => {
    await addDoc(collection(db, "produtos"), produtoData);
  };

  const handleEditProduto = async (id: string, produtoData: any) => {
    await updateDoc(doc(db, "produtos", id), produtoData);
  };

  const handleDeleteProduto = async (id: string) => {
    await deleteDoc(doc(db, "produtos", id));
  };

  // ── OPERAÇÕES DO FIRESTORE: PETS E REQUISIÇÕES ─────────────────────────────
  const handleAddPet = async (petData: any) => {
    await addDoc(collection(db, "pets"), petData);
  };

  const handleEditPet = async (id: string, petData: any) => {
    await updateDoc(doc(db, "pets", id), petData);
  };

  const handleDeletePet = async (id: string) => {
    await deleteDoc(doc(db, "pets", id));
  };

  const handleUpdateRequisicao = async (
    id: string,
    status: "aprovado" | "rejeitado",
    visualizado: boolean,
  ) => {
    await updateDoc(doc(db, "requisicoes_adocao", id), { status, visualizado });
  };

  // Injeção de dependências e renderização do componente correspondente
  const renderTabContent = () => {
    switch (currentTab) {
      case "dashboard":
        return <DashboardTab produtos={produtos} pets={pets} />;
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
        return (
          <PetsAdocaoTab
            pets={pets}
            requisicoes={requisicoes}
            loading={loading}
            onAddPet={handleAddPet}
            onEditPet={handleEditPet}
            onDeletePet={handleDeletePet}
            onUpdateRequisicao={handleUpdateRequisicao}
          />
        );
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
      {/* Barra Superior de Ferramentas / Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          style={[styles.backButton, { backgroundColor: theme.surface }]}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={theme.text} />
          <Text style={[styles.backButtonText, { color: theme.text }]}>
            Voltar para Home
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Painel Geral
        </Text>
      </View>

      {/* Menu Horizontal de Abas */}
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

      {/* Área de Visualização das Listagens */}
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
  safe: {
    flex: 1,
  },
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
  backButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
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
  tabLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
