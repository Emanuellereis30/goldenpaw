import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useAppTheme } from "../../hooks/use-app-theme";

// ── Props ─────────────────────────────────────────────────────────────────────

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
}

interface FormData {
  // Etapa 1: Dados Pessoais
  nomeCompleto: string;
  dataNascimento: string;
  cpf: string;
  celular: string;
  email: string;

  // Etapa 2: Informações de Moradia
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

  // Etapa 3: Dinâmica Familiar
  quantidadePessoas: string;
  temCriancas: boolean | null;
  temIdosos: boolean | null;
  todosAcordam: boolean | null;
  temAlergias: boolean | null;
  temAlergiasQuem: string;
  tempoSozinho: string;

  // Etapa 4: Histórico com Animais
  possuiOutrosAnimais: boolean | null;
  outrosAnimaisDescricao: string;
  jaTeveAnimais: boolean | null;
  jaTeveAnimaisDescricao: string;

  // Etapa 5: Termo de Responsabilidade
  cienteFinanceiro: boolean | null;
  planosViagem: string;
  concordaAcompanhamento: boolean | null;
  observacoes: string;
}

interface Props {
  pet: Pet;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
}

// ── Funções Auxiliares ────────────────────────────────────────────────────────

const aplicarMascara = (texto: string, mascara: string): string => {
  let resultado = "";
  let textoIndex = 0;

  for (let i = 0; i < mascara.length && textoIndex < texto.length; i++) {
    if (mascara[i] === "X") {
      resultado += texto[textoIndex];
      textoIndex++;
    } else {
      resultado += mascara[i];
    }
  }

  return resultado;
};

const validarEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const calcularIdade = (data: string): number => {
  const [dia, mes, ano] = data.split("/").map(Number);
  const hoje = new Date();
  let idade = hoje.getFullYear() - ano;

  if (
    hoje.getMonth() < mes - 1 ||
    (hoje.getMonth() === mes - 1 && hoje.getDate() < dia)
  ) {
    idade--;
  }

  return idade;
};

// ── Componente Principal ──────────────────────────────────────────────────────

export default function AdocaoFormulario({ pet, onSubmit, onCancel }: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [etapaAtual, setEtapaAtual] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    nomeCompleto: "",
    dataNascimento: "",
    cpf: "",
    celular: "",
    email: "",
    endereco: "",
    cep: "",
    bairro: "",
    cidade: "",
    tipoResidencia: "",
    situacaoImovel: "",
    proprietarioPermiteAnimais: null,
    quintalFechado: null,
    rotasFuga: null,
    telasProtecao: null,
    quantidadePessoas: "",
    temCriancas: null,
    temIdosos: null,
    todosAcordam: null,
    temAlergias: null,
    temAlergiasQuem: "",
    tempoSozinho: "",
    possuiOutrosAnimais: null,
    outrosAnimaisDescricao: "",
    jaTeveAnimais: null,
    jaTeveAnimaisDescricao: "",
    cienteFinanceiro: null,
    planosViagem: "",
    concordaAcompanhamento: null,
    observacoes: "",
  });

  // ── Validações ────────────────────────────────────────────────────────────

  const validarEtapa1 = (): boolean => {
    if (form.nomeCompleto.length < 15) {
      Alert.alert("Erro", "Nome completo deve ter no mínimo 15 caracteres");
      return false;
    }
    if (!form.dataNascimento || form.dataNascimento.length < 10) {
      Alert.alert("Erro", "Data de nascimento inválida");
      return false;
    }
    if (calcularIdade(form.dataNascimento) < 18) {
      Alert.alert("Erro", "Você deve ter no mínimo 18 anos para adotar");
      return false;
    }
    if (form.cpf.replace(/\D/g, "").length !== 11) {
      Alert.alert("Erro", "CPF deve ter 11 dígitos");
      return false;
    }
    if (form.celular.replace(/\D/g, "").length !== 11) {
      Alert.alert("Erro", "Celular deve ter 11 dígitos");
      return false;
    }
    if (!validarEmail(form.email)) {
      Alert.alert("Erro", "Email inválido");
      return false;
    }
    return true;
  };

  const validarEtapa2 = (): boolean => {
    if (!form.endereco.trim()) {
      Alert.alert("Erro", "Endereço é obrigatório");
      return false;
    }
    if (form.cep.replace(/\D/g, "").length !== 8) {
      Alert.alert("Erro", "CEP deve ter 8 dígitos");
      return false;
    }
    if (!form.bairro.trim() || !form.cidade.trim()) {
      Alert.alert("Erro", "Bairro e cidade são obrigatórios");
      return false;
    }
    if (!form.tipoResidencia) {
      Alert.alert("Erro", "Tipo de residência é obrigatório");
      return false;
    }
    if (!form.situacaoImovel) {
      Alert.alert("Erro", "Situação do imóvel é obrigatória");
      return false;
    }
    if (
      form.situacaoImovel === "alugado" &&
      form.proprietarioPermiteAnimais === null
    ) {
      Alert.alert("Erro", "Responda se o proprietário permite animais");
      return false;
    }
    return true;
  };

  const validarEtapa3 = (): boolean => {
    if (!form.quantidadePessoas.trim()) {
      Alert.alert("Erro", "Quantidade de pessoas é obrigatória");
      return false;
    }
    if (
      form.temCriancas === null ||
      form.temIdosos === null ||
      form.todosAcordam === null
    ) {
      Alert.alert(
        "Erro",
        "Responda todas as perguntas sobre dinâmica familiar",
      );
      return false;
    }
    if (form.temAlergias === null) {
      Alert.alert("Erro", "Responda sobre alergias");
      return false;
    }
    if (!form.tempoSozinho.trim()) {
      Alert.alert("Erro", "Tempo sozinho é obrigatório");
      return false;
    }
    return true;
  };

  const validarEtapa4 = (): boolean => {
    if (form.possuiOutrosAnimais === null || form.jaTeveAnimais === null) {
      Alert.alert("Erro", "Responda sobre histórico com animais");
      return false;
    }
    return true;
  };

  const validarEtapa5 = (): boolean => {
    if (
      form.cienteFinanceiro === null ||
      form.concordaAcompanhamento === null
    ) {
      Alert.alert("Erro", "Responda todas as perguntas");
      return false;
    }
    if (!form.planosViagem.trim()) {
      Alert.alert("Erro", "Descreva seus planos para viagens/mudanças");
      return false;
    }
    return true;
  };

  const validarEtapaAtual = (): boolean => {
    switch (etapaAtual) {
      case 1:
        return validarEtapa1();
      case 2:
        return validarEtapa2();
      case 3:
        return validarEtapa3();
      case 4:
        return validarEtapa4();
      case 5:
        return validarEtapa5();
      default:
        return true;
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleProxima = () => {
    if (validarEtapaAtual()) {
      setEtapaAtual(etapaAtual + 1);
    }
  };

  const handleAnterior = () => {
    setEtapaAtual(etapaAtual - 1);
  };

  const handleEnviar = async () => {
    if (!validarEtapaAtual()) return;

    try {
      setLoading(true);
      await onSubmit(form);
    } catch (error) {
      console.error("Erro ao enviar:", error);
    } finally {
      setLoading(false);
    }
  };

  // ── Renderizadores ───────────────────────────────────────────────────────

  const renderEtapa1 = () => (
    <View>
      <Text style={[styles.etapaTitle, { color: theme.text }]}>
        Dados Pessoais
      </Text>

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: theme.text }]}>
          Nome Completo *
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: theme.border,
              color: theme.text,
              backgroundColor: theme.surface,
            },
          ]}
          placeholder="Seu nome completo"
          placeholderTextColor={theme.textSecondary}
          value={form.nomeCompleto}
          onChangeText={(text) => setForm({ ...form, nomeCompleto: text })}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: theme.text }]}>
          Data de Nascimento (DD/MM/AAAA) *
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: theme.border,
              color: theme.text,
              backgroundColor: theme.surface,
            },
          ]}
          placeholder="01/01/1990"
          placeholderTextColor={theme.textSecondary}
          value={form.dataNascimento}
          onChangeText={(text) => {
            const mascarado = aplicarMascara(
              text.replace(/\D/g, ""),
              "XX/XX/XXXX",
            );
            setForm({ ...form, dataNascimento: mascarado });
          }}
          keyboardType="numeric"
          maxLength={10}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: theme.text }]}>
          CPF (XXX.XXX.XXX-XX) *
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: theme.border,
              color: theme.text,
              backgroundColor: theme.surface,
            },
          ]}
          placeholder="123.456.789-00"
          placeholderTextColor={theme.textSecondary}
          value={form.cpf}
          onChangeText={(text) => {
            const mascarado = aplicarMascara(
              text.replace(/\D/g, ""),
              "XXX.XXX.XXX-XX",
            );
            setForm({ ...form, cpf: mascarado });
          }}
          keyboardType="numeric"
          maxLength={14}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: theme.text }]}>
          Celular ((XX)XXXXX-XXXX) *
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: theme.border,
              color: theme.text,
              backgroundColor: theme.surface,
            },
          ]}
          placeholder="(11)98765-4321"
          placeholderTextColor={theme.textSecondary}
          value={form.celular}
          onChangeText={(text) => {
            const mascarado = aplicarMascara(
              text.replace(/\D/g, ""),
              "(XX)XXXXX-XXXX",
            );
            setForm({ ...form, celular: mascarado });
          }}
          keyboardType="numeric"
          maxLength={14}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: theme.text }]}>Email *</Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: theme.border,
              color: theme.text,
              backgroundColor: theme.surface,
            },
          ]}
          placeholder="seu@email.com"
          placeholderTextColor={theme.textSecondary}
          value={form.email}
          onChangeText={(text) => setForm({ ...form, email: text })}
          keyboardType="email-address"
        />
      </View>
    </View>
  );

  const renderEtapa2 = () => (
    <View>
      <Text style={[styles.etapaTitle, { color: theme.text }]}>
        Informações de Moradia
      </Text>

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: theme.text }]}>
          CEP (XXXXX-XXX) *
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: theme.border,
              color: theme.text,
              backgroundColor: theme.surface,
            },
          ]}
          placeholder="01234-567"
          placeholderTextColor={theme.textSecondary}
          value={form.cep}
          onChangeText={(text) => {
            const mascarado = aplicarMascara(
              text.replace(/\D/g, ""),
              "XXXXX-XXX",
            );
            setForm({ ...form, cep: mascarado });
          }}
          keyboardType="numeric"
          maxLength={9}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: theme.text }]}>Endereço *</Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: theme.border,
              color: theme.text,
              backgroundColor: theme.surface,
            },
          ]}
          placeholder="Rua das Flores, 123"
          placeholderTextColor={theme.textSecondary}
          value={form.endereco}
          onChangeText={(text) => setForm({ ...form, endereco: text })}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: theme.text }]}>Bairro *</Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: theme.border,
              color: theme.text,
              backgroundColor: theme.surface,
            },
          ]}
          placeholder="Centro"
          placeholderTextColor={theme.textSecondary}
          value={form.bairro}
          onChangeText={(text) => setForm({ ...form, bairro: text })}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: theme.text }]}>Cidade *</Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: theme.border,
              color: theme.text,
              backgroundColor: theme.surface,
            },
          ]}
          placeholder="São Paulo"
          placeholderTextColor={theme.textSecondary}
          value={form.cidade}
          onChangeText={(text) => setForm({ ...form, cidade: text })}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: theme.text }]}>
          Tipo de Residência *
        </Text>
        <View style={styles.selectContainer}>
          {["Casa", "Apto.", "Sítio", "Outro"].map((tipo) => (
            <TouchableOpacity
              key={tipo}
              style={[
                styles.selectOption,
                {
                  backgroundColor:
                    form.tipoResidencia === tipo
                      ? theme.primary
                      : theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => setForm({ ...form, tipoResidencia: tipo })}
            >
              <Text
                style={[
                  styles.selectOptionText,
                  {
                    color: form.tipoResidencia === tipo ? "#fff" : theme.text,
                  },
                ]}
              >
                {tipo}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: theme.text }]}>
          Situação do Imóvel *
        </Text>
        <View style={styles.selectContainer}>
          {["Próprio", "Alugado"].map((situacao) => (
            <TouchableOpacity
              key={situacao}
              style={[
                styles.selectOption,
                {
                  backgroundColor:
                    form.situacaoImovel === situacao.toLowerCase()
                      ? theme.primary
                      : theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={() =>
                setForm({
                  ...form,
                  situacaoImovel: situacao.toLowerCase() as
                    | "proprio"
                    | "alugado",
                })
              }
            >
              <Text
                style={[
                  styles.selectOptionText,
                  {
                    color:
                      form.situacaoImovel === situacao.toLowerCase()
                        ? "#fff"
                        : theme.text,
                  },
                ]}
              >
                {situacao}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {form.situacaoImovel === "alugado" && (
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.text }]}>
            O proprietário permite animais? *
          </Text>
          <View style={styles.selectContainer}>
            {["Sim", "Não"].map((resp) => (
              <TouchableOpacity
                key={resp}
                style={[
                  styles.selectOption,
                  {
                    backgroundColor:
                      form.proprietarioPermiteAnimais === (resp === "Sim")
                        ? theme.primary
                        : theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() =>
                  setForm({
                    ...form,
                    proprietarioPermiteAnimais: resp === "Sim",
                  })
                }
              >
                <Text
                  style={[
                    styles.selectOptionText,
                    {
                      color:
                        form.proprietarioPermiteAnimais === (resp === "Sim")
                          ? "#fff"
                          : theme.text,
                    },
                  ]}
                >
                  {resp}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>
        Segurança Estrutural
      </Text>

      <BooleanQuestion
        label="Possui quintal fechado?"
        value={form.quintalFechado}
        onChange={(val) => setForm({ ...form, quintalFechado: val })}
      />

      <BooleanQuestion
        label="Existem rotas de fuga?"
        value={form.rotasFuga}
        onChange={(val) => setForm({ ...form, rotasFuga: val })}
      />

      <BooleanQuestion
        label="Possui telas de proteção nas janelas?"
        value={form.telasProtecao}
        onChange={(val) => setForm({ ...form, telasProtecao: val })}
      />
    </View>
  );

  const renderEtapa3 = () => (
    <View>
      <Text style={[styles.etapaTitle, { color: theme.text }]}>
        Dinâmica Familiar
      </Text>

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: theme.text }]}>
          Quantas pessoas moram na residência? *
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: theme.border,
              color: theme.text,
              backgroundColor: theme.surface,
            },
          ]}
          placeholder="Ex: 4"
          placeholderTextColor={theme.textSecondary}
          value={form.quantidadePessoas}
          onChangeText={(text) =>
            setForm({ ...form, quantidadePessoas: text.replace(/\D/g, "") })
          }
          keyboardType="numeric"
        />
      </View>

      <BooleanQuestion
        label="Há crianças na casa?"
        value={form.temCriancas}
        onChange={(val) => setForm({ ...form, temCriancas: val })}
      />

      <BooleanQuestion
        label="Há idosos na casa?"
        value={form.temIdosos}
        onChange={(val) => setForm({ ...form, temIdosos: val })}
      />

      <BooleanQuestion
        label="Todos os moradores concordam com a adoção?"
        value={form.todosAcordam}
        onChange={(val) => setForm({ ...form, todosAcordam: val })}
      />

      <BooleanQuestion
        label="Alguém na casa tem alergia a pelos?"
        value={form.temAlergias}
        onChange={(val) => setForm({ ...form, temAlergias: val })}
      />

      {form.temAlergias && (
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Quem? *</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: theme.border,
                color: theme.text,
                backgroundColor: theme.surface,
              },
            ]}
            placeholder="Descreva quem tem alergia"
            placeholderTextColor={theme.textSecondary}
            value={form.temAlergiasQuem}
            onChangeText={(text) => setForm({ ...form, temAlergiasQuem: text })}
          />
        </View>
      )}

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: theme.text }]}>
          Quantas horas por dia o animal ficará sozinho? *
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: theme.border,
              color: theme.text,
              backgroundColor: theme.surface,
            },
          ]}
          placeholder="Ex: 4 horas"
          placeholderTextColor={theme.textSecondary}
          value={form.tempoSozinho}
          onChangeText={(text) => setForm({ ...form, tempoSozinho: text })}
        />
      </View>
    </View>
  );

  const renderEtapa4 = () => (
    <View>
      <Text style={[styles.etapaTitle, { color: theme.text }]}>
        Histórico com Animais
      </Text>

      <BooleanQuestion
        label="Possui outros animais?"
        value={form.possuiOutrosAnimais}
        onChange={(val) => setForm({ ...form, possuiOutrosAnimais: val })}
      />

      {form.possuiOutrosAnimais && (
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.text }]}>
            Descreva os animais *
          </Text>
          <TextInput
            style={[
              styles.textArea,
              {
                borderColor: theme.border,
                color: theme.text,
                backgroundColor: theme.surface,
              },
            ]}
            placeholder="Espécie, idade, temperamento, vacinação..."
            placeholderTextColor={theme.textSecondary}
            value={form.outrosAnimaisDescricao}
            onChangeText={(text) =>
              setForm({ ...form, outrosAnimaisDescricao: text })
            }
            multiline
          />
        </View>
      )}

      <BooleanQuestion
        label="Já teve animais antes?"
        value={form.jaTeveAnimais}
        onChange={(val) => setForm({ ...form, jaTeveAnimais: val })}
      />

      {form.jaTeveAnimais && (
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.text }]}>
            Descreva os animais anteriores *
          </Text>
          <TextInput
            style={[
              styles.textArea,
              {
                borderColor: theme.border,
                color: theme.text,
                backgroundColor: theme.surface,
              },
            ]}
            placeholder="O que aconteceu com eles..."
            placeholderTextColor={theme.textSecondary}
            value={form.jaTeveAnimaisDescricao}
            onChangeText={(text) =>
              setForm({ ...form, jaTeveAnimaisDescricao: text })
            }
            multiline
          />
        </View>
      )}
    </View>
  );

  const renderEtapa5 = () => (
    <View>
      <Text style={[styles.etapaTitle, { color: theme.text }]}>
        Termo de Responsabilidade
      </Text>

      <BooleanQuestion
        label="Está ciente dos custos com alimentação, vacinas e emergências?"
        value={form.cienteFinanceiro}
        onChange={(val) => setForm({ ...form, cienteFinanceiro: val })}
      />

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: theme.text }]}>
          O que planeja fazer com o animal em caso de viagens ou mudanças? *
        </Text>
        <TextInput
          style={[
            styles.textArea,
            {
              borderColor: theme.border,
              color: theme.text,
              backgroundColor: theme.surface,
            },
          ]}
          placeholder="Descreva seus planos..."
          placeholderTextColor={theme.textSecondary}
          value={form.planosViagem}
          onChangeText={(text) => setForm({ ...form, planosViagem: text })}
          multiline
        />
      </View>

      <BooleanQuestion
        label="Concorda em enviar fotos e receber visitas de acompanhamento?"
        value={form.concordaAcompanhamento}
        onChange={(val) => setForm({ ...form, concordaAcompanhamento: val })}
      />

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: theme.text }]}>Observações</Text>
        <TextInput
          style={[
            styles.textArea,
            {
              borderColor: theme.border,
              color: theme.text,
              backgroundColor: theme.surface,
            },
          ]}
          placeholder="Adicione qualquer informação relevante..."
          placeholderTextColor={theme.textSecondary}
          value={form.observacoes}
          onChangeText={(text) => setForm({ ...form, observacoes: text })}
          multiline
        />
      </View>
    </View>
  );

  const renderContent = () => {
    switch (etapaAtual) {
      case 1:
        return renderEtapa1();
      case 2:
        return renderEtapa2();
      case 3:
        return renderEtapa3();
      case 4:
        return renderEtapa4();
      case 5:
        return renderEtapa5();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 30 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Adotar {pet.nome}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Barra de Progresso */}
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              {
                backgroundColor: theme.primary,
                width: `${(etapaAtual / 5) * 100}%`,
              },
            ]}
          />
        </View>

        <Text style={[styles.stepCounter, { color: theme.textSecondary }]}>
          Etapa {etapaAtual} de 5
        </Text>

        {/* Conteúdo */}
        <View style={styles.content}>{renderContent()}</View>

        {/* Botões */}
        <View style={styles.buttonsContainer}>
          {etapaAtual > 1 && (
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.border,
                },
              ]}
              onPress={handleAnterior}
              disabled={loading}
            >
              <Text style={[styles.buttonText, { color: theme.text }]}>
                Anterior
              </Text>
            </TouchableOpacity>
          )}

          {etapaAtual < 5 ? (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={handleProxima}
              disabled={loading}
            >
              <Text style={[styles.buttonText, { color: "#fff" }]}>
                Próxima
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: loading
                    ? theme.textSecondary
                    : theme.primary,
                },
              ]}
              onPress={handleEnviar}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.buttonText, { color: "#fff" }]}>
                  Enviar Formulário
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Componente Auxiliar ───────────────────────────────────────────────────────

interface BooleanQuestionProps {
  label: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
}

function BooleanQuestion({ label, value, onChange }: BooleanQuestionProps) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.questionContainer}>
      <Text style={[styles.questionLabel, { color: theme.text }]}>{label}</Text>
      <View style={styles.selectContainer}>
        {["Sim", "Não"].map((opcao) => (
          <TouchableOpacity
            key={opcao}
            style={[
              styles.selectOption,
              {
                backgroundColor:
                  value === (opcao === "Sim") ? theme.primary : theme.surface,
                borderColor: theme.border,
              },
            ]}
            onPress={() => onChange(opcao === "Sim")}
          >
            <Text
              style={[
                styles.selectOptionText,
                {
                  color: value === (opcao === "Sim") ? "#fff" : theme.text,
                },
              ]}
            >
              {opcao}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  progressContainer: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  stepCounter: {
    fontSize: 12,
    marginBottom: 20,
  },
  content: {
    marginBottom: 20,
  },
  etapaTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
  },
  questionContainer: {
    marginBottom: 16,
  },
  questionLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  selectContainer: {
    flexDirection: "row",
    gap: 8,
  },
  selectOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  selectOptionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
