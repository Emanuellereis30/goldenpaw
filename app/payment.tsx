import { useAppTheme } from "@/hooks/use-app-theme";
import { useCart } from "@/hooks/use-cart";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../firebaseConfig";

type PaymentMethod = "card" | "pix" | "boleto";

interface DeliveryInfo {
  distance: number;
  fee: number;
}

interface CepData {
  latitude: number;
  longitude: number;
}

// Coordenadas da loja (Golden Paw) - exemplo: São Paulo
const STORE_LAT = -23.5505;
const STORE_LNG = -46.6333;

// Função para calcular distância em km usando Haversine
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Função para calcular valor de entrega baseado em distância
const calculateDeliveryFee = (distance: number): number => {
  const baseFee = 10.0;
  const perKm = 2.5;
  return baseFee + distance * perKm;
};

// Função para buscar coordenadas do CEP via ViaCEP
// Simular cálculo de distância baseado em CEP (em produção, integrar com API real)
const simulateDistanceFromCep = (cep: string): number => {
  // Usa os dígitos do CEP para gerar uma distância pseudo-aleatória mas consistente
  const cepNum = parseInt(cep.substring(0, 5));
  const distance = 5 + (cepNum % 30); // Simula 5-35 km
  return distance;
};

export default function PaymentScreen() {
  const { cart, calculateTotal, createOrder, clearCart } = useCart();
  const { theme } = useAppTheme();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const user = auth.currentUser;
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [cep, setCep] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [loadingDelivery, setLoadingDelivery] = useState(false);
  const [pixData, setPixData] = useState("");
  const [boletoData, setBoletoData] = useState("");

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
  };

  // Função para buscar e calcular entrega
  const handleCepChange = (text: string) => {
    setCep(text);
    if (text.length === 8) {
      setLoadingDelivery(true);
      setTimeout(() => {
        const distance = simulateDistanceFromCep(text);
        const fee = calculateDeliveryFee(distance);
        setDeliveryInfo({ distance, fee });
        setPixData(generatePixKey());
        setLoadingDelivery(false);
      }, 500);
    }
  };

  // Gerar chave PIX aleatória (mock)
  const generatePixKey = () => {
    return "goldenpaw-" + Math.random().toString(36).substring(7);
  };

  // Gerar código de boleto (mock - em produção, integrar com Gerencianet)
  const generateBoletoCode = () => {
    const code = Math.random().toString().substring(2, 47).padEnd(47, "0");
    setBoletoData(code);
  };

  const handlePay = async () => {
    if (!user) {
      Alert.alert(
        "Login necessário",
        "Faça login para continuar com o pagamento.",
      );
      router.replace("/login");
      return;
    }

    if (cart.length === 0) {
      Alert.alert(
        "Carrinho vazio",
        "Adicione produtos antes de realizar o pagamento.",
      );
      return;
    }

    if (!cep || cep.length < 8) {
      Alert.alert("CEP inválido", "Por favor, digite um CEP válido.");
      return;
    }

    if (!deliveryInfo) {
      Alert.alert(
        "Entrega não calculada",
        "Por favor, aguarde o cálculo da entrega.",
      );
      return;
    }

    if (
      paymentMethod === "card" &&
      (!cardName || !cardNumber || !cardExpiry || !cardCvv)
    ) {
      Alert.alert(
        "Dados incompletos",
        "Por favor, preencha todos os dados do cartão.",
      );
      return;
    }

    if (paymentMethod === "boleto" && !boletoData) {
      generateBoletoCode();
      return;
    }

    setProcessing(true);
    setTimeout(async () => {
      try {
        await createOrder("confirmado", paymentMethod, cep);
        clearCart();
        Alert.alert(
          "Pagamento confirmado",
          `Seu pedido foi processado com sucesso! Entrega em ${deliveryInfo.distance.toFixed(1)}km. Obrigado pela compra.`,
        );
        router.replace("/");
      } catch (error) {
        Alert.alert("Erro", "Falha ao processar o pedido. Tente novamente.");
      } finally {
        setProcessing(false);
      }
    }, 1500);
  };

  if (!user) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
          },
        ]}
      >
        <Text
          style={[
            styles.title,
            { color: theme.text, textAlign: "center", marginBottom: 16 },
          ]}
        >
          Faça login para acessar o pagamento
        </Text>
        <TouchableOpacity
          style={[
            styles.checkoutButton,
            {
              backgroundColor: theme.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
            },
          ]}
          onPress={() => router.replace("/login")}
        >
          <Text style={styles.checkoutButtonText}>Ir para Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const subtotal = parseFloat(calculateTotal().replace(",", "."));
  const deliveryFee = deliveryInfo?.fee ?? 15.0;
  const total = subtotal + deliveryFee;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <Text style={[styles.title, { color: theme.text }]}>
        Resumo do Pedido
      </Text>

      {/* Carrinho */}
      <View
        style={[
          styles.section,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Meu Carrinho
        </Text>
        {cart.map((item) => (
          <View key={item.cartId} style={styles.cartItem}>
            <Image
              source={item.image}
              style={styles.itemImage}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemName, { color: theme.text }]}>
                {item.nome}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                {item.quantity}x
              </Text>
            </View>
            <Text style={[styles.itemPrice, { color: theme.primary }]}>
              {item.preco}
            </Text>
          </View>
        ))}
      </View>

      {/* CEP */}
      <View
        style={[
          styles.section,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Endereço de Entrega
        </Text>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <TextInput
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text, flex: 1 },
            ]}
            placeholder="Digite seu CEP"
            placeholderTextColor={theme.textSecondary}
            value={cep}
            onChangeText={handleCepChange}
            maxLength={8}
            keyboardType="numeric"
            editable={!loadingDelivery}
          />
          {loadingDelivery && <ActivityIndicator color={theme.primary} />}
        </View>
        {deliveryInfo && (
          <View
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: theme.border,
            }}
          >
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
              Distância: {deliveryInfo.distance.toFixed(1)} km
            </Text>
            <Text
              style={[
                { color: theme.primary, fontWeight: "600", marginTop: 4 },
              ]}
            >
              Frete: R$ {deliveryInfo.fee.toFixed(2).replace(".", ",")}
            </Text>
          </View>
        )}
      </View>

      {/* Formas de Pagamento */}
      <View
        style={[
          styles.section,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Forma de Pagamento
        </Text>

        {/* Cartão de Crédito */}
        <TouchableOpacity
          style={[
            styles.paymentOption,
            paymentMethod === "card" && {
              borderColor: theme.primary,
              borderWidth: 2,
            },
            { borderColor: theme.border },
          ]}
          onPress={() => handlePaymentMethodChange("card")}
        >
          <Ionicons
            name="card"
            size={20}
            color={
              paymentMethod === "card" ? theme.primary : theme.textSecondary
            }
          />
          <Text style={[styles.paymentLabel, { color: theme.text }]}>
            Cartão de Crédito
          </Text>
          <Ionicons
            name={
              paymentMethod === "card" ? "radio-button-on" : "radio-button-off"
            }
            size={20}
            color={theme.primary}
          />
        </TouchableOpacity>

        {paymentMethod === "card" && (
          <View style={styles.cardFields}>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.border,
                  color: theme.text,
                  marginBottom: 10,
                },
              ]}
              placeholder="Nome no cartão"
              placeholderTextColor={theme.textSecondary}
              value={cardName}
              onChangeText={setCardName}
            />
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.border,
                  color: theme.text,
                  marginBottom: 10,
                },
              ]}
              placeholder="Número do cartão"
              placeholderTextColor={theme.textSecondary}
              value={cardNumber}
              onChangeText={setCardNumber}
              keyboardType="numeric"
              maxLength={16}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TextInput
                style={[
                  styles.input,
                  { borderColor: theme.border, color: theme.text, flex: 1 },
                ]}
                placeholder="MM/AA"
                placeholderTextColor={theme.textSecondary}
                value={cardExpiry}
                onChangeText={setCardExpiry}
                keyboardType="numeric"
                maxLength={5}
              />
              <TextInput
                style={[
                  styles.input,
                  { borderColor: theme.border, color: theme.text, flex: 1 },
                ]}
                placeholder="CVV"
                placeholderTextColor={theme.textSecondary}
                value={cardCvv}
                onChangeText={setCardCvv}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
          </View>
        )}

        {/* PIX */}
        <TouchableOpacity
          style={[
            styles.paymentOption,
            paymentMethod === "pix" && {
              borderColor: theme.primary,
              borderWidth: 2,
            },
            { borderColor: theme.border },
          ]}
          onPress={() => handlePaymentMethodChange("pix")}
        >
          <Ionicons
            name="qr-code"
            size={20}
            color={
              paymentMethod === "pix" ? theme.primary : theme.textSecondary
            }
          />
          <Text style={[styles.paymentLabel, { color: theme.text }]}>PIX</Text>
          <Ionicons
            name={
              paymentMethod === "pix" ? "radio-button-on" : "radio-button-off"
            }
            size={20}
            color={theme.primary}
          />
        </TouchableOpacity>

        {/* Boleto */}
        <TouchableOpacity
          style={[
            styles.paymentOption,
            paymentMethod === "boleto" && {
              borderColor: theme.primary,
              borderWidth: 2,
            },
            { borderColor: theme.border },
          ]}
          onPress={() => {
            handlePaymentMethodChange("boleto");
            generateBoletoCode();
          }}
        >
          <Ionicons
            name="document-text"
            size={20}
            color={
              paymentMethod === "boleto" ? theme.primary : theme.textSecondary
            }
          />
          <Text style={[styles.paymentLabel, { color: theme.text }]}>
            Boleto
          </Text>
          <Ionicons
            name={
              paymentMethod === "boleto"
                ? "radio-button-on"
                : "radio-button-off"
            }
            size={20}
            color={theme.primary}
          />
        </TouchableOpacity>

        {/* Exibição do QR Code PIX */}
        {paymentMethod === "pix" && pixData && (
          <View
            style={[
              styles.pixContainer,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
          >
            <Text
              style={[
                styles.paymentLabel,
                { color: theme.text, marginBottom: 12 },
              ]}
            >
              Chave PIX
            </Text>
            <View
              style={[
                styles.pixKeyBox,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.pixKey, { color: theme.text }]}>
                {pixData}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.copyButton, { backgroundColor: theme.primary }]}
              onPress={() => {
                Clipboard.setString(pixData);
                Alert.alert(
                  "Copiado",
                  "Chave PIX copiada para a área de transferência!",
                );
              }}
            >
              <Ionicons
                name="copy"
                size={16}
                color="#FFF"
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: "#FFF", fontWeight: "600" }}>
                Copiar Chave PIX
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Exibição do Código de Boleto */}
        {paymentMethod === "boleto" && boletoData && (
          <View
            style={[
              styles.boletoContainer,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
          >
            <Text
              style={[
                styles.paymentLabel,
                { color: theme.text, marginBottom: 12 },
              ]}
            >
              Código de Barras
            </Text>
            <View
              style={[
                styles.boletoCodeBox,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.boletoCode, { color: theme.text }]}>
                {boletoData}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.copyButton, { backgroundColor: theme.primary }]}
              onPress={() => {
                Alert.alert(
                  "Copiado",
                  "Código do boleto copiado para a área de transferência!",
                );
              }}
            >
              <Ionicons
                name="copy"
                size={16}
                color="#FFF"
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: "#FFF", fontWeight: "600" }}>
                Copiar Código
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Resumo */}
      <View
        style={[
          styles.section,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={[styles.summaryRow, { borderBottomColor: theme.border }]}>
          <Text style={{ color: theme.textSecondary }}>Subtotal</Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            R$ {subtotal.toFixed(2).replace(".", ",")}
          </Text>
        </View>
        <View style={[styles.summaryRow, { borderBottomColor: theme.border }]}>
          <Text style={{ color: theme.textSecondary }}>Entrega</Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            R$ {deliveryFee.toFixed(2).replace(".", ",")}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[{ color: theme.text, fontWeight: "700" }]}>Total</Text>
          <Text style={[styles.totalValue, { color: theme.primary }]}>
            R$ {total.toFixed(2).replace(".", ",")}
          </Text>
        </View>
      </View>

      {/* Botão de Pagamento */}
      <TouchableOpacity
        style={[styles.payButton, { backgroundColor: theme.primary }]}
        onPress={handlePay}
        disabled={processing}
      >
        <Text style={styles.payButtonText}>
          {processing ? "Processando..." : "Confirmar Pagamento"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text
          style={[
            { color: theme.primary, textAlign: "center", fontWeight: "600" },
          ]}
        >
          Voltar
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 16 },
  section: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  cartItem: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  itemImage: { width: 50, height: 50, marginRight: 12, borderRadius: 8 },
  itemName: { fontSize: 13, fontWeight: "600", marginBottom: 4 },
  itemPrice: { fontSize: 13, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  paymentLabel: { flex: 1, fontSize: 14, fontWeight: "600" },
  cardFields: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  pixContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  pixKeyBox: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 12 },
  pixKey: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "monospace",
  },
  boletoContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  boletoCodeBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  boletoCode: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  copyButton: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  summaryValue: { fontSize: 14, fontWeight: "600" },
  totalValue: { fontSize: 16, fontWeight: "800" },
  payButton: {
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  payButtonText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  backButton: { paddingVertical: 12, marginBottom: 30 },
  checkoutButton: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkoutButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
