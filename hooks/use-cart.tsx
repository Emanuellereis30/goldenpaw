import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { createContext, useContext, useMemo, useState } from "react";
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
    enderecoCompleto?: string,
    parcelas?: number,
    nome?: string,
    email?: string,
    telefone?: string,
  ) => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: Omit<CartItem, "cartId" | "quantity">) => {
    // A verificação de login agora é feita nos componentes (index.tsx, loja.tsx)
    // para permitir o uso do hook useNotification e do router.
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
    enderecoCompleto = "Não informado",
    parcelas = 1,
    nome = "",
    email = "",
    telefone = "",
  ) => {
    if (!auth.currentUser) return;

    if (cart.length === 0) return;

    try {
      const now = new Date();
      const dataFormatada = now.toLocaleDateString("pt-BR");
      const horarioFormatado = now.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Usa os dados que vieram do formulário de pagamento
      let nomeCliente =
        nome ||
        auth.currentUser.displayName ||
        auth.currentUser.email ||
        "Cliente";
      let emailCliente = email || auth.currentUser.email || "Não informado";
      let telefoneCliente = telefone || "Não informado";

      const order = {
        userId: auth.currentUser.uid,
        clienteNome: nomeCliente,
        clienteEmail: emailCliente,
        clienteTelefone: telefoneCliente,
        data: dataFormatada,
        horario: horarioFormatado,
        metodoPagamento: paymentMethod,
        parcelas: parcelas,
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
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      throw error;
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
