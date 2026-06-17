// app/sobre.tsx — Tela "Informações do App"
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    Image,
    Linking,
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
import { useFontSize } from "../contexts/FontSizeContext";
import { useAppTheme } from "../hooks/use-app-theme";

const APP_INFO = {
  nome: "Golden Paw",
  versao: "1.0.0",
  descricao:
    "Golden Paw foi criado para facilitar a vida de quem ama seus pets. Guarde todas as informações do seu pet, receba lembretes para facilitar o dia a dia, explore nossa loja e até transforme uma vida através da adoção. Praticidade e amor na palma da sua mão.",
  desenvolvedores: [
    "Carlos Eduardo Rufino",
    "Emanuelle Vieira",
    "Gabriele dos Santos",
    "Gabriel Rodrigues",
    "Gabriel Reginatto",
    "Rayssa Gomes",
  ],
  contato: "contato@goldenpaw.com",
  politicaPrivacidade: "https://goldenpaw.com/privacidade",
};

const IMAGES = {
  logo: require("../assets/img/logo.png"),
};

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
  primaryColor: string;
  textColor: string;
  secondaryColor: string;
  fontSize: number;
  borderColor: string;
}

function InfoRow({
  icon,
  label,
  value,
  onPress,
  primaryColor,
  textColor,
  secondaryColor,
  fontSize,
  borderColor,
}: InfoRowProps) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={[styles.infoRow, { borderBottomColor: borderColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: `${primaryColor}18` }]}>
        <Ionicons name={icon} size={20} color={primaryColor} />
      </View>
      <View style={styles.infoContent}>
        <Text
          style={[
            styles.infoLabel,
            { color: secondaryColor, fontSize: fontSize - 3 },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.infoValue,
            { color: onPress ? primaryColor : textColor, fontSize: fontSize },
          ]}
        >
          {value}
        </Text>
      </View>
      {onPress && (
        <Ionicons name="open-outline" size={16} color={primaryColor} />
      )}
    </Wrapper>
  );
}

export default function SobreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, colorScheme } = useAppTheme();
  const { fontSize } = useFontSize();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* ── Cabeçalho ── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.background }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: theme.text, fontSize: fontSize + 2 },
          ]}
        >
          Informações do App
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Logo / Destaque ── */}
        <View style={styles.heroSection}>
          <View
            style={[
              styles.logoCircle,
              {
                backgroundColor: theme.surface,
                borderColor: theme.primary,
                borderWidth: 2,
              },
            ]}
          >
            <Image
              source={IMAGES.logo}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text
            style={[
              styles.appName,
              { color: theme.text, fontSize: fontSize + 10 },
            ]}
          >
            {APP_INFO.nome}
          </Text>
          <View
            style={[
              styles.versionBadge,
              {
                backgroundColor: `${theme.primary}20`,
                borderColor: theme.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.versionBadgeText,
                { color: theme.primary, fontSize: fontSize - 2 },
              ]}
            >
              v{APP_INFO.versao}
            </Text>
          </View>
          <Text
            style={[
              styles.appDescription,
              { color: theme.textSecondary, fontSize: fontSize - 1 },
            ]}
          >
            {APP_INFO.descricao}
          </Text>
        </View>

        {/* ── Card: Detalhes ── */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              { color: theme.text, fontSize: fontSize },
            ]}
          >
            Detalhes
          </Text>

          <InfoRow
            icon="apps-outline"
            label="Nome do Aplicativo"
            value={APP_INFO.nome}
            primaryColor={theme.primary}
            textColor={theme.text}
            secondaryColor={theme.textSecondary}
            fontSize={fontSize}
            borderColor={theme.border}
          />
          <InfoRow
            icon="git-branch-outline"
            label="Versão"
            value={APP_INFO.versao}
            primaryColor={theme.primary}
            textColor={theme.text}
            secondaryColor={theme.textSecondary}
            fontSize={fontSize}
            borderColor={theme.border}
          />
        </View>

        {/* ── Card: Desenvolvedores ── */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              { color: theme.text, fontSize: fontSize },
            ]}
          >
            Desenvolvedores
          </Text>
          {APP_INFO.desenvolvedores.map((dev, index) => (
            <View
              key={index}
              style={[
                styles.devRow,
                {
                  borderBottomColor: theme.border,
                  borderBottomWidth:
                    index < APP_INFO.desenvolvedores.length - 1 ? 1 : 0,
                },
              ]}
            >
              <View
                style={[styles.devAvatar, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.devAvatarText}>
                  {dev
                    .trim()
                    .split(" ")
                    .map((p) => p.charAt(0))
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </Text>
              </View>
              <Text
                style={[
                  styles.devName,
                  { color: theme.text, fontSize: fontSize },
                ]}
              >
                {dev}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Card: Contato & Política ── */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              { color: theme.text, fontSize: fontSize },
            ]}
          >
            Contato & Legal
          </Text>

          <InfoRow
            icon="mail-outline"
            label="E-mail de Contato"
            value={APP_INFO.contato}
            onPress={() => Linking.openURL(`mailto:${APP_INFO.contato}`)}
            primaryColor={theme.primary}
            textColor={theme.text}
            secondaryColor={theme.textSecondary}
            fontSize={fontSize}
            borderColor={theme.border}
          />
          <InfoRow
            icon="shield-checkmark-outline"
            label="Política de Privacidade"
            value="Ler política de privacidade"
            onPress={() => Linking.openURL(APP_INFO.politicaPrivacidade)}
            primaryColor={theme.primary}
            textColor={theme.text}
            secondaryColor={theme.textSecondary}
            fontSize={fontSize}
            borderColor="transparent"
          />
        </View>

        {/* ── Rodapé ── */}
        <Text
          style={[
            styles.footer,
            { color: theme.textSecondary, fontSize: fontSize - 3 },
          ]}
        >
          © {new Date().getFullYear()} Golden Paw. Todos os direitos reservados.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Cabeçalho ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontWeight: "700" },

  // ── Hero ──
  scroll: { paddingHorizontal: 20, paddingTop: 24 },
  heroSection: { alignItems: "center", marginBottom: 28 },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: "hidden",
  },
  logoImage: {
    width: 70,
    height: 70,
  },
  appName: { fontWeight: "800", marginBottom: 8 },
  versionBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 14,
  },
  versionBadgeText: { fontWeight: "700" },
  appDescription: {
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 8,
  },

  // ── Cards ──
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  cardTitle: {
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  // ── Linhas de info ──
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontWeight: "500", marginBottom: 2 },
  infoValue: { fontWeight: "600" },

  // ── Desenvolvedores ──
  devRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  devAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  devAvatarText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  devName: { fontWeight: "600" },

  // ── Rodapé ──
  footer: {
    textAlign: "center",
    marginTop: 8,
    marginBottom: 8,
  },
});
