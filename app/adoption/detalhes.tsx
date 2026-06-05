import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection } from "firebase/firestore";
import React from "react";
import { Alert } from "react-native";
import { db } from "../../firebaseConfig"; // Ajuste o caminho se necessário
import AdocaoFormulario from "./AdocaoFormulario";

// Tipo Pet definido localmente (copie de adocao.tsx se necessário)
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

  // Recupere os dados do pet passados como parâmetro
  const petId = params.petId as string;
  const petJson = params.pet as string;

  // Parse do JSON do pet
  let pet: Pet;
  try {
    pet = JSON.parse(petJson);
  } catch (error) {
    console.error("Erro ao fazer parse do pet:", error);
    // Fallback - retorne para a página anterior
    router.back();
    return null;
  }

  const handleSubmit = async (formData: FormData) => {
    try {
      // Salve o formulário no Firebase
      const docRef = await addDoc(collection(db, "formularios_adocao"), {
        // Dados do pet
        petId: pet.id,
        petNome: pet.nome,
        petRaca: pet.raca,
        petPorte: pet.porte,
        petSexo: pet.sexo,

        // Dados do formulário
        ...formData,

        // Metadados
        criadoEm: new Date().toISOString(),
        status: "pendente", // pendente, aprovado, rejeitado
        visualizado: false,
      });

      console.log("Formulário salvo com ID:", docRef.id);

      Alert.alert(
        "Sucesso! 🎉",
        `Seu formulário para adotar ${pet.nome} foi enviado! Entraremos em contato em breve.`,
        [
          {
            text: "OK",
            onPress: () => {
              // Volte para a página de adoção
              router.back();
            },
          },
        ],
      );
    } catch (error) {
      console.error("Erro ao salvar formulário:", error);
      Alert.alert(
        "Erro",
        "Não foi possível enviar o formulário. Tente novamente.",
      );
      throw error;
    }
  };

  const handleCancel = () => {
    Alert.alert("Cancelar", "Tem certeza que deseja cancelar o formulário?", [
      {
        text: "Não",
        onPress: () => {},
        style: "cancel",
      },
      {
        text: "Sim",
        onPress: () => {
          router.back();
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <AdocaoFormulario
      pet={pet}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}
