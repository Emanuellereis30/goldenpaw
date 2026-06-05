import { Feather } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../firebaseConfig";
import { useAppTheme } from "../../hooks/use-app-theme";

export default function PetProfileScreen() {
  const { id } = useLocalSearchParams();
  const { theme } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  // Estados para Imagem
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);

  // Estados dos Campos do Pet
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

  // Estados Condicionais (Sim/Não)
  const [hasAlergias, setHasAlergias] = useState("");
  const [alergias, setAlergias] = useState("");

  const [hasDoencas, setHasDoencas] = useState("");
  const [doencas, setDoencas] = useState("");

  const [hasMedicamentos, setHasMedicamentos] = useState("");
  const [medicamentos, setMedicamentos] = useState("");

  const [hasVacinas, setHasVacinas] = useState("");
  const [vacinas, setVacinas] = useState("");

  const [observacoes, setObservacoes] = useState("");

  // ── BUSCAR DADOS DO FIRESTORE ─────────────────────────────────────────────
  useEffect(() => {
    const fetchPet = async () => {
      const user = auth.currentUser;
      if (user && id) {
        try {
          const docRef = doc(db, "usuarios", user.uid, "pets", id as string);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();

            setNome(data.nome || "");
            setRaca(data.raca || "");
            setSexo(data.sexo || "");
            setDataNascimento(data.dataNascimento || "");
            setIdade(data.idade || "");
            setPeso(data.peso || "");
            setCor(data.cor || "");
            setCastrado(data.castrado || "");
            setObservacoes(data.observacoes || "");
            setImageUri(data.fotoUrl || null);

            // Reconstrói a lógica da Espécie
            if (["Canino", "Felino"].includes(data.especie)) {
              setEspecie(data.especie);
            } else if (data.especie) {
              setEspecie("Outro");
              setEspecieOutro(data.especie);
            }

            // Reconstrói as abas médicas condicionais
            setAlergias(data.alergias || "");
            setHasAlergias(
              data.alergias && data.alergias !== "Nenhuma" ? "Sim" : "Não",
            );

            setDoencas(data.doencas || "");
            setHasDoencas(
              data.doencas && data.doencas !== "Nenhuma" ? "Sim" : "Não",
            );

            setMedicamentos(data.medicamentos || "");
            setHasMedicamentos(
              data.medicamentos && data.medicamentos !== "Nenhum"
                ? "Sim"
                : "Não",
            );

            setVacinas(data.vacinas || "");
            setHasVacinas(
              data.vacinas && data.vacinas !== "Não informado" ? "Sim" : "Não",
            );
          }
        } catch (error) {
          Alert.alert("Erro", "Falha ao carregar dados do pet.");
        }
      }
      setLoading(false);
    };
    fetchPet();
  }, [id]);

  // ── SELECIONAR FOTO ───────────────────────────────────────────────────────
  const pickImage = async () => {
    if (!editing) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setNewImageUri(result.assets[0].uri);
    }
  };

  // ── UPLOAD COM EXPO FILE SYSTEM ───────────────────────────────────────────
  const uploadImageAsync = async (uri: string, petId: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Utilizador não autenticado");

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: "base64",
    });

    const storagePath = `pets%2F${user.uid}%2F${petId}.jpg`;
    const bucket = "petshop-2c06a.firebasestorage.app";
    const token = await user.getIdToken();

    // Converte base64 para binário antes de enviar
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

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

  // ── MÁSCARA DE DATA E IDADE AUTOMÁTICA ────────────────────────────────────
  const handleDateChange = (text: string) => {
    let v = text.replace(/\D/g, "").slice(0, 8);
    if (v.length >= 5) {
      v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
    } else if (v.length >= 3) {
      v = `${v.slice(0, 2)}/${v.slice(2)}`;
    }
    setDataNascimento(v);

    if (v.length === 10) {
      calcularIdade(v);
    } else {
      setIdade("");
    }
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
    if (
      mesesDif < 0 ||
      (mesesDif === 0 && hoje.getDate() < dataNasc.getDate())
    ) {
      anos--;
    }
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

  // ── SALVAR ALTERAÇÕES ─────────────────────────────────────────────────────
  const handleUpdate = async () => {
    const missingFields = [];
    if (!nome) missingFields.push("Nome");
    if (!especie) missingFields.push("Espécie");
    if (especie === "Outro" && !especieOutro)
      missingFields.push("Qual a espécie?");
    if (!raca) missingFields.push("Raça");
    if (!sexo) missingFields.push("Sexo");
    if (dataNascimento.length !== 10)
      missingFields.push("Data de Nascimento válida");
    if (!peso) missingFields.push("Peso");
    if (!cor) missingFields.push("Cor");
    if (!castrado) missingFields.push("Castrado");

    if (!hasAlergias || (hasAlergias === "Sim" && !alergias))
      missingFields.push("Alergias");
    if (!hasDoencas || (hasDoencas === "Sim" && !doencas))
      missingFields.push("Doenças");
    if (!hasMedicamentos || (hasMedicamentos === "Sim" && !medicamentos))
      missingFields.push("Medicamentos");
    if (!hasVacinas || (hasVacinas === "Sim" && !vacinas))
      missingFields.push("Vacinas");

    if (missingFields.length > 0) {
      Alert.alert(
        "Campos Obrigatórios",
        `Por favor, preencha corretamente os seguintes campos:\n\n${missingFields.join("\n")}`,
      );
      return;
    }

    setSaving(true);
    try {
      const user = auth.currentUser;
      if (user && id) {
        let fotoUrl = imageUri; // Mantém a URL existente por padrão

        // Só faz upload se o utilizador escolheu uma nova foto
        if (newImageUri) {
          fotoUrl = await uploadImageAsync(newImageUri, id as string);
        }

        const updatedPetData = {
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
          fotoUrl,
          atualizadoEm: new Date().toISOString(),
        };

        const docRef = doc(db, "usuarios", user.uid, "pets", id as string);
        await updateDoc(docRef, updatedPetData);

        Alert.alert("Sucesso", "Perfil do pet atualizado com sucesso!");
        setEditing(false);
        setNewImageUri(null);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao atualizar dados no servidor.");
    } finally {
      setSaving(false);
    }
  };

  // Componente Seletor Visual para Edição
  const OptionSelector = ({ label, options, selected, onSelect }: any) => (
    <View style={{ marginBottom: 15 }}>
      <Text
        style={{
          color: theme.textSecondary,
          marginBottom: 8,
          fontWeight: "500",
        }}
      >
        {label} *
      </Text>
      <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
        {options.map((opt: string) => (
          <TouchableOpacity
            key={opt}
            disabled={!editing}
            style={[
              styles.optionPill,
              { borderColor: selected === opt ? theme.primary : theme.border },
              selected === opt && { backgroundColor: theme.primary },
              !editing && { opacity: 0.6 },
            ]}
            onPress={() => onSelect(opt)}
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

  if (loading)
    return (
      <ActivityIndicator size="large" style={{ flex: 1, marginTop: 50 }} />
    );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 20 }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 20,
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "bold", color: theme.text }}>
          Perfil do Pet
        </Text>
        {!editing && (
          <TouchableOpacity
            onPress={() => setEditing(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.primary,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 8,
            }}
          >
            <Feather
              name="edit-2"
              size={14}
              color="#FFF"
              style={{ marginRight: 5 }}
            />
            <Text style={{ color: "#FFF", fontWeight: "bold" }}>Editar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ÁREA DA FOTO */}
      <TouchableOpacity
        onPress={pickImage}
        style={[styles.imageContainer, { borderColor: theme.border }]}
        disabled={!editing}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={{ alignItems: "center" }}>
            <Feather name="camera" size={32} color={theme.primary} />
          </View>
        )}
        {editing && (
          <View style={styles.cameraOverlay}>
            <Feather name="camera" size={18} color="#FFF" />
          </View>
        )}
      </TouchableOpacity>

      {/* NOME */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
          Nome do Pet *
        </Text>
        {editing ? (
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={nome}
            onChangeText={setNome}
          />
        ) : (
          <Text
            style={[
              styles.viewText,
              { color: theme.text, borderBottomColor: theme.border },
            ]}
          >
            {nome || "—"}
          </Text>
        )}
      </View>

      {/* ESPÉCIE */}
      {editing ? (
        <>
          <OptionSelector
            label="Espécie"
            options={["Canino", "Felino", "Outro"]}
            selected={especie}
            onSelect={setEspecie}
          />
          {especie === "Outro" && (
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  color: theme.text,
                  borderColor: theme.border,
                  marginBottom: 15,
                  marginTop: -5,
                },
              ]}
              value={especieOutro}
              onChangeText={setEspecieOutro}
              placeholder="Qual espécie?"
              placeholderTextColor={theme.textSecondary}
            />
          )}
        </>
      ) : (
        <View style={{ marginBottom: 15 }}>
          <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
            Espécie
          </Text>
          <Text
            style={[
              styles.viewText,
              { color: theme.text, borderBottomColor: theme.border },
            ]}
          >
            {especie === "Outro" ? especieOutro : especie || "—"}
          </Text>
        </View>
      )}

      {/* RAÇA */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
          Raça *
        </Text>
        {editing ? (
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={raca}
            onChangeText={setRaca}
          />
        ) : (
          <Text
            style={[
              styles.viewText,
              { color: theme.text, borderBottomColor: theme.border },
            ]}
          >
            {raca || "—"}
          </Text>
        )}
      </View>

      {/* SEXO */}
      {editing ? (
        <OptionSelector
          label="Sexo"
          options={["Macho", "Fêmea"]}
          selected={sexo}
          onSelect={setSexo}
        />
      ) : (
        <View style={{ marginBottom: 15 }}>
          <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
            Sexo
          </Text>
          <Text
            style={[
              styles.viewText,
              { color: theme.text, borderBottomColor: theme.border },
            ]}
          >
            {sexo || "—"}
          </Text>
        </View>
      )}

      {/* NASCIMENTO & IDADE */}
      <View style={{ flexDirection: "row", gap: 15, marginBottom: 15 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
            Nascimento *
          </Text>
          {editing ? (
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={dataNascimento}
              onChangeText={handleDateChange}
              keyboardType="numeric"
              maxLength={10}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={theme.textSecondary}
            />
          ) : (
            <Text
              style={[
                styles.viewText,
                { color: theme.text, borderBottomColor: theme.border },
              ]}
            >
              {dataNascimento || "—"}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
            Idade Estimada
          </Text>
          <Text
            style={[
              styles.viewText,
              {
                color: theme.text,
                borderBottomColor: theme.border,
                opacity: 0.8,
              },
            ]}
          >
            {idade || "—"}
          </Text>
        </View>
      </View>

      {/* PESO & COR */}
      <View style={{ flexDirection: "row", gap: 15, marginBottom: 15 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
            Peso *
          </Text>
          {editing ? (
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={peso}
              onChangeText={setPeso}
            />
          ) : (
            <Text
              style={[
                styles.viewText,
                { color: theme.text, borderBottomColor: theme.border },
              ]}
            >
              {peso || "—"}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
            Cor *
          </Text>
          {editing ? (
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={cor}
              onChangeText={setCor}
            />
          ) : (
            <Text
              style={[
                styles.viewText,
                { color: theme.text, borderBottomColor: theme.border },
              ]}
            >
              {cor || "—"}
            </Text>
          )}
        </View>
      </View>

      {/* CASTRADO */}
      {editing ? (
        <OptionSelector
          label="Castrado?"
          options={["Sim", "Não"]}
          selected={castrado}
          onSelect={setCastrado}
        />
      ) : (
        <View style={{ marginBottom: 15 }}>
          <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
            Castrado?
          </Text>
          <Text
            style={[
              styles.viewText,
              { color: theme.text, borderBottomColor: theme.border },
            ]}
          >
            {castrado || "—"}
          </Text>
        </View>
      )}

      {/* SAÚDE E HISTÓRICO */}
      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold",
          color: theme.primary,
          marginTop: 15,
          marginBottom: 15,
        }}
      >
        Saúde & Histórico
      </Text>

      {/* ALERGIAS */}
      {editing ? (
        <>
          <OptionSelector
            label="Possui alergias?"
            options={["Sim", "Não"]}
            selected={hasAlergias}
            onSelect={setHasAlergias}
          />
          {hasAlergias === "Sim" && (
            <TextInput
              style={[
                styles.input,
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
            />
          )}
        </>
      ) : (
        <View style={{ marginBottom: 15 }}>
          <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
            Alergias
          </Text>
          <Text
            style={[
              styles.viewText,
              { color: theme.text, borderBottomColor: theme.border },
            ]}
          >
            {hasAlergias === "Sim" ? alergias : "Nenhuma"}
          </Text>
        </View>
      )}

      {/* DOENÇAS */}
      {editing ? (
        <>
          <OptionSelector
            label="Possui doenças pré-existentes?"
            options={["Sim", "Não"]}
            selected={hasDoencas}
            onSelect={setHasDoencas}
          />
          {hasDoencas === "Sim" && (
            <TextInput
              style={[
                styles.input,
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
            />
          )}
        </>
      ) : (
        <View style={{ marginBottom: 15 }}>
          <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
            Doenças Pré-existentes
          </Text>
          <Text
            style={[
              styles.viewText,
              { color: theme.text, borderBottomColor: theme.border },
            ]}
          >
            {hasDoencas === "Sim" ? doencas : "Nenhuma"}
          </Text>
        </View>
      )}

      {/* MEDICAMENTOS */}
      {editing ? (
        <>
          <OptionSelector
            label="Toma medicamentos contínuos?"
            options={["Sim", "Não"]}
            selected={hasMedicamentos}
            onSelect={setHasMedicamentos}
          />
          {hasMedicamentos === "Sim" && (
            <TextInput
              style={[
                styles.input,
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
            />
          )}
        </>
      ) : (
        <View style={{ marginBottom: 15 }}>
          <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
            Medicamentos Contínuos
          </Text>
          <Text
            style={[
              styles.viewText,
              { color: theme.text, borderBottomColor: theme.border },
            ]}
          >
            {hasMedicamentos === "Sim" ? medicamentos : "Nenhum"}
          </Text>
        </View>
      )}

      {/* VACINAS */}
      {editing ? (
        <>
          <OptionSelector
            label="Vacinas em dia?"
            options={["Sim", "Não"]}
            selected={hasVacinas}
            onSelect={setHasVacinas}
          />
          {hasVacinas === "Sim" && (
            <TextInput
              style={[
                styles.input,
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
            />
          )}
        </>
      ) : (
        <View style={{ marginBottom: 15 }}>
          <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
            Vacinas
          </Text>
          <Text
            style={[
              styles.viewText,
              { color: theme.text, borderBottomColor: theme.border },
            ]}
          >
            {hasVacinas === "Sim" ? vacinas : "Não informado"}
          </Text>
        </View>
      )}

      {/* OBSERVAÇÕES */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
          Observações
        </Text>
        {editing ? (
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border,
                minHeight: 70,
              },
            ]}
            value={observacoes}
            onChangeText={setObservacoes}
            multiline
          />
        ) : (
          <Text
            style={[
              styles.viewText,
              { color: theme.text, borderBottomColor: theme.border },
            ]}
          >
            {observacoes || "—"}
          </Text>
        )}
      </View>

      {/* BOTÕES DE AÇÃO NA EDIÇÃO */}
      {editing && (
        <View
          style={{
            flexDirection: "row",
            gap: 12,
            marginTop: 20,
            marginBottom: 40,
          }}
        >
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: theme.border }]}
            onPress={() => {
              setEditing(false);
              setNewImageUri(null);
            }}
            disabled={saving}
          >
            <Text style={{ color: theme.textSecondary, fontWeight: "bold" }}>
              Cancelar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: theme.primary }]}
            onPress={handleUpdate}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={{ color: "#FFF", fontWeight: "bold" }}>
                Salvar Alterações
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    height: 120,
    width: 120,
    borderRadius: 60,
    borderWidth: 1,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
    position: "relative",
  },
  image: { width: "100%", height: "100%" },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 15 },
  viewText: { fontSize: 16, paddingVertical: 8, borderBottomWidth: 1 },
  optionPill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtn: {
    flex: 2,
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});
