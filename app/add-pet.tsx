import { Feather } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
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
import { auth, db } from "../firebaseConfig";
import { useAppTheme } from "../hooks/use-app-theme";

export default function AddPetScreen() {
  const { theme } = useAppTheme();
  const [saving, setSaving] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Estados dos Campos
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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
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
    console.log("Firebase response:", JSON.stringify(data));
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${storagePath}?alt=media&token=${data.downloadTokens}`;
  };

  // ── FUNÇÕES DE DATA E IDADE ───────────────────────────────────────────────

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

  // ── SALVAR E VALIDAR ──────────────────────────────────────────────────────

  const handleSave = async () => {
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
      if (!user) throw new Error("Utilizador não autenticado");

      const finalPetData = {
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
        criadoEm: new Date().toISOString(),
      };

      const petsRef = collection(db, "usuarios", user.uid, "pets");
      const docRef = await addDoc(petsRef, finalPetData);

      if (imageUri) {
        const fotoUrl = await uploadImageAsync(imageUri, docRef.id);
        const petDocRef = doc(db, "usuarios", user.uid, "pets", docRef.id);
        await updateDoc(petDocRef, { fotoUrl });
      }

      Alert.alert("Sucesso", "Pet registado com sucesso!");
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível guardar o pet.");
    } finally {
      setSaving(false);
    }
  };

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
            style={[
              styles.optionPill,
              { borderColor: selected === opt ? theme.primary : theme.border },
              selected === opt && { backgroundColor: theme.primary },
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

  return (
    <ScrollView
      style={[{ flex: 1, backgroundColor: theme.background }]}
      contentContainerStyle={{ padding: 20 }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          color: theme.text,
          marginBottom: 20,
        }}
      >
        Registar Pet
      </Text>

      <TouchableOpacity
        onPress={pickImage}
        style={[styles.imageContainer, { borderColor: theme.border }]}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={{ alignItems: "center" }}>
            <Feather name="camera" size={32} color={theme.primary} />
            <Text style={{ color: theme.textSecondary, marginTop: 8 }}>
              Adicionar Foto
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
            styles.input,
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
              styles.input,
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
          />
        </View>
      )}

      <View style={{ marginBottom: 15 }}>
        <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
          Raça *
        </Text>
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
          placeholder="Ex: Poodle, SRD"
          placeholderTextColor={theme.textSecondary}
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
              styles.input,
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
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
            Idade Estimada
          </Text>
          <TextInput
            style={[
              styles.input,
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
              styles.input,
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
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
            Cor *
          </Text>
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
            placeholder="Ex: Preto"
            placeholderTextColor={theme.textSecondary}
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
          placeholder="Quais alergias?"
          placeholderTextColor={theme.textSecondary}
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
          placeholder="Quais doenças?"
          placeholderTextColor={theme.textSecondary}
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
          placeholder="Quais medicamentos?"
          placeholderTextColor={theme.textSecondary}
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
          placeholder="Quais vacinas aplicadas?"
          placeholderTextColor={theme.textSecondary}
        />
      )}

      <View style={{ marginBottom: 15 }}>
        <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
          Observações (Opcional)
        </Text>
        <TextInput
          style={[
            styles.input,
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
        />
      </View>

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
          <Text style={styles.saveBtnText}>Registar Pet</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  saveBtn: {
    height: 54,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
  },
  saveBtnText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
});
