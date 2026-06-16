import { useNotification } from "@/contexts/NotificationContext"; // ← importação adicionada
import { useAppTheme } from "@/hooks/use-app-theme";
import { useCart } from "@/hooks/use-cart";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Clipboard,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../firebaseConfig";

type PaymentMethod = "card" | "pix" | "boleto";

interface DeliveryInfo {
  distance: number;
  fee: number;
}

const calculateDeliveryFee = (distance: number): number => {
  const baseFee = 10.0;
  const perKm = 2.5;
  return baseFee + distance * perKm;
};

const simulateDistanceFromCep = (cep: string): number => {
  const cepNum = parseInt(cep.substring(0, 5) || "0");
  const distance = 5 + (cepNum % 30);
  return distance;
};

export default function PaymentScreen() {
  const { cart, calculateTotal, createOrder, clearCart } = useCart();
  const { theme } = useAppTheme();
  const { showNotification } = useNotification(); // ← adicionado
  const router = useRouter();
  const user = auth.currentUser;

  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");

  // Estados de Contato
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");

  // Estados de Endereço
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // Estados de Cartão
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [installments, setInstallments] = useState(1);

  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [loadingDelivery, setLoadingDelivery] = useState(false);
  const [pixData, setPixData] = useState("");
  const [boletoData, setBoletoData] = useState("");

  // Tenta preencher automaticamente os dados do cliente caso existam no banco
  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        try {
          const docRef = doc(db, "usuarios", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.nome) setCheckoutName(data.nome);
            if (data.email) setCheckoutEmail(data.email);
            if (data.telefone) setCheckoutPhone(data.telefone);
          } else if (user.email) {
            setCheckoutEmail(user.email);
          }
        } catch (e) {
          console.log("Erro ao buscar dados do usuário", e);
        }
      };
      fetchUserData();
    }
  }, [user]);

  const subtotal = parseFloat(calculateTotal().replace(",", "."));
  const deliveryFee = deliveryInfo?.fee ?? 15.0;
  const total = subtotal + deliveryFee;

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
  };

  const maskCep = (v: string) => {
    v = v.replace(/\D/g, "");
    v = v.replace(/(\d{5})(\d)/, "$1-$2");
    return v;
  };

  const maskPhone = (v: string) => {
    v = v.replace(/\D/g, "");
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d{5})(\d)/, "$1-$2");
    return v;
  };

  const handleCardNumberChange = (text: string) => {
    let v = text.replace(/\D/g, "");
    v = v.replace(/(\d{4})(?=\d)/g, "$1.");
    setCardNumber(v);
  };

  const handleCardExpiryChange = (text: string) => {
    let v = text.replace(/\D/g, "");
    v = v.replace(/(\d{2})(\d)/, "$1/$2");
    setCardExpiry(v);
  };

  const handleCardCvvChange = (text: string) => {
    let v = text.replace(/\D/g, "");
    setCardCvv(v);
  };

  const handleCepChange = async (text: string) => {
    const formatted = maskCep(text);
    setCep(formatted);
    const cleanCep = formatted.replace(/\D/g, "");

    if (cleanCep.length === 8) {
      setLoadingDelivery(true);
      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${cleanCep}/json/`,
        );
        const data = await response.json();

        if (!data.erro) {
          setStreet(data.logradouro);
          setNeighborhood(data.bairro);
          setCity(data.localidade);
          setState(data.uf);
        }

        const distance = simulateDistanceFromCep(cleanCep);
        const fee = calculateDeliveryFee(distance);
        setDeliveryInfo({ distance, fee });
        setPixData(generatePixKey());
      } catch (e) {
        showNotification(
          "Erro",
          "Não foi possível buscar o endereço pelo CEP.",
          "error"
        );
      } finally {
        setLoadingDelivery(false);
      }
    }
  };

  const generatePixKey = () =>
    "goldenpaw-" + Math.random().toString(36).substring(7);

  const generateBoletoCode = () => {
    const code = Math.random().toString().substring(2, 47).padEnd(47, "0");
    setBoletoData(code);
  };

  const handlePay = async () => {
    if (!user) {
      showNotification("Login necessário", "Faça login para continuar.", "info");
      router.replace("/login");
      return;
    }

    if (cart.length === 0) {
      showNotification("Carrinho vazio", "Adicione produtos antes de pagar.", "info");
      return;
    }

    // Validação de Dados Pessoais
    if (!checkoutName || !checkoutEmail || !checkoutPhone) {
      showNotification(
        "Dados incompletos",
        "Por favor, preencha seus dados de contato.",
        "error"
      );
      return;
    }

    // Validação de Endereço
    if (!cep || !street || !addressNumber || !neighborhood || !city || !state) {
      showNotification(
        "Endereço incompleto",
        "Por favor, preencha todos os campos de entrega.",
        "error"
      );
      return;
    }

    if (!deliveryInfo) {
      showNotification(
        "Entrega não calculada",
        "Por favor, aguarde o cálculo da entrega.",
        "error"
      );
      return;
    }

    if (
      paymentMethod === "card" &&
      (!cardName || !cardNumber || !cardExpiry || !cardCvv)
    ) {
      showNotification(
        "Dados incompletos",
        "Por favor, preencha todos os dados do cartão.",
        "error"
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
        const fullAddress = `${street}, ${addressNumber} - ${neighborhood}, ${city}/${state} - CEP: ${cep}`;

        await createOrder(
          "confirmado",
          paymentMethod,
          fullAddress,
          installments,
          checkoutName,
          checkoutEmail,
          checkoutPhone,
        );

        const parcelamentoMsg =
          paymentMethod === "card" ? ` em ${installments}x` : "";
        showNotification(
          "Pagamento confirmado ✅",
          `Pedido processado com sucesso${parcelamentoMsg}! Entrega em ${deliveryInfo.distance.toFixed(1)}km.`,
          "success"
        );
        router.replace("/");
      } catch (error) {
        showNotification(
          "Erro",
          "Falha ao processar o pedido. Tente novamente.",
          "error"
        );
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
          style={[styles.checkoutButton, { backgroundColor: theme.primary }]}
          onPress={() => router.replace("/login")}
        >
          <Text style={styles.checkoutButtonText}>Ir para Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={[styles.title, { color: theme.text }]}>
        Finalizar Compra
      </Text>

      {/* Dados de Contato */}
      <View
        style={[
          styles.section,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Dados de Contato
        </Text>

        <TextInput
          style={[
            styles.input,
            { borderColor: theme.border, color: theme.text, marginBottom: 10 },
          ]}
          placeholder="Nome Completo"
          placeholderTextColor={theme.textSecondary}
          value={checkoutName}
          onChangeText={setCheckoutName}
        />
        <TextInput
          style={[
            styles.input,
            { borderColor: theme.border, color: theme.text, marginBottom: 10 },
          ]}
          placeholder="E-mail"
          placeholderTextColor={theme.textSecondary}
          value={checkoutEmail}
          onChangeText={setCheckoutEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={[
            styles.input,
            { borderColor: theme.border, color: theme.text },
          ]}
          placeholder="Celular"
          placeholderTextColor={theme.textSecondary}
          value={checkoutPhone}
          onChangeText={(t) => setCheckoutPhone(maskPhone(t))}
          keyboardType="phone-pad"
          maxLength={15}
        />
      </View>

      {/* Endereço de Entrega */}
      <View
        style={[
          styles.section,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Endereço de Entrega
        </Text>

        <View
          style={{
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <TextInput
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text, flex: 1 },
            ]}
            placeholder="CEP"
            placeholderTextColor={theme.textSecondary}
            value={cep}
            onChangeText={handleCepChange}
            maxLength={9}
            keyboardType="numeric"
            editable={!loadingDelivery}
          />
          {loadingDelivery && <ActivityIndicator color={theme.primary} />}
        </View>

        <TextInput
          style={[
            styles.input,
            { borderColor: theme.border, color: theme.text, marginBottom: 10 },
          ]}
          placeholder="Rua"
          placeholderTextColor={theme.textSecondary}
          value={street}
          onChangeText={setStreet}
        />

        <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
          <TextInput
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text, flex: 1 },
            ]}
            placeholder="Nº"
            placeholderTextColor={theme.textSecondary}
            value={addressNumber}
            onChangeText={setAddressNumber}
            keyboardType="numeric"
          />
          <TextInput
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text, flex: 2 },
            ]}
            placeholder="Bairro"
            placeholderTextColor={theme.textSecondary}
            value={neighborhood}
            onChangeText={setNeighborhood}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <TextInput
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text, flex: 3 },
            ]}
            placeholder="Cidade"
            placeholderTextColor={theme.textSecondary}
            value={city}
            onChangeText={setCity}
          />
          <TextInput
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text, flex: 1 },
            ]}
            placeholder="UF"
            placeholderTextColor={theme.textSecondary}
            value={state}
            onChangeText={setState}
            maxLength={2}
          />
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
              Distância estimada: {deliveryInfo.distance.toFixed(1)} km
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

      {/* Carrinho Resumo */}
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
              onChangeText={handleCardNumberChange}
              keyboardType="numeric"
              maxLength={19}
            />
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
              <TextInput
                style={[
                  styles.input,
                  { borderColor: theme.border, color: theme.text, flex: 1 },
                ]}
                placeholder="MM/AA"
                placeholderTextColor={theme.textSecondary}
                value={cardExpiry}
                onChangeText={handleCardExpiryChange}
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
                onChangeText={handleCardCvvChange}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            {/* Seleção de Parcelas (Até 6x) */}
            <Text
              style={[
                styles.paymentLabel,
                { color: theme.text, marginTop: 10, marginBottom: 8 },
              ]}
            >
              Parcelamento
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 5 }}
            >
              {[1, 2, 3, 4, 5, 6].map((num) => {
                const installmentValue = total / num;
                const isSelected = installments === num;
                return (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.installmentChip,
                      { borderColor: theme.border },
                      isSelected && {
                        backgroundColor: theme.primary,
                        borderColor: theme.primary,
                      },
                    ]}
                    onPress={() => setInstallments(num)}
                  >
                    <Text
                      style={{
                        color: isSelected ? "#FFF" : theme.text,
                        fontWeight: isSelected ? "bold" : "normal",
                      }}
                    >
                      {num}x de R${" "}
                      {installmentValue.toFixed(2).replace(".", ",")}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
            { borderColor: theme.border, marginTop: 10 },
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
                showNotification("Copiado", "Chave PIX copiada!", "success");
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
                showNotification("Copiado", "Código do boleto copiado!", "success");
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
  // … estilos mantidos exatamente como antes …
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
  installmentChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
  },
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
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  checkoutButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
});