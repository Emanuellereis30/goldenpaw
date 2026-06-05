import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DashboardTab from "./components/DashboardTab";
import FuncionariosTab from "./components/FuncionariosTab";
import PedidosTab from "./components/PedidosTab";
import PetsAdocaoTab from "./components/PetsAdocaoTab";
import ProdutosTab from "./components/ProdutosTab";
import UsuariosTab from "./components/UsuariosTab";
import {
  Funcionario,
  Pedido,
  Pet,
  Produto,
  RequisicaoAdocao,
  Usuario,
} from "./types/admin.types";

type TabType =
  | "dashboard"
  | "produtos"
  | "pedidos"
  | "usuarios"
  | "pets"
  | "funcionarios";

interface AdminTab {
  id: TabType;
  label: string;
  icon: string;
}

const tabs: AdminTab[] = [
  { id: "dashboard", label: "Dashboard", icon: "grid" },
  { id: "produtos", label: "Produtos", icon: "cube" },
  { id: "pedidos", label: "Pedidos", icon: "cart" },
  { id: "usuarios", label: "Usuários", icon: "people" },
  { id: "pets", label: "Pets em Adoção", icon: "heart" },
  { id: "funcionarios", label: "Funcionários", icon: "briefcase" },
];

interface AdminDashboardProps {
  produtos?: Produto[];
  pedidos?: Pedido[];
  usuarios?: Usuario[];
  pets?: Pet[];
  funcionarios?: Funcionario[];
  requisicoes?: RequisicaoAdocao[];
  onAddProduto?: (produto: Omit<Produto, "id">) => Promise<void>;
  onEditProduto?: (id: string, produto: Omit<Produto, "id">) => Promise<void>;
  onDeleteProduto?: (id: string) => Promise<void>;
  onAddPedido?: (pedido: Omit<Pedido, "id">) => Promise<void>;
  onUpdatePedidoStatus?: (
    id: string,
    status: Pedido["status"],
  ) => Promise<void>;
  onDeletePedido?: (id: string) => Promise<void>;
  onAddPet?: (pet: Omit<Pet, "id">) => Promise<void>;
  onEditPet?: (id: string, pet: Omit<Pet, "id">) => Promise<void>;
  onDeletePet?: (id: string) => Promise<void>;
  onUpdateRequisicao?: (
    id: string,
    status: "aprovado" | "rejeitado",
    visualizado: boolean,
  ) => Promise<void>;
  onAddFuncionario?: (funcionario: Omit<Funcionario, "id">) => Promise<void>;
  onEditFuncionario?: (
    id: string,
    funcionario: Omit<Funcionario, "id">,
  ) => Promise<void>;
  onDeleteFuncionario?: (id: string) => Promise<void>;
  onHomePress?: () => void;
}

export default function AdminDashboard({
  produtos = [],
  pedidos = [],
  usuarios = [],
  pets = [],
  funcionarios = [],
  requisicoes = [],
  onAddProduto,
  onEditProduto,
  onDeleteProduto,
  onAddPedido,
  onUpdatePedidoStatus,
  onDeletePedido,
  onAddPet,
  onEditPet,
  onDeletePet,
  onUpdateRequisicao,
  onAddFuncionario,
  onEditFuncionario,
  onDeleteFuncionario,
  onHomePress,
}: AdminDashboardProps) {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleGoHome = () => {
    if (onHomePress) {
      onHomePress();
    } else {
      router.push("/");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardTab
            produtos={produtos}
            pedidos={pedidos}
            usuarios={usuarios}
            pets={pets}
            loading={false}
          />
        );
      case "produtos":
        return (
          <ProdutosTab
            produtos={produtos}
            loading={false}
            onAddProduto={onAddProduto || (async () => {})}
            onEditProduto={onEditProduto || (async () => {})}
            onDeleteProduto={onDeleteProduto || (async () => {})}
          />
        );
      case "pedidos":
        return (
          <PedidosTab
            pedidos={pedidos}
            loading={false}
            onUpdateStatus={onUpdatePedidoStatus || (async () => {})}
            onDeletePedido={onDeletePedido || (async () => {})}
          />
        );
      case "usuarios":
        return <UsuariosTab usuarios={usuarios} loading={false} />;
      case "pets":
        return (
          <PetsAdocaoTab
            pets={pets}
            requisicoes={requisicoes}
            loading={false}
            onAddPet={onAddPet || (async () => {})}
            onEditPet={onEditPet || (async () => {})}
            onDeletePet={onDeletePet || (async () => {})}
            onUpdateRequisicao={onUpdateRequisicao || (async () => {})}
          />
        );
      case "funcionarios":
        return (
          <FuncionariosTab
            funcionarios={funcionarios}
            loading={false}
            onAddFuncionario={onAddFuncionario || (async () => {})}
            onEditFuncionario={onEditFuncionario || (async () => {})}
            onDeleteFuncionario={onDeleteFuncionario || (async () => {})}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: theme.background }]}>
      <View style={{ flex: 1, flexDirection: "row" }}>
        {/* Sidebar */}
        {sidebarOpen && (
          <View
            style={[
              {
                width: 200,
                backgroundColor: theme.surface,
                borderRightWidth: 1,
                borderRightColor: theme.border,
              },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ paddingVertical: 20, paddingHorizontal: 16 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: theme.text,
                    marginBottom: 24,
                  }}
                >
                  Admin
                </Text>

                {tabs.map((tab) => (
                  <TouchableOpacity
                    key={tab.id}
                    style={[
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 12,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        marginBottom: 8,
                        backgroundColor:
                          activeTab === tab.id
                            ? theme.primary + "20"
                            : "transparent",
                      },
                    ]}
                    onPress={() => setActiveTab(tab.id)}
                  >
                    <Ionicons
                      name={tab.icon as any}
                      size={20}
                      color={
                        activeTab === tab.id
                          ? theme.primary
                          : theme.textSecondary
                      }
                    />
                    <Text
                      style={{
                        marginLeft: 12,
                        fontSize: 14,
                        color:
                          activeTab === tab.id ? theme.primary : theme.text,
                        fontWeight: activeTab === tab.id ? "600" : "400",
                      }}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}

                {/* Divisor */}
                <View
                  style={{
                    height: 1,
                    backgroundColor: theme.border,
                    marginVertical: 16,
                  }}
                />

                {/* Botão Voltar para Home */}
                <TouchableOpacity
                  style={[
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      backgroundColor: theme.primary + "10",
                    },
                  ]}
                  onPress={handleGoHome}
                >
                  <Ionicons name="home" size={20} color={theme.primary} />
                  <Text
                    style={{
                      marginLeft: 12,
                      fontSize: 14,
                      color: theme.primary,
                      fontWeight: "600",
                    }}
                  >
                    Voltar para Home
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Main Content */}
        <View style={{ flex: 1, flexDirection: "column" }}>
          {/* Header */}
          <View
            style={[
              {
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: theme.surface,
                borderBottomWidth: 1,
                borderBottomColor: theme.border,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => setSidebarOpen(!sidebarOpen)}
              style={{ marginRight: 12 }}
            >
              <Ionicons
                name={sidebarOpen ? "chevron-back" : "menu"}
                size={24}
                color={theme.text}
              />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: theme.text,
                flex: 1,
              }}
            >
              {tabs.find((t) => t.id === activeTab)?.label || "Admin"}
            </Text>
          </View>

          {/* Content Area */}
          <View style={{ flex: 1 }}>{renderContent()}</View>
        </View>
      </View>
    </SafeAreaView>
  );
}
