import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { createContext, useContext, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { auth, db } from '../firebaseConfig';

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
  addToCart: (product: Omit<CartItem, 'cartId' | 'quantity'>) => void;
  removeFromCart: (cartId?: string) => void;
  increaseQuantity: (cartId?: string) => void;
  decreaseQuantity: (cartId?: string) => void;
  clearCart: () => void;
  calculateTotal: () => string;
  totalItems: number;
  createOrder: (status?: string) => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: Omit<CartItem, 'cartId' | 'quantity'>) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: (item.quantity ?? 1) + 1 }
            : item
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
        item.cartId === cartId ? { ...item, quantity: (item.quantity ?? 1) + 1 } : item
      )
    );
  };

  const decreaseQuantity = (cartId?: string) => {
    if (!cartId) return;
    setCart((prev) =>
      prev
        .map((item) =>
          item.cartId === cartId
            ? { ...item, quantity: (item.quantity ?? 1) - 1 }
            : item
        )
        .filter((item) => (item.quantity ?? 1) > 0)
    );
  };

  const clearCart = () => setCart([]);

  const calculateTotal = () => {
    const total = cart.reduce((acc, item) => {
      const qty = item.quantity ?? 1;
      const priceStr = item.preco.replace('R$ ', '').replace('.', '').replace(',', '.');
      return acc + parseFloat(priceStr) * qty;
    }, 0);
    return total.toFixed(2).replace('.', ',');
  };

  const totalItems = cart.reduce((acc, item) => acc + (item.quantity ?? 1), 0);

  const createOrder = async (status = 'pending') => {
    if (cart.length === 0) {
      Alert.alert('Carrinho vazio', 'Adicione produtos antes de finalizar a compra.');
      return;
    }

    try {
      const order = {
        userId: auth.currentUser ? auth.currentUser.uid : null,
        items: cart.map((item) => ({ id: item.id, nome: item.nome, preco: item.preco, quantity: item.quantity })),
        total: calculateTotal(),
        createdAt: serverTimestamp(),
        status,
      };

      await addDoc(collection(db, 'pedidos'), order);
      clearCart();
      Alert.alert('Pedido enviado', 'Seu pedido foi salvo com sucesso.');
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      Alert.alert('Erro', 'Não foi possível salvar o pedido. Tente novamente mais tarde.');
    }
  };

  const value = useMemo(
    () => ({ cart, addToCart, removeFromCart, increaseQuantity, decreaseQuantity, clearCart, calculateTotal, totalItems, createOrder }),
    [cart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
