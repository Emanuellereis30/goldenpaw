import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
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
import { auth, db } from "../firebaseConfig";
import { useAppTheme } from "../hooks/use-app-theme";

export default function ProfileScreen() {
  const { theme } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = doc(db, "usuarios", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const docData = docSnap.data();

            // ATENÇÃO AQUI: Na sua imagem, os dados estão dentro de 'userData'
            // Se docData.userData existir, usamos ele. Se não, tentamos a raiz.
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
        } catch (e) {
          console.error(e);
          Alert.alert("Erro", "Falha ao carregar perfil.");
        }
      }
      setLoading(false);
    };
    fetchUserData();
  }, []);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "usuarios", user.uid);

        // Atualizamos mantendo a estrutura 'userData' para não quebrar o banco
        await updateDoc(docRef, {
          userData: formData,
        });

        Alert.alert("Sucesso", "Perfil atualizado!");
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao guardar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <ActivityIndicator size="large" style={{ flex: 1, marginTop: 50 }} />
    );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <Text style={[styles.title, { color: theme.text }]}>Meu Perfil</Text>

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          Nome Completo
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
          value={formData.nome}
          onChangeText={(text) => setFormData({ ...formData, nome: text })}
        />

        <Text style={[styles.label, { color: theme.textSecondary }]}>
          Telefone
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
          value={formData.telefone}
          onChangeText={(text) => setFormData({ ...formData, telefone: text })}
        />
      </View>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: theme.primary }]}
        onPress={handleUpdate}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.btnText}>Salvar Alterações</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  section: { marginBottom: 20 },
  label: { fontSize: 14, marginBottom: 5 },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  btn: {
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
});
