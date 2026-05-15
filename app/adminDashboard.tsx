import { useAppTheme } from '@/hooks/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../firebaseConfig';

/**
 * INTERFACES
 */
interface Produto {
  id: string;
  nome: string;
  preco: string;
  image: string;
  tag?: string;
}

interface Pet {
  id: string;
  petId: string;
  nome: string;
  tipo: string;
  raca: string;
  idade: number;
  nomeDono: string;
  celularDono: string;
  emailDono: string;
  cpfDono: string;
  cep: string;
  rua: string;
  bairro: string;
  numero: string;
  cidade: string;
}

type TabType = 'produtos' | 'pets';

/**
 * COMPONENTE PRINCIPAL
 */
export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { theme, colorScheme, toggleColorScheme } = useAppTheme();
  const router = useRouter();

  // Estados gerais
  const [activeTab, setActiveTab] = useState<TabType>('produtos');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Produtos
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [showProdutoModal, setShowProdutoModal] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [produtoForm, setProdutoForm] = useState({ nome: '', preco: '', image: '', tag: '' });

  // Pets
  const [pets, setPets] = useState<Pet[]>([]);
  const [showPetModal, setShowPetModal] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [petForm, setPetForm] = useState({ 
    petId: '', nome: '', tipo: 'cachorro', raca: '', idade: 0, 
    nomeDono: '', celularDono: '', emailDono: '', cpfDono: '',
    cep: '', rua: '', bairro: '', numero: '', cidade: ''
  });

  // Carregar dados ao montar e trocar de aba
  useEffect(() => {
    carregarDados();
  }, [activeTab]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      if (activeTab === 'produtos') {
        const querySnapshot = await getDocs(collection(db, 'produtos'));
        const data: Produto[] = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as Produto);
        });
        setProdutos(data);
      } else if (activeTab === 'pets') {
        const querySnapshot = await getDocs(collection(db, 'pets'));
        const data: Pet[] = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as Pet);
        });
        setPets(data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    } finally {
      setLoading(false);
    }
  };

  // Filtragem
  const filteredPets = pets.filter(pet => 
    (pet.nome?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (pet.petId?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (pet.cpfDono?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const filteredProdutos = produtos.filter(prod => 
    (prod.nome?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  // ============ FUNÇÕES DE PRODUTOS ============
  const handleSaveProduto = async () => {
    if (!produtoForm.nome || !produtoForm.preco || !produtoForm.image) {
      Alert.alert('Erro', 'Preencha nome, preço e o link da imagem');
      return;
    }

    try {
      if (editingProduto) {
        await updateDoc(doc(db, 'produtos', editingProduto.id), produtoForm);
        Alert.alert('Sucesso', 'Produto atualizado!');
      } else {
        await addDoc(collection(db, 'produtos'), produtoForm);
        Alert.alert('Sucesso', 'Produto adicionado!');
      }
      setShowProdutoModal(false);
      setProdutoForm({ nome: '', preco: '', image: '', tag: '' });
      setEditingProduto(null);
      carregarDados();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao salvar produto');
    }
  };

  const handleEditProduto = (produto: Produto) => {
    setEditingProduto(produto);
    setProdutoForm({ 
      nome: produto.nome, 
      preco: produto.preco, 
      image: produto.image || '', 
      tag: produto.tag || '' 
    });
    setShowProdutoModal(true);
  };

  const handleDeleteProduto = (id: string) => {
    if (!id) return;

    Alert.alert('Confirmar', 'Deseja excluir este produto permanentemente?', [
      { text: 'Cancelar' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'produtos', id));
            Alert.alert('Sucesso', 'Produto removido do banco!');
            carregarDados();
          } catch (error) {
            Alert.alert('Erro', 'Falha ao excluir produto');
          }
        },
      },
    ]);
  };

  // ============ FUNÇÕES DE PETS ============
  const handleSavePet = async () => {
    if (!petForm.nome || !petForm.nomeDono) {
      Alert.alert('Erro', 'Preencha o nome do pet e o nome do dono');
      return;
    }

    try {
      const finalPetForm = { ...petForm };
      if (!editingPet) {
        const autoId = 'PET-' + Math.random().toString(36).substr(2, 5).toUpperCase();
        finalPetForm.petId = autoId;
      }

      if (editingPet) {
        await updateDoc(doc(db, 'pets', editingPet.id), finalPetForm);
        Alert.alert('Sucesso', 'Pet atualizado!');
      } else {
        await addDoc(collection(db, 'pets'), finalPetForm);
        Alert.alert('Sucesso', 'Pet adicionado!');
      }
      setShowPetModal(false);
      setPetForm({ 
        petId: '', nome: '', tipo: 'cachorro', raca: '', idade: 0, 
        nomeDono: '', celularDono: '', emailDono: '', cpfDono: '',
        cep: '', rua: '', bairro: '', numero: '', cidade: ''
      });
      setEditingPet(null);
      carregarDados();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao salvar pet');
    }
  };

  const handleEditPet = (pet: Pet) => {
    setEditingPet(pet);
    setPetForm(pet);
    setShowPetModal(true);
  };

  const handleDeletePet = (id: string) => {
    if (!id) return;

    Alert.alert('Confirmar', 'Deseja excluir este pet permanentemente?', [
      { text: 'Cancelar' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'pets', id));
            Alert.alert('Sucesso', 'Pet removido com sucesso!');
            carregarDados();
          } catch (error) {
            Alert.alert('Erro', 'Falha ao excluir pet');
          }
        },
      },
    ]);
  };

  // ============ RENDER MODALS ============
  const renderProdutoModal = () => (
    <Modal visible={showProdutoModal} animationType="slide" transparent>
      <SafeAreaView style={[styles.modal, { backgroundColor: theme.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            {editingProduto ? 'Editar Produto' : 'Novo Produto'}
          </Text>
          <TouchableOpacity onPress={() => setShowProdutoModal(false)}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.modalForm}>
            <Text style={[styles.label, { color: theme.text }]}>Nome do Produto *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="Ex: Ração Premium 10kg"
              placeholderTextColor={theme.textSecondary}
              value={produtoForm.nome}
              onChangeText={(text) => setProdutoForm({ ...produtoForm, nome: text })}
            />

            <Text style={[styles.label, { color: theme.text }]}>Preço *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="R$ 0,00"
              placeholderTextColor={theme.textSecondary}
              value={produtoForm.preco}
              onChangeText={(text) => setProdutoForm({ ...produtoForm, preco: text })}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.label, { color: theme.text }]}>Link da Imagem (URL) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="https://exemplo.com/imagem.jpg"
              placeholderTextColor={theme.textSecondary}
              value={produtoForm.image}
              onChangeText={(text) => setProdutoForm({ ...produtoForm, image: text })}
            />

            <Text style={[styles.label, { color: theme.text }]}>Tag (Opcional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="Ex: Promoção, Novo"
              placeholderTextColor={theme.textSecondary}
              value={produtoForm.tag}
              onChangeText={(text) => setProdutoForm({ ...produtoForm, tag: text })}
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.primary }]}
              onPress={handleSaveProduto}
            >
              <Text style={styles.submitButtonText}>
                {editingProduto ? 'Atualizar' : 'Salvar'} Produto
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderPetModal = () => (
    <Modal visible={showPetModal} animationType="slide" transparent>
      <SafeAreaView style={[styles.modal, { backgroundColor: theme.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            {editingPet ? 'Editar Pet' : 'Novo Pet'}
          </Text>
          <TouchableOpacity onPress={() => setShowPetModal(false)}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.modalForm}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>Dados do Pet</Text>
            
            <Text style={[styles.label, { color: theme.text }]}>Nome do Pet *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="Nome do pet"
              placeholderTextColor={theme.textSecondary}
              value={petForm.nome}
              onChangeText={(text) => setPetForm({ ...petForm, nome: text })}
            />

            <Text style={[styles.label, { color: theme.text }]}>Tipo *</Text>
            <View style={styles.typeSelector}>
              {['cachorro', 'gato', 'ave', 'peixe'].map((tipo) => (
                <TouchableOpacity
                  key={tipo}
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor: petForm.tipo === tipo ? theme.primary : theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => setPetForm({ ...petForm, tipo })}
                >
                  <Text style={[styles.typeButtonText, { color: petForm.tipo === tipo ? '#000' : theme.text }]}>
                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: theme.text }]}>Raça *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="Raça do pet"
              placeholderTextColor={theme.textSecondary}
              value={petForm.raca}
              onChangeText={(text) => setPetForm({ ...petForm, raca: text })}
            />

            <Text style={[styles.label, { color: theme.text }]}>Idade</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              value={petForm.idade?.toString()}
              onChangeText={(text) => setPetForm({ ...petForm, idade: parseInt(text) || 0 })}
              keyboardType="numeric"
            />

            <View style={{ height: 20 }} />
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>Dados do Dono</Text>

            <Text style={[styles.label, { color: theme.text }]}>Nome do Dono *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="Nome completo do dono"
              placeholderTextColor={theme.textSecondary}
              value={petForm.nomeDono}
              onChangeText={(text) => setPetForm({ ...petForm, nomeDono: text })}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.text }]}>Celular</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                  placeholder="(00) 00000-0000"
                  placeholderTextColor={theme.textSecondary}
                  value={petForm.celularDono}
                  onChangeText={(text) => setPetForm({ ...petForm, celularDono: text })}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.label, { color: theme.text }]}>CPF</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                  placeholder="000.000.000-00"
                  placeholderTextColor={theme.textSecondary}
                  value={petForm.cpfDono}
                  onChangeText={(text) => setPetForm({ ...petForm, cpfDono: text })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={[styles.label, { color: theme.text }]}>E-mail</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="email@exemplo.com"
              placeholderTextColor={theme.textSecondary}
              value={petForm.emailDono}
              onChangeText={(text) => setPetForm({ ...petForm, emailDono: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={{ height: 10 }} />
            <Text style={[styles.sectionTitle, { color: theme.primary, fontSize: 14 }]}>Endereço do Dono</Text>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.text }]}>CEP</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                  placeholder="00000-000"
                  placeholderTextColor={theme.textSecondary}
                  value={petForm.cep}
                  onChangeText={(text) => setPetForm({ ...petForm, cep: text })}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.label, { color: theme.text }]}>Número</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                  placeholder="123"
                  placeholderTextColor={theme.textSecondary}
                  value={petForm.numero}
                  onChangeText={(text) => setPetForm({ ...petForm, numero: text })}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: theme.text }]}>Rua</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="Nome da rua"
              placeholderTextColor={theme.textSecondary}
              value={petForm.rua}
              onChangeText={(text) => setPetForm({ ...petForm, rua: text })}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.text }]}>Bairro</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                  placeholder="Bairro"
                  placeholderTextColor={theme.textSecondary}
                  value={petForm.bairro}
                  onChangeText={(text) => setPetForm({ ...petForm, bairro: text })}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.label, { color: theme.text }]}>Cidade</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                  placeholder="Cidade"
                  placeholderTextColor={theme.textSecondary}
                  value={petForm.cidade}
                  onChangeText={(text) => setPetForm({ ...petForm, cidade: text })}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.primary }]}
              onPress={handleSavePet}
            >
              <Text style={styles.submitButtonText}>
                {editingPet ? 'Atualizar' : 'Salvar'} Pet
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      );
    }

    if (activeTab === 'produtos') {
      return (
        <View style={styles.contentContainer}>
          <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="search" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Pesquisar produto..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              setEditingProduto(null);
              setProdutoForm({ nome: '', preco: '', image: '', tag: '' });
              setShowProdutoModal(true);
            }}
          >
            <Ionicons name="add" size={24} color="#000" />
            <Text style={styles.addButtonText}>Novo Produto</Text>
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            {filteredProdutos.map((produto) => (
              <View key={produto.id} style={[styles.itemCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: theme.text }]}>{produto.nome}</Text>
                  <Text style={[styles.itemDetail, { color: theme.textSecondary }]}>R$ {produto.preco}</Text>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.primary }]}
                    onPress={() => handleEditProduto(produto)}
                  >
                    <Ionicons name="pencil" size={18} color="#000" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.error }]}
                    onPress={() => handleDeleteProduto(produto.id)}
                  >
                    <Ionicons name="trash" size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      );
    }

    if (activeTab === 'pets') {
      return (
        <View style={styles.contentContainer}>
          <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="search" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Pesquisar por nome, ID ou CPF..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              setEditingPet(null);
              setPetForm({ 
                petId: '', nome: '', tipo: 'cachorro', raca: '', idade: 0, 
                nomeDono: '', celularDono: '', emailDono: '', cpfDono: '',
                cep: '', rua: '', bairro: '', numero: '', cidade: ''
              });
              setShowPetModal(true);
            }}
          >
            <Ionicons name="add" size={24} color="#000" />
            <Text style={styles.addButtonText}>Novo Pet</Text>
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            {filteredPets.map((pet) => (
              <View key={pet.id} style={[styles.itemCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.itemInfo}>
                  <View style={styles.idBadge}>
                    <Text style={styles.idBadgeText}>{pet.petId || 'S/ ID'}</Text>
                  </View>
                  <Text style={[styles.itemName, { color: theme.text }]}>{pet.nome} ({pet.tipo})</Text>
                  <Text style={[styles.itemDetail, { color: theme.textSecondary }]}>Dono: {pet.nomeDono}</Text>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.primary }]}
                    onPress={() => handleEditPet(pet)}
                  >
                    <Ionicons name="pencil" size={18} color="#000" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.error }]}
                    onPress={() => handleDeletePet(pet.id)}
                  >
                    <Ionicons name="trash" size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      <TouchableOpacity
        style={[
          styles.backButton,
          {
            top: insets.top + 10,
            backgroundColor: theme.surface,
            borderColor: theme.primary + '40',
          },
        ]}
        onPress={() => {
          // CORREÇÃO: Força a volta para a página inicial
          router.replace('/');
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
            right: 20,
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
        onPress={toggleColorScheme}
        activeOpacity={0.7}
      >
        <Ionicons name={colorScheme === 'dark' ? 'sunny' : 'moon'} size={22} color={theme.primary} />
      </TouchableOpacity>

      <View style={[styles.header, { paddingTop: insets.top + 60 }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Painel Admin</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Golden Paw</Text>
        </View>
      </View>

      <View style={[styles.tabsContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        {(['produtos', 'pets'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              {
                borderBottomColor: activeTab === tab ? theme.primary : 'transparent',
                borderBottomWidth: activeTab === tab ? 3 : 0,
              },
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === tab ? theme.primary : theme.textSecondary,
                  fontWeight: activeTab === tab ? '700' : '500',
                },
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderContent()}

      {renderProdutoModal()}
      {renderPetModal()}
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
  header: { paddingHorizontal: 20, paddingBottom: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  headerSubtitle: { fontSize: 12, fontWeight: '500' },
  tabsContainer: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 20 },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  tabText: { fontSize: 14 },
  contentContainer: { flex: 1, paddingHorizontal: 20, paddingVertical: 15 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 15,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14 },
  addButton: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    gap: 8,
  },
  addButtonText: { color: '#000', fontWeight: '700', fontSize: 14 },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  itemInfo: { flex: 1 },
  idBadge: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  idBadgeText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  itemName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  itemDetail: { fontSize: 12, marginBottom: 2 },
  itemActions: { flexDirection: 'row', gap: 8 },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalContent: { flex: 1 },
  modalForm: { paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 15, marginTop: 5 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  themeToggleButton: {
    position: 'absolute',
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
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    fontSize: 14,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  typeSelector: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  typeButton: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeButtonText: { fontWeight: '600', fontSize: 12 },
  submitButton: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  submitButtonText: { color: '#000', fontWeight: '700', fontSize: 16 },
  emptyText: { textAlign: 'center', marginTop: 20, fontSize: 14 },
});
