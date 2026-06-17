// app/adoption/AdocaoFormulario.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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

// ── Props & Interfaces ────────────────────────────────────────────────────────

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
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

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

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleCepChange = async (text: string) => {
    const cleanCep = text.replace(/\D/g, "");
    const mascarado = aplicarMascara(cleanCep, "XXXXX-XXX");

    setForm((prev) => ({ ...prev, cep: mascarado }));

    if (cleanCep.length === 8) {
      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${cleanCep}/json/`,
        );
        const data = await response.json();

        if (!data.erro) {
          setForm((prev) => ({
            ...prev,
            endereco: data.logradouro || prev.endereco,
            bairro: data.bairro || prev.bairro,
            cidade: data.localidade || prev.cidade,
          }));
          setErrors((prevErrors) => ({ ...prevErrors, cep: undefined }));
        }
      } catch (e) {
        console.error("Erro ao procurar o CEP", e);
      }
    }
  };

  const validarEtapa1 = (): boolean => {
    let newErrors: Record<string, string> = {};
    if (form.nomeCompleto.trim().length < 15)
      newErrors.nomeCompleto = "Mínimo 15 letras.";
    if (!form.dataNascimento || form.dataNascimento.length < 10) {
      newErrors.dataNascimento = "Data inválida.";
    } else if (calcularIdade(form.dataNascimento) < 18) {
      newErrors.dataNascimento = "Apenas maiores de 18 anos.";
    }
    if (form.cpf.replace(/\D/g, "").length !== 11)
      newErrors.cpf = "CPF deve ter 11 dígitos.";
    if (form.celular.replace(/\D/g, "").length !== 11)
      newErrors.celular = "Celular inválido.";
    if (!validarEmail(form.email)) newErrors.email = "E-mail inválido.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validarEtapa2 = (): boolean => {
    let newErrors: Record<string, string> = {};
    if (form.cep.replace(/\D/g, "").length !== 8)
      newErrors.cep = "CEP inválido.";
    if (!form.endereco.trim()) newErrors.endereco = "Obrigatório.";
    if (!form.bairro.trim()) newErrors.bairro = "Obrigatório.";
    if (!form.cidade.trim()) newErrors.cidade = "Obrigatória.";
    if (!form.tipoResidencia) newErrors.tipoResidencia = "Selecione o tipo.";
    if (!form.situacaoImovel)
      newErrors.situacaoImovel = "Selecione a situação.";
    if (
      form.situacaoImovel === "alugado" &&
      form.proprietarioPermiteAnimais === null
    ) {
      newErrors.proprietarioPermiteAnimais = "Responda esta pergunta.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validarEtapa3 = (): boolean => {
    let newErrors: Record<string, string> = {};
    if (!form.quantidadePessoas.trim())
      newErrors.quantidadePessoas = "Obrigatório.";
    if (form.temCriancas === null) newErrors.temCriancas = "Obrigatório.";
    if (form.temIdosos === null) newErrors.temIdosos = "Obrigatório.";
    if (form.todosAcordam === null) newErrors.todosAcordam = "Obrigatório.";
    if (form.temAlergias === null) newErrors.temAlergias = "Obrigatório.";
    if (form.temAlergias && !form.temAlergiasQuem.trim())
      newErrors.temAlergiasQuem = "Descreva.";
    if (!form.tempoSozinho.trim()) newErrors.tempoSozinho = "Obrigatório.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validarEtapa4 = (): boolean => {
    let newErrors: Record<string, string> = {};
    if (form.possuiOutrosAnimais === null)
      newErrors.possuiOutrosAnimais = "Obrigatório.";
    if (form.possuiOutrosAnimais && !form.outrosAnimaisDescricao.trim()) {
      newErrors.outrosAnimaisDescricao = "Descreva os animais.";
    }
    if (form.jaTeveAnimais === null) newErrors.jaTeveAnimais = "Obrigatório.";
    if (form.jaTeveAnimais && !form.jaTeveAnimaisDescricao.trim()) {
      newErrors.jaTeveAnimaisDescricao = "Descreva os anteriores.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validarEtapa5 = (): boolean => {
    let newErrors: Record<string, string> = {};
    if (form.cienteFinanceiro === null)
      newErrors.cienteFinanceiro = "Obrigatório.";
    if (!form.planosViagem.trim())
      newErrors.planosViagem = "Descreva seus planos.";
    if (form.concordaAcompanhamento === null)
      newErrors.concordaAcompanhamento = "Obrigatório.";
    // NOVO: validação de observações
    if (!form.observacoes.trim()) {
      newErrors.observacoes = "Por favor, adicione observações relevantes.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  const handleProxima = () => {
    if (validarEtapaAtual()) {
      setErrors({});
      setEtapaAtual(etapaAtual + 1);
    }
  };

  const handleAnterior = () => {
    setErrors({});
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
      <Text style={[styles.title, { color: theme.text }]}>Dados Pessoais</Text>

      <CustomInput
        theme={theme}
        label="Nome Completo *"
        placeholder="O seu nome completo"
        value={form.nomeCompleto}
        onChange={(t: string) => setForm({ ...form, nomeCompleto: t })}
        autoCapitalize="words"
        errorMessage={errors.nomeCompleto}
      />
      <CustomInput
        theme={theme}
        label="Data de Nascimento *"
        placeholder="DD/MM/AAAA"
        value={form.dataNascimento}
        onChange={(t: string) => {
          const m = aplicarMascara(t.replace(/\D/g, ""), "XX/XX/XXXX");
          setForm({ ...form, dataNascimento: m });
        }}
        keyboard="numeric"
        maxLength={10}
        errorMessage={errors.dataNascimento}
      />
      <CustomInput
        theme={theme}
        label="CPF *"
        placeholder="XXX.XXX.XXX-XX"
        value={form.cpf}
        onChange={(t: string) => {
          const m = aplicarMascara(t.replace(/\D/g, ""), "XXX.XXX.XXX-XX");
          setForm({ ...form, cpf: m });
        }}
        keyboard="numeric"
        maxLength={14}
        errorMessage={errors.cpf}
      />
      <CustomInput
        theme={theme}
        label="Celular *"
        placeholder="(XX) XXXXX-XXXX"
        value={form.celular}
        onChange={(t: string) => {
          const m = aplicarMascara(t.replace(/\D/g, ""), "(XX)XXXXX-XXXX");
          setForm({ ...form, celular: m });
        }}
        keyboard="numeric"
        maxLength={14}
        errorMessage={errors.celular}
      />
      <CustomInput
        theme={theme}
        label="E-mail *"
        placeholder="seu@email.com"
        value={form.email}
        onChange={(t: string) => setForm({ ...form, email: t })}
        keyboard="email-address"
        autoCapitalize="none"
        errorMessage={errors.email}
      />
    </View>
  );

  const renderEtapa2 = () => (
    <View>
      <Text style={[styles.title, { color: theme.text }]}>Moradia</Text>

      <CustomInput
        theme={theme}
        label="CEP *"
        placeholder="XXXXX-XXX"
        value={form.cep}
        onChange={handleCepChange}
        keyboard="numeric"
        maxLength={9}
        errorMessage={errors.cep}
      />
      <CustomInput
        theme={theme}
        label="Endereço *"
        placeholder="Ex: Rua das Flores, 123"
        value={form.endereco}
        onChange={(t: string) => setForm({ ...form, endereco: t })}
        autoCapitalize="words"
        errorMessage={errors.endereco}
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <CustomInput
            theme={theme}
            label="Bairro *"
            placeholder="Centro"
            value={form.bairro}
            onChange={(t: string) => setForm({ ...form, bairro: t })}
            autoCapitalize="words"
            errorMessage={errors.bairro}
          />
        </View>
        <View style={{ flex: 1 }}>
          <CustomInput
            theme={theme}
            label="Cidade *"
            placeholder="São Paulo"
            value={form.cidade}
            onChange={(t: string) => setForm({ ...form, cidade: t })}
            autoCapitalize="words"
            errorMessage={errors.cidade}
          />
        </View>
      </View>

      <View style={styles.inputWrapper}>
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
                  borderColor: errors.tipoResidencia ? "#FF4D4D" : theme.border,
                },
              ]}
              onPress={() => setForm({ ...form, tipoResidencia: tipo })}
            >
              <Text
                style={[
                  styles.selectOptionText,
                  { color: form.tipoResidencia === tipo ? "#fff" : theme.text },
                ]}
              >
                {tipo}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.tipoResidencia ? (
          <Text style={styles.errorText}>{errors.tipoResidencia}</Text>
        ) : null}
      </View>

      <View style={styles.inputWrapper}>
        <Text style={[styles.label, { color: theme.text }]}>
          Situação do Imóvel *
        </Text>
        <View style={styles.selectContainer}>
          {["Próprio", "Alugado"].map((situacao) => {
            const value = situacao === "Próprio" ? "proprio" : "alugado";
            return (
              <TouchableOpacity
                key={situacao}
                style={[
                  styles.selectOption,
                  {
                    backgroundColor:
                      form.situacaoImovel === value
                        ? theme.primary
                        : theme.surface,
                    borderColor: errors.situacaoImovel
                      ? "#FF4D4D"
                      : theme.border,
                  },
                ]}
                onPress={() =>
                  setForm({
                    ...form,
                    situacaoImovel: value as "proprio" | "alugado",
                  })
                }
              >
                <Text
                  style={[
                    styles.selectOptionText,
                    {
                      color:
                        form.situacaoImovel === value ? "#fff" : theme.text,
                    },
                  ]}
                >
                  {situacao}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {errors.situacaoImovel ? (
          <Text style={styles.errorText}>{errors.situacaoImovel}</Text>
        ) : null}
      </View>

      {form.situacaoImovel === "alugado" && (
        <BooleanQuestion
          label="O proprietário permite animais? *"
          value={form.proprietarioPermiteAnimais}
          onChange={(val) =>
            setForm({ ...form, proprietarioPermiteAnimais: val })
          }
          errorMessage={errors.proprietarioPermiteAnimais}
        />
      )}

      <View style={styles.divider} />
      <Text style={[styles.title, { color: theme.text, fontSize: 18 }]}>
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
      <Text style={[styles.title, { color: theme.text }]}>
        Dinâmica Familiar
      </Text>

      <CustomInput
        theme={theme}
        label="Quantas pessoas moram na residência? *"
        placeholder="Ex: 4"
        value={form.quantidadePessoas}
        onChange={(t: string) =>
          setForm({ ...form, quantidadePessoas: t.replace(/\D/g, "") })
        }
        keyboard="numeric"
        errorMessage={errors.quantidadePessoas}
      />

      <BooleanQuestion
        label="Há crianças na casa?"
        value={form.temCriancas}
        onChange={(val) => setForm({ ...form, temCriancas: val })}
        errorMessage={errors.temCriancas}
      />
      <BooleanQuestion
        label="Há idosos na casa?"
        value={form.temIdosos}
        onChange={(val) => setForm({ ...form, temIdosos: val })}
        errorMessage={errors.temIdosos}
      />
      <BooleanQuestion
        label="Todos os moradores concordam com a adoção?"
        value={form.todosAcordam}
        onChange={(val) => setForm({ ...form, todosAcordam: val })}
        errorMessage={errors.todosAcordam}
      />
      <BooleanQuestion
        label="Alguém na casa tem alergia a pelos?"
        value={form.temAlergias}
        onChange={(val) => setForm({ ...form, temAlergias: val })}
        errorMessage={errors.temAlergias}
      />

      {form.temAlergias && (
        <CustomInput
          theme={theme}
          label="Quem possui alergia? *"
          placeholder="Descreva quem tem alergia"
          value={form.temAlergiasQuem}
          onChange={(t: string) => setForm({ ...form, temAlergiasQuem: t })}
          autoCapitalize="words"
          errorMessage={errors.temAlergiasQuem}
        />
      )}

      <CustomInput
        theme={theme}
        label="Quantas horas por dia o animal ficará sozinho? *"
        placeholder="Ex: 4 horas"
        value={form.tempoSozinho}
        onChange={(t: string) => setForm({ ...form, tempoSozinho: t })}
        errorMessage={errors.tempoSozinho}
      />
    </View>
  );

  const renderEtapa4 = () => (
    <View>
      <Text style={[styles.title, { color: theme.text }]}>
        Histórico com Animais
      </Text>

      <BooleanQuestion
        label="Possui outros animais?"
        value={form.possuiOutrosAnimais}
        onChange={(val) => setForm({ ...form, possuiOutrosAnimais: val })}
        errorMessage={errors.possuiOutrosAnimais}
      />

      {form.possuiOutrosAnimais && (
        <CustomInput
          theme={theme}
          label="Descreva os animais *"
          placeholder="Espécie, idade, temperamento..."
          value={form.outrosAnimaisDescricao}
          onChange={(t: string) =>
            setForm({ ...form, outrosAnimaisDescricao: t })
          }
          multiline={true}
          autoCapitalize="sentences"
          errorMessage={errors.outrosAnimaisDescricao}
        />
      )}

      <BooleanQuestion
        label="Já teve animais antes?"
        value={form.jaTeveAnimais}
        onChange={(val) => setForm({ ...form, jaTeveAnimais: val })}
        errorMessage={errors.jaTeveAnimais}
      />

      {form.jaTeveAnimais && (
        <CustomInput
          theme={theme}
          label="Descreva os animais anteriores *"
          placeholder="O que aconteceu com eles..."
          value={form.jaTeveAnimaisDescricao}
          onChange={(t: string) =>
            setForm({ ...form, jaTeveAnimaisDescricao: t })
          }
          multiline={true}
          autoCapitalize="sentences"
          errorMessage={errors.jaTeveAnimaisDescricao}
        />
      )}
    </View>
  );

  const renderEtapa5 = () => (
    <View>
      <Text style={[styles.title, { color: theme.text }]}>
        Termo de Responsabilidade
      </Text>

      <BooleanQuestion
        label="Ciente dos custos (alimentação, vacinas, emergências)?"
        value={form.cienteFinanceiro}
        onChange={(val) => setForm({ ...form, cienteFinanceiro: val })}
        errorMessage={errors.cienteFinanceiro}
      />

      <CustomInput
        theme={theme}
        label="Planos em caso de viagens ou mudanças *"
        placeholder="Descreva os seus planos..."
        value={form.planosViagem}
        onChange={(t: string) => setForm({ ...form, planosViagem: t })}
        multiline={true}
        autoCapitalize="sentences"
        errorMessage={errors.planosViagem}
      />

      <BooleanQuestion
        label="Concorda em enviar fotos e receber visitas de acompanhamento?"
        value={form.concordaAcompanhamento}
        onChange={(val) => setForm({ ...form, concordaAcompanhamento: val })}
        errorMessage={errors.concordaAcompanhamento}
      />

      <CustomInput
        theme={theme}
        label="Observações *"
        placeholder="Descreva o ambiente, rotina, experiência com pets, ou qualquer informação que ajude na avaliação."
        value={form.observacoes}
        onChange={(t: string) => setForm({ ...form, observacoes: t })}
        multiline={true}
        autoCapitalize="sentences"
      />
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
      {/* ── BOTÃO MOVIDO PARA AQUI (FORA DO SCROLLVIEW) ── */}
      <TouchableOpacity
        style={[
          styles.closeButton,
          {
            top: insets.top > 0 ? insets.top + 10 : 20,
            backgroundColor: theme.buttonBackground ?? theme.surface,
            borderColor: theme.primary + "40",
          },
        ]}
        onPress={onCancel}
        activeOpacity={0.7}
      >
        <Ionicons name="close" size={24} color={theme.primary} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: 70, paddingBottom: 100 }, // Ajustado para dar espaço ao botão fixo
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Adotar {pet.nome}
          </Text>

          <View style={styles.progressWrapper}>
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
          </View>

          <View style={styles.content}>{renderContent()}</View>

          <View style={styles.buttonsContainer}>
            {etapaAtual > 1 && (
              <TouchableOpacity
                style={[
                  styles.btn,
                  {
                    backgroundColor: theme.surface,
                    borderWidth: 1,
                    borderColor: theme.border,
                  },
                ]}
                onPress={handleAnterior}
                disabled={loading}
              >
                <Text style={[styles.btnText, { color: theme.text }]}>
                  Anterior
                </Text>
              </TouchableOpacity>
            )}

            {etapaAtual < 5 ? (
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: theme.primary }]}
                onPress={handleProxima}
                disabled={loading}
              >
                <Text style={[styles.btnText, { color: "#fff" }]}>Próxima</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.btn,
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
                  <Text style={[styles.btnText, { color: "#fff" }]}>
                    Enviar Formulário
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Componentes Internos ──────────────────────────────────────────────────────

interface CustomInputProps {
  theme: any;
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (text: string) => void;
  maxLength?: number;
  keyboard?:
    | "default"
    | "email-address"
    | "numeric"
    | "phone-pad"
    | "number-pad";
  errorMessage?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
}

function CustomInput({
  theme,
  label,
  placeholder,
  value,
  onChange,
  maxLength,
  keyboard,
  errorMessage,
  autoCapitalize = "none",
  multiline = false,
}: CustomInputProps) {
  return (
    <View style={styles.inputWrapper}>
      {label ? (
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.inputContainer,
          multiline
            ? { height: 100, alignItems: "flex-start", paddingTop: 15 }
            : {},
          {
            backgroundColor: theme.surface,
            borderColor: errorMessage ? "#FF4D4D" : theme.border,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            { color: theme.text },
            multiline ? { textAlignVertical: "top" } : {},
          ]}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          value={value}
          onChangeText={onChange}
          maxLength={maxLength}
          keyboardType={keyboard}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
        />
      </View>
      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}
    </View>
  );
}

interface BooleanQuestionProps {
  label: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
  errorMessage?: string;
}

function BooleanQuestion({
  label,
  value,
  onChange,
  errorMessage,
}: BooleanQuestionProps) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.inputWrapper}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View style={styles.selectContainer}>
        {["Sim", "Não"].map((opcao) => (
          <TouchableOpacity
            key={opcao}
            style={[
              styles.selectOption,
              {
                backgroundColor:
                  value === (opcao === "Sim") ? theme.primary : theme.surface,
                borderColor: errorMessage ? "#FF4D4D" : theme.border,
              },
            ]}
            onPress={() => onChange(opcao === "Sim")}
          >
            <Text
              style={[
                styles.selectOptionText,
                { color: value === (opcao === "Sim") ? "#fff" : theme.text },
              ]}
            >
              {opcao}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  closeButton: {
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
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  progressWrapper: { marginBottom: 20 },
  progressContainer: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  progressBar: { height: "100%", borderRadius: 4 },
  stepCounter: { fontSize: 13, textAlign: "right" },
  content: { width: "100%" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "500", marginBottom: 6, marginLeft: 2 },

  inputWrapper: { width: "100%", marginBottom: 16 },
  inputContainer: {
    width: "100%",
    height: 55,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  input: { flex: 1, fontSize: 16 },

  selectContainer: { flexDirection: "row", gap: 10 },
  selectOption: {
    flex: 1,
    height: 55,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  selectOptionText: { fontSize: 16, fontWeight: "500" },

  row: { flexDirection: "row", gap: 10, width: "100%" },
  divider: {
    height: 1,
    width: "100%",
    backgroundColor: "#eee",
    marginVertical: 15,
  },
  buttonsContainer: { flexDirection: "row", gap: 10, marginTop: 10 },

  btn: {
    flex: 1,
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: { fontSize: 16, fontWeight: "bold" },
  errorText: { color: "#FF4D4D", fontSize: 12, marginTop: 4, marginLeft: 5 },
});
