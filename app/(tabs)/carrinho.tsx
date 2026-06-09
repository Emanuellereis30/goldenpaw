import { useAppTheme } from "@/hooks/use-app-theme";
import { useCart } from "@/hooks/use-cart";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function CarrinhoScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    cart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    calculateTotal,
    totalItems,
  } = useCart();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 }, // Espaço para a TabBar
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Meu Carrinho
        </Text>

        {totalItems === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="cart-outline"
              size={80}
              color={theme.textSecondary}
            />
            <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
              O seu carrinho está vazio
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: theme.primary }]}
              onPress={() => router.push("/loja")}
            >
              <Text style={styles.emptyButtonText}>Ir para a Loja</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cartList}>
            {cart.map((item) => {
              // Verifica se a imagem é um URL da internet (Firebase) ou um ficheiro local (require)
              const imageSource =
                typeof item.image === "string"
                  ? { uri: item.image }
                  : item.image;

              return (
                <View
                  key={item.cartId}
                  style={[
                    styles.cartItem,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Image
                    source={imageSource}
                    style={styles.cartItemImage}
                    resizeMode="contain"
                  />
                  <View style={styles.cartItemInfo}>
                    <Text
                      style={[styles.productName, { color: theme.text }]}
                      numberOfLines={2}
                    >
                      {item.nome}
                    </Text>
                    <Text
                      style={[styles.productPrice, { color: theme.primary }]}
                    >
                      {item.preco}
                    </Text>
                  </View>
                  <View style={styles.quantityControl}>
                    <TouchableOpacity
                      onPress={() => decreaseQuantity(item.cartId!)}
                    >
                      <Ionicons
                        name="remove-circle-outline"
                        size={24}
                        color={theme.primary}
                      />
                    </TouchableOpacity>
                    <Text style={[styles.quantityText, { color: theme.text }]}>
                      {item.quantity ?? 1}
                    </Text>
                    <TouchableOpacity
                      onPress={() => increaseQuantity(item.cartId!)}
                    >
                      <Ionicons
                        name="add-circle-outline"
                        size={24}
                        color={theme.primary}
                      />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeFromCart(item.cartId!)}
                    style={styles.deleteButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={22} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              );
            })}

            <View style={[styles.cartFooter, { borderTopColor: theme.border }]}>
              <View style={styles.totalRow}>
                <Text
                  style={[styles.totalLabel, { color: theme.textSecondary }]}
                >
                  Total a pagar:
                </Text>
                <Text style={[styles.totalValue, { color: theme.text }]}>
                  R$ {calculateTotal()}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.checkoutButton,
                  { backgroundColor: theme.primary },
                ]}
                onPress={() => router.push("/payment")}
              >
                <Text style={styles.checkoutButtonText}>Finalizar Compra</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 20,
  },
  cartList: {
    marginBottom: 20,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cartItemImage: {
    width: 60,
    height: 60,
    marginRight: 15,
    borderRadius: 8,
  },
  cartItemInfo: {
    flex: 1,
    justifyContent: "center",
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "800",
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  quantityText: {
    marginHorizontal: 10,
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    marginLeft: 12,
    padding: 4,
  },
  cartFooter: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  checkoutButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  checkoutButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  emptyButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  emptyButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 15,
  },
});
