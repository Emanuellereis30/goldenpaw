/**
 * ARQUIVO CORRIGIDO - COPIE PARA app/(tabs)/admin.tsx
 *
 * Este arquivo tem as props corretas para o AdminDashboard
 */

import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import AdminDashboard from "../admin/AdminDashboard";

// Importe do firebaseConfig da raiz
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";

// Importe os tipos
import {
  Funcionario,
  Pedido,
  Pet,
  Produto,
  RequisicaoAdocao,
  Usuario,
} from "../admin/types/admin.types";

export default function AdminScreen() {
  const [loading, setLoading] = useState(true);

  // Estados para guardar os dados do Firebase
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [requisicoes, setRequisicoes] = useState<RequisicaoAdocao[]>([]);

  // ============ FUNÇÕES DE CARREGAMENTO ============

  const carregarFuncionarios = async () => {
    try {
      const snapshot = await getDocs(collection(db, "funcionarios"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Funcionario[];
      setFuncionarios(data);
    } catch (error) {
      console.error("Erro ao carregar funcionários:", error);
    }
  };

  const carregarPets = async () => {
    try {
      const snapshot = await getDocs(collection(db, "pets"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Pet[];
      setPets(data);
    } catch (error) {
      console.error("Erro ao carregar pets:", error);
    }
  };

  const carregarProdutos = async () => {
    try {
      const snapshot = await getDocs(collection(db, "produtos"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Produto[];
      setProdutos(data);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  };

  const carregarPedidos = async () => {
    try {
      const snapshot = await getDocs(collection(db, "pedidos"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Pedido[];
      setPedidos(data);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    }
  };

  const carregarUsuarios = async () => {
    try {
      const snapshot = await getDocs(collection(db, "usuarios"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Usuario[];
      setUsuarios(data);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    }
  };

  const carregarRequisicoes = async () => {
    try {
      const snapshot = await getDocs(collection(db, "formularios_adocao"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as RequisicaoAdocao[];
      // Ordenar por data de criação (mais recentes primeiro)
      data.sort(
        (a, b) =>
          new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
      );
      setRequisicoes(data);
    } catch (error) {
      console.error("Erro ao carregar requisições de adoção:", error);
    }
  };

  // Carregar todos os dados quando a tela abrir
  useEffect(() => {
    const carregarTodos = async () => {
      setLoading(true);
      try {
        await Promise.all([
          carregarFuncionarios(),
          carregarPets(),
          carregarProdutos(),
          carregarPedidos(),
          carregarUsuarios(),
          carregarRequisicoes(),
        ]);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarTodos();
  }, []);

  // ============ FUNÇÕES DE FUNCIONÁRIOS ============

  const handleAddFuncionario = async (funcionario: Omit<Funcionario, "id">) => {
    try {
      await addDoc(collection(db, "funcionarios"), {
        ...funcionario,
        criadoEm: new Date().toISOString(),
      });
      await carregarFuncionarios();
    } catch (error) {
      console.error("Erro ao adicionar funcionário:", error);
      throw error;
    }
  };

  const handleEditFuncionario = async (
    id: string,
    funcionario: Omit<Funcionario, "id">,
  ) => {
    try {
      await updateDoc(doc(db, "funcionarios", id), {
        ...funcionario,
        atualizadoEm: new Date().toISOString(),
      });
      await carregarFuncionarios();
    } catch (error) {
      console.error("Erro ao editar funcionário:", error);
      throw error;
    }
  };

  const handleDeleteFuncionario = async (id: string) => {
    try {
      await deleteDoc(doc(db, "funcionarios", id));
      await carregarFuncionarios();
    } catch (error) {
      console.error("Erro ao deletar funcionário:", error);
      throw error;
    }
  };

  // ============ FUNÇÕES DE PETS ============

  const handleAddPet = async (pet: Omit<Pet, "id">) => {
    try {
      await addDoc(collection(db, "pets"), {
        ...pet,
        criadoEm: new Date().toISOString(),
        interessados: 0,
      });
      await carregarPets();
    } catch (error) {
      console.error("Erro ao adicionar pet:", error);
      throw error;
    }
  };

  const handleEditPet = async (id: string, pet: Omit<Pet, "id">) => {
    try {
      await updateDoc(doc(db, "pets", id), {
        ...pet,
        atualizadoEm: new Date().toISOString(),
      });
      await carregarPets();
    } catch (error) {
      console.error("Erro ao editar pet:", error);
      throw error;
    }
  };

  const handleDeletePet = async (id: string) => {
    try {
      await deleteDoc(doc(db, "pets", id));
      await carregarPets();
    } catch (error) {
      console.error("Erro ao deletar pet:", error);
      throw error;
    }
  };

  // ============ FUNÇÕES DE PRODUTOS ============

  const handleAddProduto = async (produto: Omit<Produto, "id">) => {
    try {
      await addDoc(collection(db, "produtos"), {
        ...produto,
        criadoEm: new Date().toISOString(),
      });
      await carregarProdutos();
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      throw error;
    }
  };

  const handleEditProduto = async (
    id: string,
    produto: Omit<Produto, "id">,
  ) => {
    try {
      await updateDoc(doc(db, "produtos", id), {
        ...produto,
        atualizadoEm: new Date().toISOString(),
      });
      await carregarProdutos();
    } catch (error) {
      console.error("Erro ao editar produto:", error);
      throw error;
    }
  };

  const handleDeleteProduto = async (id: string) => {
    try {
      await deleteDoc(doc(db, "produtos", id));
      await carregarProdutos();
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
      throw error;
    }
  };

  // ============ FUNÇÕES DE PEDIDOS ============

  const handleUpdatePedidoStatus = async (
    id: string,
    status: Pedido["status"],
  ) => {
    try {
      await updateDoc(doc(db, "pedidos", id), {
        status: status,
        atualizadoEm: new Date().toISOString(),
      });
      await carregarPedidos();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      throw error;
    }
  };

  const handleDeletePedido = async (id: string) => {
    try {
      await deleteDoc(doc(db, "pedidos", id));
      await carregarPedidos();
    } catch (error) {
      console.error("Erro ao deletar pedido:", error);
      throw error;
    }
  };

  // ============ FUNÇÕES DE REQUISIÇÕES DE ADOÇÃO ============

  const handleUpdateRequisicao = async (
    id: string,
    status: "aprovado" | "rejeitado",
    visualizado: boolean,
  ) => {
    try {
      await updateDoc(doc(db, "formularios_adocao", id), {
        status: status,
        visualizado: visualizado,
        atualizadoEm: new Date().toISOString(),
      });
      await carregarRequisicoes();
    } catch (error) {
      console.error("Erro ao atualizar requisição de adoção:", error);
      throw error;
    }
  };

  // ============ RENDER ============

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <AdminDashboard
      // Dados
      funcionarios={funcionarios}
      pets={pets}
      produtos={produtos}
      pedidos={pedidos}
      usuarios={usuarios}
      requisicoes={requisicoes}
      // Funções de Funcionários
      onAddFuncionario={handleAddFuncionario}
      onEditFuncionario={handleEditFuncionario}
      onDeleteFuncionario={handleDeleteFuncionario}
      // Funções de Pets
      onAddPet={handleAddPet}
      onEditPet={handleEditPet}
      onDeletePet={handleDeletePet}
      onUpdateRequisicao={handleUpdateRequisicao}
      // Funções de Produtos
      onAddProduto={handleAddProduto}
      onEditProduto={handleEditProduto}
      onDeleteProduto={handleDeleteProduto}
      // Funções de Pedidos
      onUpdatePedidoStatus={handleUpdatePedidoStatus}
      onDeletePedido={handleDeletePedido}
    />
  );
}
