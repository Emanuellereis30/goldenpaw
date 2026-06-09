import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import React, { createContext, useContext, useMemo, useState } from "react";
import { Alert } from "react-native";
import { auth, db } from "../firebaseConfig";

export type CartItem = {
  id: string;
  nome: string;
  preco: string;
  image: any;
  tag?: string;
  cartId: string;
  quantity: number;
  category: string;
};

type CartContextValue = {
  cart: CartItem[];
  addToCart: (product: Omit<CartItem, "cartId" | "quantity">) => void;
  removeFromCart: (cartId?: string) => void;
  increaseQuantity: (cartId?: string) => void;
  decreaseQuantity: (cartId?: string) => void;
  clearCart: () => void;
  calculateTotal: () => string;
  totalItems: number;
  createOrder: (
    status?: string,
    paymentMethod?: string,
    cep?: string,
  ) => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: Omit<CartItem, "cartId" | "quantity">) => {
    if (!auth.currentUser) {
      Alert.alert(
        "Login necessário",
        "Faça login para adicionar produtos ao carrinho.",
      );
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: (item.quantity ?? 1) + 1 }
            : item,
        );
      }
      const newItem: CartItem = {
        ...product,
        cartId: Math.random().toString(36).substr(2, 9),
        quantity: 1,
      } as CartItem;
      return [...prev, newItem];
    });
  };

  const removeFromCart = (cartId?: string) => {
    if (!cartId) return;
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const increaseQuantity = (cartId?: string) => {
    if (!cartId) return;
    setCart((prev) =>
      prev.map((item) =>
        item.cartId === cartId
          ? { ...item, quantity: (item.quantity ?? 1) + 1 }
          : item,
      ),
    );
  };

  const decreaseQuantity = (cartId?: string) => {
    if (!cartId) return;
    setCart((prev) =>
      prev
        .map((item) =>
          item.cartId === cartId
            ? { ...item, quantity: (item.quantity ?? 1) - 1 }
            : item,
        )
        .filter((item) => (item.quantity ?? 1) > 0),
    );
  };

  const clearCart = () => setCart([]);

  const calculateTotal = () => {
    const total = cart.reduce((acc, item) => {
      const qty = item.quantity ?? 1;
      const priceStr = item.preco
        .replace("R$ ", "")
        .replace(".", "")
        .replace(",", ".");
      return acc + parseFloat(priceStr) * qty;
    }, 0);
    return total.toFixed(2).replace(".", ",");
  };

  const totalItems = cart.reduce((acc, item) => acc + (item.quantity ?? 1), 0);

  const createOrder = async (
    status = "pendente",
    paymentMethod = "Não informado",
    cep = "",
  ) => {
    if (!auth.currentUser) {
      Alert.alert("Login necessário", "Faça login para finalizar a compra.");
      return;
    }

    if (cart.length === 0) {
      Alert.alert(
        "Carrinho vazio",
        "Adicione produtos antes de finalizar a compra.",
      );
      return;
    }

    try {
      const now = new Date();
      const dataFormatada = now.toLocaleDateString("pt-BR");
      const horarioFormatado = now.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Busca a ficha cadastral do usuário no Firestore para obter o endereço completo e contatos
      const userDocRef = doc(db, "usuarios", auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      let nomeCliente =
        auth.currentUser.displayName || auth.currentUser.email || "Cliente";
      let emailCliente = auth.currentUser.email || "Não informado";
      let telefoneCliente = "Não informado";
      let enderecoCompleto = cep ? `CEP: ${cep}` : "Não informado";

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        nomeCliente = userData.nome || nomeCliente;
        emailCliente = userData.email || emailCliente;
        telefoneCliente = userData.telefone || telefoneCliente;

        // Concatena os campos do perfil criando a linha de endereço completo
        const rua = userData.endereco || "Rua não preenchida";
        const cidade = userData.cidade || "";
        const estado = userData.estado || "";
        const cepFinal = cep || userData.cep || "";
        enderecoCompleto = `${rua}, ${cidade} - ${estado} (CEP: ${cepFinal})`;
      }

      const order = {
        userId: auth.currentUser.uid,
        clienteNome: nomeCliente,
        clienteEmail: emailCliente,
        clienteTelefone: telefoneCliente,
        data: dataFormatada,
        horario: horarioFormatado,
        metodoPagamento: paymentMethod,
        endereco: enderecoCompleto,
        status: status,
        total: calculateTotal(),
        createdAt: serverTimestamp(),
        itens: cart.map((item) => ({
          id: item.id,
          produtoNome: item.nome,
          preco: item.preco,
          quantidade: item.quantity,
        })),
      };

      await addDoc(collection(db, "pedidos"), order);
      clearCart();
      Alert.alert("Pedido enviado", "Seu pedido foi salvo com sucesso.");
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      Alert.alert(
        "Erro",
        "Não foi possível salvar o pedido. Tente novamente mais tarde.",
      );
    }
  };

  const value = useMemo(
    () => ({
      cart,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
      calculateTotal,
      totalItems,
      createOrder,
    }),
    [cart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
