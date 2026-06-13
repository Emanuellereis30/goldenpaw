// app/profile.tsx
import { Feather, Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNotification } from "../contexts/NotificationContext";
import { auth, db } from "../firebaseConfig";
import { useAppTheme } from "../hooks/use-app-theme";

// ── Funções de Máscara ────────────────────────────────────────────────────────

const maskCpf = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length <= 11) {
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return v;
};

const maskPhone = (v: string) => {
  v = v.replace(/\D/g, "");
  v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
  v = v.replace(/(\d{5})(\d)/, "$1-$2");
  return v;
};

const maskCep = (v: string) => {
  v = v.replace(/\D/g, "");
  v = v.replace(/(\d{5})(\d)/, "$1-$2");
  return v;
};

// ── Tipos ─────────────────────────────────────────────────────────────────────

type StatusPedido =
  | "pendente"
  | "confirmado"
  | "enviado"
  | "entregue"
  | "cancelado";
type StatusAdocao =
  | "pendente"
  | "em análise"
  | "aprovado"
  | "adoção aprovada"
  | "reprovado"
  | "adoção reprovada";

interface ItemPedido {
  id?: string;
  produtoNome: string;
  preco: string;
  quantidade: number;
}

interface Pedido {
  id: string;
  userId?: string;
  status: StatusPedido;
  total?: string;
  createdAt?: any;
  data?: string;
  horario?: string;
  itens?: ItemPedido[];
  endereco?: string;
  metodoPagamento?: string;
  clienteNome?: string;
  clienteEmail?: string;
  clienteTelefone?: string;
  parcelas?: number;
}

interface Adocao {
  id: string;
  status: StatusAdocao;
  petNome?: string;
  petRaca?: string;
  petPorte?: string;
  petSexo?: string;
  criadoEm?: string;
  data?: string;
  clienteNome?: string;
  nomeCompleto?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  observacoes?: string;
  motivo?: string;
  motivoReprovacao?: string;
}

// ── Helpers de Status ─────────────────────────────────────────────────────────

const STATUS_PEDIDO_CONFIG: Record<
  StatusPedido,
  { label: string; color: string; bg: string; icon: string }
> = {
  pendente: {
    label: "Pendente",
    color: "#D97706",
    bg: "#FEF3C7",
    icon: "time-outline",
  },
  confirmado: {
    label: "Confirmado",
    color: "#2563EB",
    bg: "#DBEAFE",
    icon: "checkmark-circle-outline",
  },
  enviado: {
    label: "Enviado",
    color: "#7C3AED",
    bg: "#EDE9FE",
    icon: "cube-outline",
  },
  entregue: {
    label: "Entregue",
    color: "#059669",
    bg: "#D1FAE5",
    icon: "checkmark-done-circle-outline",
  },
  cancelado: {
    label: "Cancelado",
    color: "#DC2626",
    bg: "#FEE2E2",
    icon: "close-circle-outline",
  },
};

const STATUS_ADOCAO_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: string }
> = {
  pendente: {
    label: "Em Análise",
    color: "#D97706",
    bg: "#FEF3C7",
    icon: "hourglass-outline",
  },
  "em análise": {
    label: "Em Análise",
    color: "#D97706",
    bg: "#FEF3C7",
    icon: "hourglass-outline",
  },
  aprovado: {
    label: "Adoção Aprovada",
    color: "#059669",
    bg: "#D1FAE5",
    icon: "heart-circle-outline",
  },
  "adoção aprovada": {
    label: "Adoção Aprovada",
    color: "#059669",
    bg: "#D1FAE5",
    icon: "heart-circle-outline",
  },
  reprovado: {
    label: "Adoção Reprovada",
    color: "#DC2626",
    bg: "#FEE2E2",
    icon: "close-circle-outline",
  },
  "adoção reprovada": {
    label: "Adoção Reprovada",
    color: "#DC2626",
    bg: "#FEE2E2",
    icon: "close-circle-outline",
  },
};

function formatarData(timestamp: any): string {
  if (!timestamp) return "—";
  try {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

// ── Badge de Status ───────────────────────────────────────────────────────────

function StatusBadge({
  status,
  tipo,
}: {
  status: string;
  tipo: "pedido" | "adocao";
}) {
  const config =
    tipo === "pedido"
      ? STATUS_PEDIDO_CONFIG[status as StatusPedido]
      : STATUS_ADOCAO_CONFIG[status as StatusAdocao];

  if (!config) {
    return (
      <View style={[badgeStyles.badge, { backgroundColor: "#F3F4F6" }]}>
        <Text style={[badgeStyles.text, { color: "#6B7280" }]}>{status}</Text>
      </View>
    );
  }

  return (
    <View style={[badgeStyles.badge, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon as any} size={12} color={config.color} />
      <Text style={[badgeStyles.text, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  text: { fontSize: 12, fontWeight: "600" },
});

// ── Linha de progresso do pedido ──────────────────────────────────────────────

const ETAPAS_PEDIDO: StatusPedido[] = [
  "pendente",
  "confirmado",
  "enviado",
  "entregue",
];

function ProgressoPedido({
  status,
  theme,
}: {
  status: StatusPedido;
  theme: any;
}) {
  if (status === "cancelado") {
    return (
      <View style={progressStyles.canceladoBox}>
        <Ionicons name="close-circle" size={18} color="#DC2626" />
        <Text style={progressStyles.canceladoText}>Pedido cancelado</Text>
      </View>
    );
  }

  const etapaAtual = ETAPAS_PEDIDO.indexOf(status);

  return (
    <View style={progressStyles.wrapper}>
      {ETAPAS_PEDIDO.map((etapa, i) => {
        const cfg = STATUS_PEDIDO_CONFIG[etapa];
        const ativo = i <= etapaAtual;
        return (
          <React.Fragment key={etapa}>
            <View style={progressStyles.etapa}>
              <View
                style={[
                  progressStyles.circulo,
                  {
                    backgroundColor: ativo ? cfg.color : "#E5E7EB",
                    borderColor: ativo ? cfg.color : "#D1D5DB",
                  },
                ]}
              >
                {ativo && <Ionicons name="checkmark" size={10} color="#FFF" />}
              </View>
              <Text
                style={[
                  progressStyles.etapaLabel,
                  { color: ativo ? cfg.color : theme.textSecondary },
                ]}
              >
                {cfg.label}
              </Text>
            </View>
            {i < ETAPAS_PEDIDO.length - 1 && (
              <View
                style={[
                  progressStyles.linha,
                  { backgroundColor: i < etapaAtual ? cfg.color : "#E5E7EB" },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const progressStyles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    paddingHorizontal: 4,
  },
  etapa: { alignItems: "center", flex: 1 },
  circulo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  etapaLabel: { fontSize: 10, fontWeight: "600", textAlign: "center" },
  linha: { flex: 1, height: 2, marginBottom: 16, marginHorizontal: -2 },
  canceladoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    marginVertical: 12,
  },
  canceladoText: { color: "#DC2626", fontWeight: "600", fontSize: 14 },
});

// ── Modal de Detalhes do Pedido ───────────────────────────────────────────────

function ModalPedido({
  pedido,
  visible,
  onClose,
  theme,
}: {
  pedido: Pedido | null;
  visible: boolean;
  onClose: () => void;
  theme: any;
}) {
  if (!pedido) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[modalStyles.container, { backgroundColor: theme.background }]}
      >
        <View style={[modalStyles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[modalStyles.title, { color: theme.text }]}>
            Detalhes do Pedido
          </Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          contentContainerStyle={modalStyles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              modalStyles.card,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={modalStyles.row}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[modalStyles.label, { color: theme.textSecondary }]}
                >
                  Nº do Pedido
                </Text>
                <Text
                  style={[modalStyles.value, { color: theme.text }]}
                  numberOfLines={1}
                >
                  #{pedido.id.slice(0, 8).toUpperCase()}
                </Text>
              </View>
              <StatusBadge status={pedido.status} tipo="pedido" />
            </View>
            <View
              style={[modalStyles.divider, { backgroundColor: theme.border }]}
            />
            <ProgressoPedido status={pedido.status} theme={theme} />
          </View>

          <View
            style={[
              modalStyles.card,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[modalStyles.cardTitle, { color: theme.primary }]}>
              Informações
            </Text>
            <InfoRow
              icon="calendar-outline"
              label="Data do Pedido"
              value={
                pedido.data
                  ? `${pedido.data}${pedido.horario ? " às " + pedido.horario : ""}`
                  : formatarData(pedido.createdAt)
              }
              theme={theme}
            />
            {pedido.metodoPagamento && (
              <InfoRow
                icon="card-outline"
                label="Forma de Pagamento"
                value={`${pedido.metodoPagamento.toUpperCase()}${pedido.parcelas && pedido.parcelas > 1 ? ` em ${pedido.parcelas}x` : ""}`}
                theme={theme}
              />
            )}
            {pedido.clienteNome && (
              <InfoRow
                icon="person-outline"
                label="Cliente"
                value={pedido.clienteNome}
                theme={theme}
              />
            )}
            {pedido.clienteTelefone && (
              <InfoRow
                icon="call-outline"
                label="Telefone"
                value={pedido.clienteTelefone}
                theme={theme}
              />
            )}
            {pedido.endereco && (
              <InfoRow
                icon="location-outline"
                label="Endereço de Entrega"
                value={pedido.endereco}
                theme={theme}
              />
            )}
          </View>

          {pedido.itens && pedido.itens.length > 0 && (
            <View
              style={[
                modalStyles.card,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={[modalStyles.cardTitle, { color: theme.primary }]}>
                Itens ({pedido.itens.length})
              </Text>
              {pedido.itens.map((item, i) => (
                <View
                  key={i}
                  style={[
                    modalStyles.itemRow,
                    i < pedido.itens!.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      modalStyles.itemBullet,
                      { backgroundColor: theme.primary + "20" },
                    ]}
                  >
                    <Feather name="package" size={14} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[modalStyles.itemNome, { color: theme.text }]}
                      numberOfLines={2}
                    >
                      {item.produtoNome}
                    </Text>
                    <Text
                      style={[
                        modalStyles.itemQtd,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Quantidade: {item.quantidade ?? 1}
                    </Text>
                  </View>
                  <Text
                    style={[modalStyles.itemPreco, { color: theme.primary }]}
                  >
                    {item.preco}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {pedido.total !== undefined && (
            <View
              style={[
                modalStyles.totalCard,
                {
                  backgroundColor: theme.primary + "12",
                  borderColor: theme.primary + "30",
                },
              ]}
            >
              <Text
                style={[modalStyles.totalLabel, { color: theme.textSecondary }]}
              >
                Total pago
              </Text>
              <Text style={[modalStyles.totalValue, { color: theme.primary }]}>
                R$ {pedido.total ?? "—"}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Modal de Detalhes da Adoção ───────────────────────────────────────────────

function ModalAdocao({
  adocao,
  visible,
  onClose,
  theme,
}: {
  adocao: Adocao | null;
  visible: boolean;
  onClose: () => void;
  theme: any;
}) {
  if (!adocao) return null;
  const nomePet = adocao.petNome || adocao.clienteNome || "Adoção";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[modalStyles.container, { backgroundColor: theme.background }]}
      >
        <View style={[modalStyles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[modalStyles.title, { color: theme.text }]}>
            Detalhes da Adoção
          </Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          contentContainerStyle={modalStyles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              modalStyles.card,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={modalStyles.adocaoHero}>
              <View
                style={[
                  modalStyles.petIconCircle,
                  { backgroundColor: theme.primary + "18" },
                ]}
              >
                <Ionicons name="paw" size={32} color={theme.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text
                  style={[modalStyles.petNomeGrande, { color: theme.text }]}
                >
                  {nomePet}
                </Text>
                <Text
                  style={[
                    modalStyles.label,
                    { color: theme.textSecondary, marginTop: 2 },
                  ]}
                >
                  Requisição #{adocao.id.slice(0, 8).toUpperCase()}
                </Text>
              </View>
            </View>
            <View
              style={[modalStyles.divider, { backgroundColor: theme.border }]}
            />
            <AdocaoTimeline status={adocao.status} theme={theme} />
          </View>

          <View
            style={[
              modalStyles.card,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[modalStyles.cardTitle, { color: theme.primary }]}>
              Informações
            </Text>
            <InfoRow
              icon="calendar-outline"
              label="Data da Requisição"
              value={
                adocao.data ??
                (adocao.criadoEm
                  ? new Date(adocao.criadoEm).toLocaleDateString("pt-BR")
                  : "—")
              }
              theme={theme}
            />
            {(adocao.clienteNome || adocao.nomeCompleto) && (
              <InfoRow
                icon="person-outline"
                label="Solicitante"
                value={adocao.clienteNome ?? adocao.nomeCompleto ?? ""}
                theme={theme}
              />
            )}
            {adocao.email && (
              <InfoRow
                icon="mail-outline"
                label="E-mail"
                value={adocao.email}
                theme={theme}
              />
            )}
            {adocao.telefone && (
              <InfoRow
                icon="call-outline"
                label="Telefone"
                value={adocao.telefone}
                theme={theme}
              />
            )}
            {adocao.cidade && (
              <InfoRow
                icon="location-outline"
                label="Cidade"
                value={adocao.cidade}
                theme={theme}
              />
            )}
            {(adocao.petRaca || adocao.petPorte) && (
              <InfoRow
                icon="paw-outline"
                label="Pet"
                value={[adocao.petRaca, adocao.petPorte, adocao.petSexo]
                  .filter(Boolean)
                  .join(" · ")}
                theme={theme}
              />
            )}
          </View>

          {(adocao.observacoes || adocao.motivo) && (
            <View
              style={[
                modalStyles.card,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={[modalStyles.cardTitle, { color: theme.primary }]}>
                Observações
              </Text>
              <Text style={[modalStyles.mensagemText, { color: theme.text }]}>
                {adocao.observacoes || adocao.motivo}
              </Text>
            </View>
          )}
          {adocao.status === "adoção reprovada" && adocao.motivoReprovacao && (
            <View
              style={[
                modalStyles.card,
                { backgroundColor: "#FEE2E2", borderColor: "#FECACA" },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <Ionicons name="information-circle" size={18} color="#DC2626" />
                <Text
                  style={[
                    modalStyles.cardTitle,
                    { color: "#DC2626", marginBottom: 0 },
                  ]}
                >
                  Motivo da Reprovação
                </Text>
              </View>
              <Text style={{ color: "#991B1B", fontSize: 14, lineHeight: 20 }}>
                {adocao.motivoReprovacao}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Timeline de adoção ────────────────────────────────────────────────────────

function AdocaoTimeline({
  status,
  theme,
}: {
  status: StatusAdocao;
  theme: any;
}) {
  const etapas = [
    {
      key: "em análise",
      label: "Em Análise",
      icon: "hourglass-outline",
      desc: "Sua requisição foi enviada e está sendo avaliada.",
    },
    {
      key: "adoção aprovada",
      label: "Adoção Aprovada",
      icon: "heart-circle-outline",
      desc: "Parabéns! A adoção foi aprovada.",
    },
    {
      key: "adoção reprovada",
      label: "Adoção Reprovada",
      icon: "close-circle-outline",
      desc: "Infelizmente a adoção não foi aprovada.",
    },
  ];

  const statusNorm =
    status === "pendente"
      ? "em análise"
      : status === "aprovado"
        ? "adoção aprovada"
        : status === "reprovado"
          ? "adoção reprovada"
          : status;
  const etapasFiltradas =
    statusNorm === "adoção reprovada"
      ? [etapas[0], etapas[2]]
      : [etapas[0], etapas[1]];
  const indiceAtual = statusNorm === "em análise" ? 0 : 1;

  return (
    <View style={timelineStyles.wrapper}>
      {etapasFiltradas.map((etapa, i) => {
        const cfg = STATUS_ADOCAO_CONFIG[etapa.key];
        const ativo = i === indiceAtual;
        const concluido = i < indiceAtual;
        const isLast = i === etapasFiltradas.length - 1;

        return (
          <View key={etapa.key} style={timelineStyles.etapa}>
            <View style={timelineStyles.trilho}>
              <View
                style={[
                  timelineStyles.circulo,
                  {
                    backgroundColor: ativo || concluido ? cfg.color : "#E5E7EB",
                    borderColor: ativo || concluido ? cfg.color : "#D1D5DB",
                  },
                ]}
              >
                <Ionicons
                  name={
                    (ativo || concluido ? etapa.icon : "ellipse-outline") as any
                  }
                  size={14}
                  color={ativo || concluido ? "#FFF" : "#9CA3AF"}
                />
              </View>
              {!isLast && (
                <View
                  style={[
                    timelineStyles.linha,
                    { backgroundColor: concluido ? cfg.color : "#E5E7EB" },
                  ]}
                />
              )}
            </View>
            <View
              style={[timelineStyles.conteudo, !isLast && { marginBottom: 0 }]}
            >
              <View style={timelineStyles.labelRow}>
                <Text
                  style={[
                    timelineStyles.label,
                    {
                      color: ativo
                        ? cfg.color
                        : concluido
                          ? theme.textSecondary
                          : "#9CA3AF",
                    },
                  ]}
                >
                  {etapa.label}
                </Text>
                {ativo && (
                  <View
                    style={[
                      timelineStyles.activeBadge,
                      { backgroundColor: cfg.bg },
                    ]}
                  >
                    <Text
                      style={[
                        timelineStyles.activeBadgeText,
                        { color: cfg.color },
                      ]}
                    >
                      Atual
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={[timelineStyles.desc, { color: theme.textSecondary }]}
              >
                {etapa.desc}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const timelineStyles = StyleSheet.create({
  wrapper: { paddingTop: 12, paddingBottom: 4 },
  etapa: { flexDirection: "row", marginBottom: 16 },
  trilho: { alignItems: "center", width: 32 },
  circulo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  linha: { width: 2, flex: 1, marginTop: 4, minHeight: 20 },
  conteudo: { flex: 1, marginLeft: 12, paddingBottom: 16 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  label: { fontSize: 14, fontWeight: "700" },
  desc: { fontSize: 12, lineHeight: 18 },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  activeBadgeText: { fontSize: 11, fontWeight: "600" },
});

function InfoRow({
  icon,
  label,
  value,
  theme,
}: {
  icon: string;
  label: string;
  value: string;
  theme: any;
}) {
  return (
    <View style={infoStyles.row}>
      <View
        style={[infoStyles.iconBox, { backgroundColor: theme.primary + "15" }]}
      >
        <Ionicons name={icon as any} size={14} color={theme.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[infoStyles.label, { color: theme.textSecondary }]}>
          {label}
        </Text>
        <Text style={[infoStyles.value, { color: theme.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  label: { fontSize: 11, fontWeight: "500", marginBottom: 2 },
  value: { fontSize: 14, fontWeight: "500" },
});

const modalStyles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  closeBtn: { padding: 4 },
  title: { fontSize: 17, fontWeight: "700" },
  scroll: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  row: { flexDirection: "row", alignItems: "center" },
  divider: { height: 1, marginVertical: 12 },
  label: { fontSize: 11, fontWeight: "500" },
  value: { fontSize: 15, fontWeight: "600", marginTop: 2 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  itemBullet: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  itemNome: { fontSize: 14, fontWeight: "500", marginBottom: 2 },
  itemQtd: { fontSize: 12 },
  itemPreco: { fontSize: 14, fontWeight: "700" },
  totalCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  totalLabel: { fontSize: 14, fontWeight: "600" },
  totalValue: { fontSize: 22, fontWeight: "800" },
  adocaoHero: { flexDirection: "row", alignItems: "center" },
  petIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  petNomeGrande: { fontSize: 20, fontWeight: "800" },
  mensagemText: { fontSize: 14, lineHeight: 22 },
});

// ── Tela Principal ────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { theme, colorScheme, toggleColorScheme } = useAppTheme();
  const { showNotification } = useNotification();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [pets, setPets] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [adocoes, setAdocoes] = useState<Adocao[]>([]);

  const [pedidosAberto, setPedidosAberto] = useState(false);
  const [adocoesAberto, setAdocoesAberto] = useState(false);

  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(
    null,
  );
  const [adocaoSelecionada, setAdocaoSelecionada] = useState<Adocao | null>(
    null,
  );
  const [petSelecionado, setPetSelecionado] = useState<any | null>(null);

  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePasswordVisible, setDeletePasswordVisible] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    cpf: "",
    email: "",
    endereco: { rua: "", numero: "", bairro: "", cep: "", cidade: "", uf: "" },
  });

  useFocusEffect(
    useCallback(() => {
      const fetchAllData = async () => {
        const user = auth.currentUser;
        if (user) {
          try {
            const docRef = doc(db, "usuarios", user.uid);
            const docSnap = await getDoc(docRef);
            let emailAtual = "";

            if (docSnap.exists()) {
              const docData = docSnap.data();
              const actualData = docData.userData || docData;
              emailAtual = actualData.email || "";
              setFormData({
                nome: actualData.nome || "",
                telefone: actualData.telefone || "",
                cpf: actualData.cpf || "",
                email: emailAtual,
                endereco: {
                  rua: actualData.endereco?.rua || "",
                  numero: actualData.endereco?.numero || "",
                  bairro: actualData.endereco?.bairro || "",
                  cep: actualData.endereco?.cep || "",
                  cidade: actualData.endereco?.cidade || "",
                  uf: actualData.endereco?.uf || "",
                },
              });
            }

            const petsRef = collection(db, "usuarios", user.uid, "pets");
            const petsSnap = await getDocs(petsRef);
            setPets(
              petsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
            );

            const pedidosRef = collection(db, "pedidos");
            const qPedidos = query(pedidosRef, where("userId", "==", user.uid));
            const pedidosSnap = await getDocs(qPedidos);
            setPedidos(
              pedidosSnap.docs.map(
                (d) => ({ id: d.id, ...d.data() }) as Pedido,
              ),
            );

            if (emailAtual) {
              const adocaoRef = collection(db, "requisicoes_adocao");
              const qAdocoes = query(
                adocaoRef,
                where("email", "==", emailAtual),
              );
              const adocoesSnap = await getDocs(qAdocoes);
              setAdocoes(
                adocoesSnap.docs.map(
                  (d) => ({ id: d.id, ...d.data() }) as Adocao,
                ),
              );
            }
          } catch (e) {
            console.error("Erro fetchAllData:", e);
            showNotification("Erro", "Falha ao carregar dados.", "error");
          }
        }
        setLoading(false);
      };
      fetchAllData();
    }, []),
  );

  const handleCepChange = async (text: string) => {
    const formatted = maskCep(text);
    setEndereco("cep", formatted);
    const cleanCep = formatted.replace(/\D/g, "");

    if (cleanCep.length === 8) {
      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${cleanCep}/json/`,
        );
        const data = await response.json();
        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            endereco: {
              ...prev.endereco,
              rua: data.logradouro || prev.endereco.rua,
              bairro: data.bairro || prev.endereco.bairro,
              cidade: data.localidade || prev.endereco.cidade,
              uf: data.uf || prev.endereco.uf,
            },
          }));
        }
      } catch (e) {
        console.error("Erro CEP", e);
      }
    }
  };

  const handleUpdate = async () => {
    // ── Validações do Formulário de Perfil ──
    if (!formData.nome || formData.nome.trim().length < 5) {
      showNotification(
        "Atenção",
        "O nome deve ter pelo menos 5 caracteres.",
        "error",
      );
      return;
    }
    if (formData.cpf && formData.cpf.length < 14) {
      showNotification("Atenção", "O CPF inserido é inválido.", "error");
      return;
    }
    if (formData.telefone && formData.telefone.length < 14) {
      showNotification("Atenção", "O telemóvel inserido é inválido.", "error");
      return;
    }
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(formData.email)) {
      showNotification("Atenção", "O e-mail inserido é inválido.", "error");
      return;
    }

    setSaving(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "usuarios", user.uid);
        await updateDoc(docRef, { userData: formData });
        showNotification(
          "Sucesso",
          "Alterações salvas com sucesso!",
          "success",
        );
        setEditing(false);
      }
    } catch {
      showNotification("Erro", "Falha ao guardar perfil.", "error");
    } finally {
      setSaving(false);
    }
  };

  const setEndereco = (field: string, value: string) =>
    setFormData((prev) => ({
      ...prev,
      endereco: { ...prev.endereco, [field]: value },
    }));

  const handleDeleteAccount = () => {
    setShowConfirmDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (!deletePassword) {
      showNotification("Erro", "Digite sua senha para confirmar.", "error");
      return;
    }
    const user = auth.currentUser;
    if (!user || !user.email) return;
    setDeletingAccount(true);
    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        deletePassword,
      );
      await reauthenticateWithCredential(user, credential);
      await deleteDoc(doc(db, "usuarios", user.uid));
      await deleteUser(user);
      setShowDeleteModal(false);
      showNotification(
        "Conta excluída",
        "Sua conta foi removida com sucesso.",
        "success",
      );
      router.replace("/(tabs)" as any);
    } catch (error: any) {
      if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        showNotification("Erro", "Senha incorreta. Tente novamente.", "error");
      } else {
        showNotification("Erro", "Não foi possível excluir a conta.", "error");
      }
    } finally {
      setDeletingAccount(false);
    }
  };

  if (loading)
    return (
      <ActivityIndicator size="large" style={{ flex: 1, marginTop: 50 }} />
    );

  return (
    <>
      <TouchableOpacity
        style={[
          styles.backButton,
          {
            top: insets.top + 10,
            backgroundColor: theme.surface,
            borderColor: theme.primary + "40",
          },
        ]}
        onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace("/(tabs)" as any);
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={24} color={theme.primary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.themeToggleButton,
          {
            top: insets.top + 10,
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
        onPress={toggleColorScheme}
        activeOpacity={0.7}
      >
        <Ionicons
          name={colorScheme === "dark" ? "sunny" : "moon"}
          size={22}
          color={theme.primary}
        />
      </TouchableOpacity>

      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 64 },
        ]}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>
              Perfil do Usuário
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Informações cadastrais
            </Text>
          </View>
          {!editing && (
            <TouchableOpacity
              style={[styles.editBtn, { backgroundColor: theme.primary }]}
              onPress={() => setEditing(true)}
            >
              <Feather name="edit-2" size={14} color="#FFF" />
              <Text style={styles.editBtnText}>Editar</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          Dados Pessoais
        </Text>
        <Field
          label="Nome Completo"
          value={formData.nome}
          editable={editing}
          onChangeText={(t: string) => setFormData({ ...formData, nome: t })}
          theme={theme}
        />
        <Field
          label="CPF"
          icon="credit-card"
          value={formData.cpf}
          editable={editing}
          onChangeText={(t: string) =>
            setFormData({ ...formData, cpf: maskCpf(t) })
          }
          keyboardType="numeric"
          maxLength={14}
          theme={theme}
        />
        <Field
          label="Telemóvel"
          icon="phone"
          value={formData.telefone}
          editable={editing}
          onChangeText={(t: string) =>
            setFormData({ ...formData, telefone: maskPhone(t) })
          }
          keyboardType="phone-pad"
          maxLength={15}
          theme={theme}
        />
        <Field
          label="E-mail"
          icon="mail"
          value={formData.email}
          editable={editing}
          onChangeText={(t: string) => setFormData({ ...formData, email: t })}
          keyboardType="email-address"
          theme={theme}
        />

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          Endereço
        </Text>
        <Field
          label="Código Postal (CEP)"
          icon="map-pin"
          value={formData.endereco.cep}
          editable={editing}
          onChangeText={handleCepChange}
          keyboardType="numeric"
          maxLength={9}
          theme={theme}
        />
        <Field
          label="Rua"
          value={formData.endereco.rua}
          editable={editing}
          onChangeText={(t: string) => setEndereco("rua", t)}
          theme={theme}
        />
        <View style={styles.row}>
          <View style={styles.rowSmall}>
            <Field
              label="Nº"
              value={formData.endereco.numero}
              editable={editing}
              onChangeText={(t: string) => setEndereco("numero", t)}
              keyboardType="numeric"
              theme={theme}
            />
          </View>
          <View style={styles.rowLarge}>
            <Field
              label="Bairro"
              value={formData.endereco.bairro}
              editable={editing}
              onChangeText={(t: string) => setEndereco("bairro", t)}
              theme={theme}
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.rowLarge}>
            <Field
              label="Cidade"
              value={formData.endereco.cidade}
              editable={editing}
              onChangeText={(t: string) => setEndereco("cidade", t)}
              theme={theme}
            />
          </View>
          <View style={styles.rowSmall}>
            <Field
              label="UF"
              value={formData.endereco.uf}
              editable={editing}
              onChangeText={(t: string) => setEndereco("uf", t)}
              theme={theme}
            />
          </View>
        </View>

        {editing && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: theme.border }]}
              onPress={() => setEditing(false)}
              disabled={saving}
            >
              <Text
                style={[styles.cancelBtnText, { color: theme.textSecondary }]}
              >
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.primary }]}
              onPress={handleUpdate}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Guardar Alterações</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View
          style={[
            styles.divider,
            { backgroundColor: theme.border, marginTop: 24 },
          ]}
        />
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          Meu Histórico
        </Text>

        <View
          style={[
            styles.historicoSection,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <TouchableOpacity
            style={styles.historicoHeader}
            onPress={() => setPedidosAberto(!pedidosAberto)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.historicoIconBox,
                { backgroundColor: theme.primary + "18" },
              ]}
            >
              <Feather name="shopping-bag" size={18} color={theme.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.historicoTitulo, { color: theme.text }]}>
                Meus Pedidos
              </Text>
              <Text
                style={[
                  styles.historicoSubtitulo,
                  { color: theme.textSecondary },
                ]}
              >
                {pedidos.length === 0
                  ? "Nenhum pedido realizado"
                  : `${pedidos.length} pedido${pedidos.length > 1 ? "s" : ""} realizado${pedidos.length > 1 ? "s" : ""}`}
              </Text>
            </View>
            <Ionicons
              name={pedidosAberto ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          {pedidosAberto && (
            <View
              style={[styles.historicoLista, { borderTopColor: theme.border }]}
            >
              {pedidos.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="bag-outline"
                    size={36}
                    color={theme.textSecondary}
                  />
                  <Text
                    style={[styles.emptyText, { color: theme.textSecondary }]}
                  >
                    Você ainda não realizou nenhum pedido.
                  </Text>
                </View>
              ) : (
                pedidos.map((pedido, i) => {
                  const cfg = STATUS_PEDIDO_CONFIG[pedido.status] ?? {
                    label: pedido.status,
                    color: "#6B7280",
                    bg: "#F3F4F6",
                    icon: "ellipse-outline",
                  };
                  return (
                    <TouchableOpacity
                      key={pedido.id}
                      style={[
                        styles.listaItem,
                        i < pedidos.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: theme.border,
                        },
                      ]}
                      onPress={() => setPedidoSelecionado(pedido)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.listaItemIcon,
                          { backgroundColor: cfg.bg },
                        ]}
                      >
                        <Ionicons
                          name={cfg.icon as any}
                          size={16}
                          color={cfg.color}
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text
                          style={[
                            styles.listaItemTitulo,
                            { color: theme.text },
                          ]}
                        >
                          Pedido #{pedido.id.slice(0, 8).toUpperCase()}
                        </Text>
                        <Text
                          style={[
                            styles.listaItemData,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {pedido.data ?? formatarData(pedido.createdAt)}
                          {pedido.total ? ` · R$ ${pedido.total}` : ""}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end", gap: 6 }}>
                        <StatusBadge status={pedido.status} tipo="pedido" />
                        <Ionicons
                          name="chevron-forward"
                          size={14}
                          color={theme.textSecondary}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}
        </View>

        <View
          style={[
            styles.historicoSection,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              marginTop: 12,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.historicoHeader}
            onPress={() => setAdocoesAberto(!adocoesAberto)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.historicoIconBox,
                { backgroundColor: "#EF444420" },
              ]}
            >
              <Feather name="heart" size={18} color="#EF4444" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.historicoTitulo, { color: theme.text }]}>
                Requisições de Adoção
              </Text>
              <Text
                style={[
                  styles.historicoSubtitulo,
                  { color: theme.textSecondary },
                ]}
              >
                {adocoes.length === 0
                  ? "Nenhuma requisição enviada"
                  : `${adocoes.length} requisição${adocoes.length > 1 ? "ões" : ""} enviada${adocoes.length > 1 ? "s" : ""}`}
              </Text>
            </View>
            <Ionicons
              name={adocoesAberto ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          {adocoesAberto && (
            <View
              style={[styles.historicoLista, { borderTopColor: theme.border }]}
            >
              {adocoes.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="paw-outline"
                    size={36}
                    color={theme.textSecondary}
                  />
                  <Text
                    style={[styles.emptyText, { color: theme.textSecondary }]}
                  >
                    Você ainda não enviou nenhuma requisição de adoção.
                  </Text>
                </View>
              ) : (
                adocoes.map((adocao, i) => {
                  const nomePet =
                    adocao.petNome || adocao.clienteNome || "Adoção";
                  const cfg = STATUS_ADOCAO_CONFIG[adocao.status] ?? {
                    label: adocao.status,
                    color: "#6B7280",
                    bg: "#F3F4F6",
                    icon: "ellipse-outline",
                  };
                  return (
                    <TouchableOpacity
                      key={adocao.id}
                      style={[
                        styles.listaItem,
                        i < adocoes.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: theme.border,
                        },
                      ]}
                      onPress={() => setAdocaoSelecionada(adocao)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.listaItemIcon,
                          { backgroundColor: cfg.bg },
                        ]}
                      >
                        <Ionicons
                          name={cfg.icon as any}
                          size={16}
                          color={cfg.color}
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text
                          style={[
                            styles.listaItemTitulo,
                            { color: theme.text },
                          ]}
                        >
                          {nomePet}
                        </Text>
                        <Text
                          style={[
                            styles.listaItemData,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {adocao.data ??
                            (adocao.criadoEm
                              ? new Date(adocao.criadoEm).toLocaleDateString(
                                  "pt-BR",
                                )
                              : "—")}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end", gap: 6 }}>
                        <StatusBadge status={adocao.status} tipo="adocao" />
                        <Ionicons
                          name="chevron-forward"
                          size={14}
                          color={theme.textSecondary}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}
        </View>

        <View
          style={[
            styles.divider,
            { backgroundColor: theme.border, marginTop: 24 },
          ]}
        />
        <View style={styles.header}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>
            Meus Pets
          </Text>
          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: theme.primary }]}
            onPress={() => router.push("/add-pet")}
          >
            <Feather name="plus" size={14} color="#FFF" />
            <Text style={styles.editBtnText}>Adicionar</Text>
          </TouchableOpacity>
        </View>

        {pets.length === 0 ? (
          <Text style={{ color: theme.textSecondary }}>
            Nenhum pet registado.
          </Text>
        ) : (
          pets.map((pet) => (
            <TouchableOpacity
              key={pet.id}
              activeOpacity={0.75}
              onPress={() => setPetSelecionado(pet)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 12,
                backgroundColor: theme.surface,
                borderRadius: 14,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              {pet.fotoUrl ? (
                <Image
                  source={{ uri: pet.fotoUrl }}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: theme.border,
                  }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: theme.primary + "18",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="paw" size={26} color={theme.primary} />
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: theme.text,
                    marginBottom: 3,
                  }}
                >
                  {pet.nome}
                </Text>
                {(pet.especie || pet.raca) && (
                  <Text
                    style={{ fontSize: 13, color: theme.textSecondary }}
                    numberOfLines={1}
                  >
                    {[pet.especie, pet.raca].filter(Boolean).join(" · ")}
                  </Text>
                )}
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          ))
        )}

        <View
          style={[
            styles.divider,
            { backgroundColor: theme.border, marginTop: 24 },
          ]}
        />
        <TouchableOpacity
          style={[styles.deleteAccountBtn, { borderColor: "#EF4444" }]}
          onPress={handleDeleteAccount}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
          <Text style={styles.deleteAccountText}>Excluir Minha Conta</Text>
        </TouchableOpacity>
      </ScrollView>

      <ModalPedido
        pedido={pedidoSelecionado}
        visible={!!pedidoSelecionado}
        onClose={() => setPedidoSelecionado(null)}
        theme={theme}
      />
      <ModalAdocao
        adocao={adocaoSelecionada}
        visible={!!adocaoSelecionada}
        onClose={() => setAdocaoSelecionada(null)}
        theme={theme}
      />
      <ModalPet
        pet={petSelecionado}
        visible={!!petSelecionado}
        onClose={() => setPetSelecionado(null)}
        onSave={(petAtualizado: any) => {
          setPets((prev) =>
            prev.map((p) => (p.id === petAtualizado.id ? petAtualizado : p)),
          );
          setPetSelecionado(null);
        }}
        theme={theme}
      />

      {/* ── Modal Confirmar Intenção de Excluir ── */}
      <Modal
        visible={showConfirmDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmDeleteModal(false)}
      >
        <View style={deleteModalStyles.overlay}>
          <View
            style={[
              deleteModalStyles.box,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
          >
            <Ionicons
              name="alert-circle-outline"
              size={36}
              color="#EF4444"
              style={{ alignSelf: "center", marginBottom: 8 }}
            />
            <Text style={[deleteModalStyles.title, { color: theme.text }]}>
              Excluir Conta
            </Text>
            <Text
              style={[
                deleteModalStyles.subtitle,
                { color: theme.textSecondary },
              ]}
            >
              Tem certeza que deseja excluir sua conta? Esta ação é permanente e
              não pode ser desfeita.
            </Text>
            <View style={deleteModalStyles.btnRow}>
              <TouchableOpacity
                style={[
                  deleteModalStyles.cancelBtn,
                  { borderColor: theme.border },
                ]}
                onPress={() => setShowConfirmDeleteModal(false)}
              >
                <Text
                  style={[deleteModalStyles.cancelText, { color: theme.text }]}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[deleteModalStyles.deleteBtn]}
                onPress={() => {
                  setShowConfirmDeleteModal(false);
                  setDeletePassword("");
                  setDeletePasswordVisible(false);
                  setShowDeleteModal(true);
                }}
              >
                <Text style={deleteModalStyles.deleteText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal Senha para Excluir ── */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={deleteModalStyles.overlay}>
          <View
            style={[
              deleteModalStyles.box,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
          >
            <Ionicons
              name="warning-outline"
              size={36}
              color="#EF4444"
              style={{ alignSelf: "center", marginBottom: 8 }}
            />
            <Text style={[deleteModalStyles.title, { color: theme.text }]}>
              Confirmar Exclusão
            </Text>
            <Text
              style={[
                deleteModalStyles.subtitle,
                { color: theme.textSecondary },
              ]}
            >
              Digite sua senha para confirmar a exclusão permanente da conta.
            </Text>
            <View
              style={[
                deleteModalStyles.inputRow,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <TextInput
                style={[deleteModalStyles.input, { color: theme.text }]}
                placeholder="Sua senha"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry={!deletePasswordVisible}
                value={deletePassword}
                onChangeText={setDeletePassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setDeletePasswordVisible(!deletePasswordVisible)}
              >
                <Ionicons
                  name={deletePasswordVisible ? "eye-off" : "eye"}
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <View style={deleteModalStyles.btnRow}>
              <TouchableOpacity
                style={[
                  deleteModalStyles.cancelBtn,
                  { borderColor: theme.border },
                ]}
                onPress={() => setShowDeleteModal(false)}
                disabled={deletingAccount}
              >
                <Text
                  style={[deleteModalStyles.cancelText, { color: theme.text }]}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  deleteModalStyles.deleteBtn,
                  { opacity: deletingAccount ? 0.7 : 1 },
                ]}
                onPress={confirmDeleteAccount}
                disabled={deletingAccount}
              >
                {deletingAccount ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={deleteModalStyles.deleteText}>Excluir</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function ModalPet({
  pet,
  visible,
  onClose,
  onSave,
  theme,
}: {
  pet: any | null;
  visible: boolean;
  onClose: () => void;
  onSave: (pet: any) => void;
  theme: any;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [especie, setEspecie] = useState("");
  const [especieOutro, setEspecieOutro] = useState("");
  const [raca, setRaca] = useState("");
  const [sexo, setSexo] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [idade, setIdade] = useState("");
  const [peso, setPeso] = useState("");
  const [cor, setCor] = useState("");
  const [castrado, setCastrado] = useState("");
  const [hasAlergias, setHasAlergias] = useState("");
  const [alergias, setAlergias] = useState("");
  const [hasDoencas, setHasDoencas] = useState("");
  const [doencas, setDoencas] = useState("");
  const [hasMedicamentos, setHasMedicamentos] = useState("");
  const [medicamentos, setMedicamentos] = useState("");
  const [hasVacinas, setHasVacinas] = useState("");
  const [vacinas, setVacinas] = useState("");
  const [observacoes, setObservacoes] = useState("");

  React.useEffect(() => {
    if (!pet) return;
    setImageUri(null);
    setNome(pet.nome ?? "");
    const especiesFixas = ["Canino", "Felino"];
    if (especiesFixas.includes(pet.especie)) {
      setEspecie(pet.especie);
      setEspecieOutro("");
    } else if (pet.especie) {
      setEspecie("Outro");
      setEspecieOutro(pet.especie);
    } else {
      setEspecie("");
      setEspecieOutro("");
    }
    setRaca(pet.raca ?? "");
    setSexo(pet.sexo ?? "");
    setDataNascimento(pet.dataNascimento ?? "");
    setIdade(pet.idade ?? "");
    setPeso(pet.peso ?? "");
    setCor(pet.cor ?? "");
    setCastrado(pet.castrado ?? "");
    if (!pet.alergias || pet.alergias === "Nenhuma") {
      setHasAlergias("Não");
      setAlergias("");
    } else {
      setHasAlergias("Sim");
      setAlergias(pet.alergias);
    }
    if (!pet.doencas || pet.doencas === "Nenhuma") {
      setHasDoencas("Não");
      setDoencas("");
    } else {
      setHasDoencas("Sim");
      setDoencas(pet.doencas);
    }
    if (!pet.medicamentos || pet.medicamentos === "Nenhum") {
      setHasMedicamentos("Não");
      setMedicamentos("");
    } else {
      setHasMedicamentos("Sim");
      setMedicamentos(pet.medicamentos);
    }
    if (!pet.vacinas || pet.vacinas === "Não informado") {
      setHasVacinas("Não");
      setVacinas("");
    } else {
      setHasVacinas("Sim");
      setVacinas(pet.vacinas);
    }
    setObservacoes(pet.observacoes ?? "");
    setEditing(false);
  }, [pet]);

  if (!pet) return null;

  const handleDateChange = (text: string) => {
    let v = text.replace(/\D/g, "").slice(0, 8);
    if (v.length >= 5) v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
    else if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;
    setDataNascimento(v);
    if (v.length === 10) calcularIdade(v);
    else setIdade("");
  };

  const calcularIdade = (dataCompleta: string) => {
    const [dia, mes, ano] = dataCompleta.split("/");
    const dataNasc = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    if (isNaN(dataNasc.getTime())) {
      setIdade("Data inválida");
      return;
    }
    const hoje = new Date();
    let anos = hoje.getFullYear() - dataNasc.getFullYear();
    const mesesDif = hoje.getMonth() - dataNasc.getMonth();
    if (mesesDif < 0 || (mesesDif === 0 && hoje.getDate() < dataNasc.getDate()))
      anos--;
    if (anos < 0) {
      setIdade("Ainda não nasceu");
    } else if (anos === 0) {
      let meses =
        (hoje.getFullYear() - dataNasc.getFullYear()) * 12 +
        hoje.getMonth() -
        dataNasc.getMonth();
      if (hoje.getDate() < dataNasc.getDate()) meses--;
      setIdade(`${meses} meses`);
    } else {
      setIdade(`${anos} anos`);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const uploadImageAsync = async (uri: string, petId: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Utilizador não autenticado");
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: "base64",
    });
    const storagePath = `pets%2F${user.uid}%2F${petId}.jpg`;
    const bucket = "petshop-2c06a.firebasestorage.app";
    const token = await user.getIdToken();
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++)
      bytes[i] = binaryString.charCodeAt(i);
    const response = await fetch(
      `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?name=${storagePath}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "image/jpeg",
          Authorization: `Bearer ${token}`,
        },
        body: bytes,
      },
    );
    const data = await response.json();
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${storagePath}?alt=media&token=${data.downloadTokens}`;
  };

  const handleSave = async () => {
    // ── Validações do Modal do Pet ──
    if (
      !nome.trim() ||
      !raca.trim() ||
      !peso.trim() ||
      !cor.trim() ||
      dataNascimento.length !== 10
    ) {
      showNotification(
        "Atenção",
        "Por favor, preencha os campos obrigatórios corretamente.",
        "error",
      );
      return;
    }

    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Utilizador não autenticado");

      const updatedData: any = {
        nome,
        especie: especie === "Outro" ? especieOutro : especie,
        raca,
        sexo,
        dataNascimento,
        idade,
        peso,
        cor,
        castrado,
        alergias: hasAlergias === "Sim" ? alergias : "Nenhuma",
        doencas: hasDoencas === "Sim" ? doencas : "Nenhuma",
        medicamentos: hasMedicamentos === "Sim" ? medicamentos : "Nenhum",
        vacinas: hasVacinas === "Sim" ? vacinas : "Não informado",
        observacoes,
      };

      const petDocRef = doc(db, "usuarios", user.uid, "pets", pet.id);
      await updateDoc(petDocRef, updatedData);

      let fotoUrl = pet.fotoUrl;
      if (imageUri) {
        fotoUrl = await uploadImageAsync(imageUri, pet.id);
        await updateDoc(petDocRef, { fotoUrl });
        updatedData.fotoUrl = fotoUrl;
      }

      showNotification("Sucesso", "Alterações salvas com sucesso!", "success");
      onSave({ ...pet, ...updatedData, fotoUrl });
    } catch (error) {
      console.error(error);
      showNotification(
        "Erro",
        "Não foi possível guardar as alterações.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const OptionSelector = ({
    label,
    options,
    selected,
    onSelect,
    required = true,
  }: any) => (
    <View style={{ marginBottom: 15 }}>
      <Text
        style={{
          color: theme.textSecondary,
          marginBottom: 8,
          fontWeight: "500",
        }}
      >
        {label}
        {required ? " *" : ""}
      </Text>
      <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
        {options.map((opt: string) => (
          <TouchableOpacity
            key={opt}
            style={[
              petModalStyles.optionPill,
              { borderColor: selected === opt ? theme.primary : theme.border },
              selected === opt && { backgroundColor: theme.primary },
            ]}
            onPress={() => editing && onSelect(opt)}
            activeOpacity={editing ? 0.7 : 1}
          >
            <Text
              style={{
                color: selected === opt ? "#FFF" : theme.text,
                fontWeight: "600",
              }}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const fotoAtual = imageUri ?? pet.fotoUrl ?? null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[modalStyles.container, { backgroundColor: theme.background }]}
      >
        <View style={[modalStyles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[modalStyles.title, { color: theme.text }]}>
            {editing ? "Editar Pet" : "Detalhes do Pet"}
          </Text>
          {!editing ? (
            <TouchableOpacity
              onPress={() => setEditing(true)}
              style={{ padding: 4 }}
            >
              <Feather name="edit-2" size={18} color={theme.primary} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 32 }} />
          )}
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={editing ? pickImage : undefined}
            style={[
              petModalStyles.imageContainer,
              { borderColor: editing ? theme.primary : theme.border },
            ]}
          >
            {fotoAtual ? (
              <Image source={{ uri: fotoAtual }} style={petModalStyles.image} />
            ) : (
              <View style={{ alignItems: "center" }}>
                <Feather name="camera" size={32} color={theme.primary} />
                <Text style={{ color: theme.textSecondary, marginTop: 8 }}>
                  {editing ? "Adicionar Foto" : "Sem foto"}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={{ marginBottom: 15 }}>
            <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
              Nome do Pet *
            </Text>
            <TextInput
              style={[
                petModalStyles.input,
                {
                  backgroundColor: theme.surface,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={nome}
              onChangeText={setNome}
              placeholder="Ex: Rex"
              placeholderTextColor={theme.textSecondary}
              editable={editing}
            />
          </View>

          <OptionSelector
            label="Espécie"
            options={["Canino", "Felino", "Outro"]}
            selected={especie}
            onSelect={setEspecie}
          />
          {especie === "Outro" && (
            <View style={{ marginBottom: 15, marginTop: -5 }}>
              <TextInput
                style={[
                  petModalStyles.input,
                  {
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                value={especieOutro}
                onChangeText={setEspecieOutro}
                placeholder="Digite a espécie"
                placeholderTextColor={theme.textSecondary}
                editable={editing}
              />
            </View>
          )}

          <View style={{ marginBottom: 15 }}>
            <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
              Raça *
            </Text>
            <TextInput
              style={[
                petModalStyles.input,
                {
                  backgroundColor: theme.surface,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={raca}
              onChangeText={setRaca}
              placeholder="Ex: Poodle, SRD"
              placeholderTextColor={theme.textSecondary}
              editable={editing}
            />
          </View>

          <OptionSelector
            label="Sexo"
            options={["Macho", "Fêmea"]}
            selected={sexo}
            onSelect={setSexo}
          />

          <View style={{ flexDirection: "row", gap: 15, marginBottom: 15 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
                Nascimento *
              </Text>
              <TextInput
                style={[
                  petModalStyles.input,
                  {
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                value={dataNascimento}
                onChangeText={handleDateChange}
                placeholder="DD/MM/AAAA"
                keyboardType="numeric"
                maxLength={10}
                placeholderTextColor={theme.textSecondary}
                editable={editing}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
                Idade Estimada
              </Text>
              <TextInput
                style={[
                  petModalStyles.input,
                  {
                    backgroundColor: theme.surface,
                    color: theme.textSecondary,
                    borderColor: theme.border,
                    opacity: 0.7,
                  },
                ]}
                value={idade}
                editable={false}
                placeholder="Automático"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 15, marginBottom: 15 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
                Peso *
              </Text>
              <TextInput
                style={[
                  petModalStyles.input,
                  {
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                value={peso}
                onChangeText={setPeso}
                placeholder="Ex: 5 kg"
                placeholderTextColor={theme.textSecondary}
                editable={editing}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
                Cor *
              </Text>
              <TextInput
                style={[
                  petModalStyles.input,
                  {
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                value={cor}
                onChangeText={setCor}
                placeholder="Ex: Preto"
                placeholderTextColor={theme.textSecondary}
                editable={editing}
              />
            </View>
          </View>

          <OptionSelector
            label="Castrado?"
            options={["Sim", "Não"]}
            selected={castrado}
            onSelect={setCastrado}
          />

          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: theme.primary,
              marginTop: 10,
              marginBottom: 15,
            }}
          >
            Saúde & Histórico
          </Text>

          <OptionSelector
            label="Possui alergias?"
            options={["Sim", "Não"]}
            selected={hasAlergias}
            onSelect={setHasAlergias}
          />
          {hasAlergias === "Sim" && (
            <TextInput
              style={[
                petModalStyles.input,
                {
                  backgroundColor: theme.surface,
                  color: theme.text,
                  borderColor: theme.border,
                  marginBottom: 15,
                  marginTop: -5,
                },
              ]}
              value={alergias}
              onChangeText={setAlergias}
              placeholder="Quais alergias?"
              placeholderTextColor={theme.textSecondary}
              editable={editing}
            />
          )}

          <OptionSelector
            label="Possui doenças pré-existentes?"
            options={["Sim", "Não"]}
            selected={hasDoencas}
            onSelect={setHasDoencas}
          />
          {hasDoencas === "Sim" && (
            <TextInput
              style={[
                petModalStyles.input,
                {
                  backgroundColor: theme.surface,
                  color: theme.text,
                  borderColor: theme.border,
                  marginBottom: 15,
                  marginTop: -5,
                },
              ]}
              value={doencas}
              onChangeText={setDoencas}
              placeholder="Quais doenças?"
              placeholderTextColor={theme.textSecondary}
              editable={editing}
            />
          )}

          <OptionSelector
            label="Toma medicamentos contínuos?"
            options={["Sim", "Não"]}
            selected={hasMedicamentos}
            onSelect={setHasMedicamentos}
          />
          {hasMedicamentos === "Sim" && (
            <TextInput
              style={[
                petModalStyles.input,
                {
                  backgroundColor: theme.surface,
                  color: theme.text,
                  borderColor: theme.border,
                  marginBottom: 15,
                  marginTop: -5,
                },
              ]}
              value={medicamentos}
              onChangeText={setMedicamentos}
              placeholder="Quais medicamentos?"
              placeholderTextColor={theme.textSecondary}
              editable={editing}
            />
          )}

          <OptionSelector
            label="Vacinas em dia?"
            options={["Sim", "Não"]}
            selected={hasVacinas}
            onSelect={setHasVacinas}
          />
          {hasVacinas === "Sim" && (
            <TextInput
              style={[
                petModalStyles.input,
                {
                  backgroundColor: theme.surface,
                  color: theme.text,
                  borderColor: theme.border,
                  marginBottom: 15,
                  marginTop: -5,
                },
              ]}
              value={vacinas}
              onChangeText={setVacinas}
              placeholder="Quais vacinas aplicadas?"
              placeholderTextColor={theme.textSecondary}
              editable={editing}
            />
          )}

          <View style={{ marginBottom: 15 }}>
            <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
              Observações (Opcional)
            </Text>
            <TextInput
              style={[
                petModalStyles.input,
                {
                  backgroundColor: theme.surface,
                  color: theme.text,
                  borderColor: theme.border,
                  minHeight: 80,
                },
              ]}
              value={observacoes}
              onChangeText={setObservacoes}
              placeholder="Temperamento, dicas, etc..."
              placeholderTextColor={theme.textSecondary}
              multiline
              editable={editing}
            />
          </View>

          {editing && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: theme.border }]}
                onPress={() => {
                  setEditing(false);
                  if (pet) {
                    const especiesFixas = ["Canino", "Felino"];
                    setNome(pet.nome ?? "");
                    if (especiesFixas.includes(pet.especie)) {
                      setEspecie(pet.especie);
                      setEspecieOutro("");
                    } else if (pet.especie) {
                      setEspecie("Outro");
                      setEspecieOutro(pet.especie);
                    }
                    setRaca(pet.raca ?? "");
                    setSexo(pet.sexo ?? "");
                    setDataNascimento(pet.dataNascimento ?? "");
                    setIdade(pet.idade ?? "");
                    setPeso(pet.peso ?? "");
                    setCor(pet.cor ?? "");
                    setCastrado(pet.castrado ?? "");
                    if (!pet.alergias || pet.alergias === "Nenhuma") {
                      setHasAlergias("Não");
                      setAlergias("");
                    } else {
                      setHasAlergias("Sim");
                      setAlergias(pet.alergias);
                    }
                    if (!pet.doencas || pet.doencas === "Nenhuma") {
                      setHasDoencas("Não");
                      setDoencas("");
                    } else {
                      setHasDoencas("Sim");
                      setDoencas(pet.doencas);
                    }
                    if (!pet.medicamentos || pet.medicamentos === "Nenhum") {
                      setHasMedicamentos("Não");
                      setMedicamentos("");
                    } else {
                      setHasMedicamentos("Sim");
                      setMedicamentos(pet.medicamentos);
                    }
                    if (!pet.vacinas || pet.vacinas === "Não informado") {
                      setHasVacinas("Não");
                      setVacinas("");
                    } else {
                      setHasVacinas("Sim");
                      setVacinas(pet.vacinas);
                    }
                    setObservacoes(pet.observacoes ?? "");
                    setImageUri(null);
                  }
                }}
              >
                <Text style={[styles.cancelBtnText, { color: theme.text }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: theme.primary, opacity: saving ? 0.7 : 1 },
                ]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const petModalStyles = StyleSheet.create({
  imageContainer: {
    height: 120,
    width: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderStyle: "dashed",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 15 },
  optionPill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
});

function Field({
  label,
  value,
  editable,
  onChangeText,
  icon,
  keyboardType,
  maxLength,
  theme,
}: any) {
  return (
    <View style={fieldStyles.wrapper}>
      <View style={fieldStyles.labelRow}>
        {icon && (
          <Feather
            name={icon as any}
            size={13}
            color={theme.textSecondary}
            style={fieldStyles.icon}
          />
        )}
        <Text style={[fieldStyles.label, { color: theme.textSecondary }]}>
          {label}
        </Text>
      </View>
      {editable ? (
        <TextInput
          style={[
            fieldStyles.input,
            {
              backgroundColor: theme.surface,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || "default"}
          maxLength={maxLength}
        />
      ) : (
        <Text style={[fieldStyles.value, { color: theme.text }]}>
          {value || "—"}
        </Text>
      )}
      <View
        style={[fieldStyles.underline, { backgroundColor: theme.border }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  backButton: {
    position: "absolute",
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  themeToggleButton: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteAccountBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  deleteAccountText: { color: "#EF4444", fontSize: 15, fontWeight: "600" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: "700" },
  subtitle: { fontSize: 13, marginTop: 2 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editBtnText: { color: "#FFF", fontSize: 14, fontWeight: "600" },
  divider: { height: 1, marginBottom: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: { flexDirection: "row", gap: 12 },
  rowSmall: { flex: 1 },
  rowLarge: { flex: 2 },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600" },
  saveBtn: {
    flex: 2,
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtnText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  historicoSection: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  historicoHeader: { flexDirection: "row", alignItems: "center", padding: 16 },
  historicoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  historicoTitulo: { fontSize: 15, fontWeight: "700" },
  historicoSubtitulo: { fontSize: 12, marginTop: 2 },
  historicoLista: { borderTopWidth: 1 },
  listaItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  listaItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  listaItemTitulo: { fontSize: 14, fontWeight: "600" },
  listaItemData: { fontSize: 12, marginTop: 2 },
  emptyState: { alignItems: "center", paddingVertical: 28, gap: 10 },
  emptyText: { fontSize: 13, textAlign: "center", paddingHorizontal: 20 },
});

const fieldStyles = StyleSheet.create({
  wrapper: { marginBottom: 18 },
  labelRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  icon: { marginRight: 5 },
  label: { fontSize: 12 },
  value: { fontSize: 15, fontWeight: "500", paddingVertical: 4 },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  underline: { height: 1, marginTop: 8 },
});

const deleteModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  box: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 20,
  },
  input: { flex: 1, fontSize: 15 },
  btnRow: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelText: { fontSize: 15, fontWeight: "600" },
  deleteBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
});
