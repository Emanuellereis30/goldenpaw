import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../firebaseConfig';

interface Produto {
  id: string;
  nome: string;
  preco: string;
  image: string; // path to image
  tag?: string;
}

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const isDarkMode = useColorScheme() === 'dark';
  const router = useRouter();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [image, setImage] = useState('');
  const [tag, setTag] = useState('');

  const theme = {
    background: isDarkMode ? '#121212' : '#F8F6F2',
    surface: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    primary: '#D4AF37',
    text: isDarkMode ? '#F5F5F5' : '#1A1A1A',
    textSecondary: isDarkMode ? '#A1A1AA' : '#6B7280',
    border: isDarkMode ? '#2A2A2A' : '#E5E7EB',
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'produtos'));
      const produtosData: Produto[] = [];
      querySnapshot.forEach((doc) => {
        produtosData.push({ id: doc.id, ...doc.data() } as Produto);
      });
      setProdutos(produtosData);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os produtos.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduto = async () => {
    if (!nome || !preco || !image) {
      Alert.alert('Erro', 'Preencha nome, preço e imagem.');
      return;
    }
    try {
      await addDoc(collection(db, 'produtos'), {
        nome,
        preco,
        image,
        tag: tag || '',
      });
      Alert.alert('Sucesso', 'Produto adicionado!');
      setNome('');
      setPreco('');
      setImage('');
      setTag('');
      fetchProdutos();
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o produto.');
    }
  };

  const handleEditProduto = (produto: Produto) => {
    setEditingProduto(produto);
    setNome(produto.nome);
    setPreco(produto.preco);
    setImage(produto.image);
    setTag(produto.tag || '');
  };

  const handleUpdateProduto = async () => {
    if (!editingProduto || !nome || !preco || !image) return;
    try {
      await updateDoc(doc(db, 'produtos', editingProduto.id), {
        nome,
        preco,
        image,
        tag,
      });
      Alert.alert('Sucesso', 'Produto atualizado!');
      setEditingProduto(null);
      setNome('');
      setPreco('');
      setImage('');
      setTag('');
      fetchProdutos();
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o produto.');
    }
  };

  const handleDeleteProduto = async (id: string) => {
    Alert.alert('Confirmar', 'Deseja excluir este produto?', [
      { text: 'Cancelar' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'produtos', id));
            Alert.alert('Sucesso', 'Produto excluído!');
            fetchProdutos();
          } catch (error) {
            console.error('Erro ao excluir produto:', error);
            Alert.alert('Erro', 'Não foi possível excluir o produto.');
          }
        },
      },
    ]);
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Carregando...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <TouchableOpacity
        style={[
          styles.backButton,
          {
            top: insets.top + 10,
            backgroundColor: theme.surface,
            borderColor: theme.primary + '40',
          },
        ]}
        onPress={handleBack}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={24} color={theme.primary} />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 80 }]}>
        <Text style={[styles.title, { color: theme.text }]}>Painel Administrativo</Text>

        <View style={[styles.form, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.subtitle, { color: theme.text }]}>
            {editingProduto ? 'Editar Produto' : 'Adicionar Produto'}
          </Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            placeholder="Nome do produto"
            placeholderTextColor={theme.textSecondary}
            value={nome}
            onChangeText={setNome}
          />
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            placeholder="Preço"
            placeholderTextColor={theme.textSecondary}
            value={preco}
            onChangeText={setPreco}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            placeholder="Caminho da imagem (ex: ../../assets/img/racao.png)"
            placeholderTextColor={theme.textSecondary}
            value={image}
            onChangeText={setImage}
          />
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            placeholder="Tag (opcional)"
            placeholderTextColor={theme.textSecondary}
            value={tag}
            onChangeText={setTag}
          />
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={editingProduto ? handleUpdateProduto : handleAddProduto}
          >
            <Text style={styles.buttonText}>
              {editingProduto ? 'Atualizar' : 'Adicionar'}
            </Text>
          </TouchableOpacity>
          {editingProduto && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#dc3545' }]}
              onPress={() => {
                setEditingProduto(null);
                setNome('');
                setPreco('');
                setImage('');
                setTag('');
              }}
            >
              <Text style={styles.buttonText}>Cancelar Edição</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.subtitle, { color: theme.text }]}>Produtos</Text>
        {produtos.map((produto) => (
          <View key={produto.id} style={[styles.produtoItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.produtoNome, { color: theme.text }]}>{produto.nome}</Text>
            <Text style={[styles.produtoPreco, { color: theme.text }]}>R$ {produto.preco}</Text>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => handleEditProduto(produto)}>
                <Ionicons name="pencil" size={24} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteProduto(produto.id)}>
                <Ionicons name="trash" size={24} color="#dc3545" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  form: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 15,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  produtoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  produtoNome: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  produtoPreco: { fontSize: 16, marginRight: 10 },
  actions: { flexDirection: 'row', gap: 10 },
});