import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import React, { useCallback, useState } from "react";
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

export default function ProfileScreen() {
  const { theme } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  // Novo estado para a lista de pets
  const [pets, setPets] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    cpf: "",
    email: "",
    endereco: {
      rua: "",
      numero: "",
      bairro: "",
      cep: "",
      cidade: "",
      uf: "",
    },
  });

  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        const user = auth.currentUser;
        if (user) {
          try {
            const docRef = doc(db, "usuarios", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
              const docData = docSnap.data();
              const actualData = docData.userData || docData;

              setFormData({
                nome: actualData.nome || "",
                telefone: actualData.telefone || "",
                cpf: actualData.cpf || "",
                email: actualData.email || "",
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
            const petsList = petsSnap.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setPets(petsList);
          } catch (e) {
            console.error(e);
            Alert.alert("Erro", "Falha ao carregar perfil.");
          }
        }
        setLoading(false);
      };
      fetchUserData();
    }, []),
  );

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "usuarios", user.uid);
        await updateDoc(docRef, { userData: formData });
        Alert.alert("Sucesso", "Perfil atualizado!");
        setEditing(false);
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao guardar.");
    } finally {
      setSaving(false);
    }
  };

  const setEndereco = (field: string, value: string) =>
    setFormData((prev) => ({
      ...prev,
      endereco: { ...prev.endereco, [field]: value },
    }));

  if (loading)
    return (
      <ActivityIndicator size="large" style={{ flex: 1, marginTop: 50 }} />
    );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header do Perfil */}
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

      {/* Dados Pessoais */}
      <Text style={[styles.sectionTitle, { color: theme.primary }]}>
        Dados Pessoais
      </Text>

      <Field
        label="Nome Completo"
        value={formData.nome}
        editable={editing}
        onChangeText={(t) => setFormData({ ...formData, nome: t })}
        theme={theme}
      />

      <Field
        label="CPF"
        icon="credit-card"
        value={formData.cpf}
        editable={editing}
        onChangeText={(t) => setFormData({ ...formData, cpf: t })}
        keyboardType="numeric"
        theme={theme}
      />

      <Field
        label="Telemóvel"
        icon="phone"
        value={formData.telefone}
        editable={editing}
        onChangeText={(t) => setFormData({ ...formData, telefone: t })}
        keyboardType="phone-pad"
        theme={theme}
      />

      <Field
        label="E-mail"
        icon="mail"
        value={formData.email}
        editable={editing}
        onChangeText={(t) => setFormData({ ...formData, email: t })}
        keyboardType="email-address"
        theme={theme}
      />

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      {/* Endereço */}
      <Text style={[styles.sectionTitle, { color: theme.primary }]}>
        Endereço
      </Text>

      <Field
        label="Código Postal"
        icon="map-pin"
        value={formData.endereco.cep}
        editable={editing}
        onChangeText={(t) => setEndereco("cep", t)}
        keyboardType="numeric"
        theme={theme}
      />

      <Field
        label="Rua"
        value={formData.endereco.rua}
        editable={editing}
        onChangeText={(t) => setEndereco("rua", t)}
        theme={theme}
      />

      {/* Número + Bairro na mesma linha */}
      <View style={styles.row}>
        <View style={styles.rowSmall}>
          <Field
            label="Nº"
            value={formData.endereco.numero}
            editable={editing}
            onChangeText={(t) => setEndereco("numero", t)}
            keyboardType="numeric"
            theme={theme}
          />
        </View>
        <View style={styles.rowLarge}>
          <Field
            label="Bairro"
            value={formData.endereco.bairro}
            editable={editing}
            onChangeText={(t) => setEndereco("bairro", t)}
            theme={theme}
          />
        </View>
      </View>

      {/* Cidade + UF na mesma linha */}
      <View style={styles.row}>
        <View style={styles.rowLarge}>
          <Field
            label="Cidade"
            value={formData.endereco.cidade}
            editable={editing}
            onChangeText={(t) => setEndereco("cidade", t)}
            theme={theme}
          />
        </View>
        <View style={styles.rowSmall}>
          <Field
            label="UF"
            value={formData.endereco.uf}
            editable={editing}
            onChangeText={(t) => setEndereco("uf", t)}
            theme={theme}
          />
        </View>
      </View>

      {/* Botões de edição de perfil */}
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

      {/* ────────────────────────────────────────────────────────── */}
      {/* NOVA SECÇÃO: MEUS PETS                                     */}
      {/* ────────────────────────────────────────────────────────── */}

      <View
        style={[
          styles.divider,
          { backgroundColor: theme.border, marginTop: 24 },
        ]}
      />

      <View style={styles.header}>
        <View>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.primary, marginBottom: 4 },
            ]}
          >
            Meus Pets
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Gira as informações dos seus animais
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.editBtn, { backgroundColor: theme.primary }]}
          onPress={() => router.push("/add-pet")}
        >
          <Feather name="plus" size={14} color="#FFF" />
          <Text style={styles.editBtnText}>Adicionar Pet</Text>
        </TouchableOpacity>
      </View>

      {pets.length === 0 ? (
        <Text style={{ color: theme.textSecondary, marginTop: 10 }}>
          Nenhum pet registado.
        </Text>
      ) : (
        pets.map((pet) => {
          console.log("Pet:", pet.nome, "fotoUrl:", pet.fotoUrl);
          return (
            <TouchableOpacity
              key={pet.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 12,
                backgroundColor: theme.surface,
                borderRadius: 10,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: theme.border,
              }}
              onPress={() => router.push(`/pet/${pet.id}` as any)}
            >
              {pet.fotoUrl ? (
                <Image
                  source={{ uri: pet.fotoUrl }}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    marginRight: 12,
                  }}
                  onError={(e) =>
                    console.log("Erro imagem:", e.nativeEvent.error)
                  }
                />
              ) : (
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: theme.border,
                    marginRight: 12,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Feather
                    name="github"
                    size={24}
                    color={theme.textSecondary}
                  />
                </View>
              )}
              <View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: theme.text,
                  }}
                >
                  {pet.nome}
                </Text>
                <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                  {pet.especie} • {pet.raca}
                </Text>
              </View>
              <Feather
                name="chevron-right"
                size={20}
                color={theme.textSecondary}
                style={{ marginLeft: "auto" }}
              />
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

// ── Field component ──────────────────────────────────────────────────────────

type FieldProps = {
  label: string;
  value: string;
  editable: boolean;
  onChangeText: (t: string) => void;
  icon?: string;
  keyboardType?: any;
  theme: any;
};

function Field({
  label,
  value,
  editable,
  onChangeText,
  icon,
  keyboardType,
  theme,
}: FieldProps) {
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
          placeholderTextColor={theme.textSecondary}
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

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

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

  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
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
