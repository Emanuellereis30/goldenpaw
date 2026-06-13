// app/adoption/detalhes.tsx
import { useNotification } from "@/contexts/NotificationContext";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router"; // <-- Adicionado o Stack
import { addDoc, collection } from "firebase/firestore";
import React, { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { db } from "../../firebaseConfig";
import AdocaoFormulario from "./AdocaoFormulario";

// Tipo Pet definido localmente
interface Pet {
  id: string;
  nome: string;
  raca: string;
  age: string;
  cidade: string;
  uf: string;
  porte: "pequeno" | "médio" | "grande";
  sexo: "macho" | "fêmea";
  tags: string[];
  image?: any;
}

interface FormData {
  nomeCompleto: string;
  dataNascimento: string;
  cpf: string;
  celular: string;
  email: string;
  endereco: string;
  cep: string;
  bairro: string;
  cidade: string;
  tipoResidencia: string;
  situacaoImovel: "proprio" | "alugado" | "";
  proprietarioPermiteAnimais: boolean | null;
  quintalFechado: boolean | null;
  rotasFuga: boolean | null;
  telasProtecao: boolean | null;
  quantidadePessoas: string;
  temCriancas: boolean | null;
  temIdosos: boolean | null;
  todosAcordam: boolean | null;
  temAlergias: boolean | null;
  temAlergiasQuem: string;
  tempoSozinho: string;
  possuiOutrosAnimais: boolean | null;
  outrosAnimaisDescricao: string;
  jaTeveAnimais: boolean | null;
  jaTeveAnimaisDescricao: string;
  cienteFinanceiro: boolean | null;
  planosViagem: string;
  concordaAcompanhamento: boolean | null;
  observacoes: string;
}

export default function DetalhesAdocaoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showNotification } = useNotification();
  const { theme } = useAppTheme();

  // Estado para o Modal de Cancelamento
  const [showCancelModal, setShowCancelModal] = useState(false);

  const petId = params.petId as string;
  const petJson = params.pet as string;

  let pet: Pet;
  try {
    pet = JSON.parse(petJson);
  } catch (error) {
    console.error("Erro ao fazer parse do pet:", error);
    router.back();
    return null;
  }

  const handleSubmit = async (formData: FormData) => {
    try {
      await addDoc(collection(db, "requisicoes_adocao"), {
        // Dados do pet
        petId: pet.id,
        petNome: pet.nome,
        petRaca: pet.raca,
        petPorte: pet.porte,
        petSexo: pet.sexo,

        // Dados brutos do form
        ...formData,

        // Campos específicos formatados para o Admin
        clienteNome: formData.nomeCompleto,
        usuarioNome: formData.nomeCompleto,
        telefone: formData.celular,

        motivo: formData.observacoes
          ? formData.observacoes
          : "Sem observações adicionais.",

        // Metadados
        data: new Date().toLocaleDateString("pt-BR"),
        criadoEm: new Date().toISOString(),
        status: "pendente",
        visualizado: false,
      });

      showNotification(
        "Sucesso! 🎉",
        `Seu formulário para adotar o/a ${pet.nome} foi enviado! Entraremos em contato em breve.`,
        "success",
      );
      router.back();
    } catch (error) {
      console.error("Erro ao salvar formulário:", error);
      showNotification(
        "Erro",
        "Não foi possível enviar o formulário. Verifique sua conexão e tente novamente.",
        "error",
      );
    }
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const confirmCancel = () => {
    setShowCancelModal(false);
    router.back();
  };

  return (
    <>
      {/* ── REMOVE O CABEÇALHO NATIVO DO EXPO ROUTER PARA EVITAR SOBREPOSIÇÃO ── */}
      <Stack.Screen options={{ headerShown: false }} />

      <AdocaoFormulario
        pet={pet}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />

      {/* ── MODAL DE CONFIRMAÇÃO DE CANCELAMENTO ── */}
      <Modal visible={showCancelModal} transparent animationType="fade">
        <View style={modalConfirmStyles.overlay}>
          <View
            style={[
              modalConfirmStyles.box,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
          >
            <Ionicons
              name="alert-circle-outline"
              size={36}
              color={theme.error || "#ef4444"}
              style={{ marginBottom: 12 }}
            />
            <Text style={[modalConfirmStyles.title, { color: theme.text }]}>
              Cancelar Formulário
            </Text>
            <Text
              style={[
                modalConfirmStyles.subtitle,
                { color: theme.textSecondary },
              ]}
            >
              Tem certeza que deseja sair? Os dados preenchidos até agora não
              serão salvos.
            </Text>
            <View style={modalConfirmStyles.btnRow}>
              <TouchableOpacity
                style={[modalConfirmStyles.btn, { borderColor: theme.border }]}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={{ color: theme.text, fontWeight: "600" }}>
                  Continuar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  modalConfirmStyles.btn,
                  {
                    backgroundColor: theme.error || "#ef4444",
                    borderColor: theme.error || "#ef4444",
                  },
                ]}
                onPress={confirmCancel}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Sair</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// Estilos do Modal
const modalConfirmStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  box: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  btnRow: { flexDirection: "row", gap: 12, width: "100%" },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
