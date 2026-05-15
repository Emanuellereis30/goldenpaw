import { CategoryProduct, CategoryScreen } from '@/components/category-screen';

const PRODUCTS: CategoryProduct[] = [
  { id: '2', nome: 'Ração Premium Gatos', preco: 'R$ 159,90', image: require('../assets/img/racaogato.png') },
  { id: '7', nome: 'Aranhador para Gatos', preco: 'R$ 40,00', image: require('../assets/img/arranhador.png') },
  { id: '9', nome: 'Petisco para Gatos', preco: 'R$ 15,00', image: require('../assets/img/petisco.png') },
  { id: '12', nome: 'Caixa de Transporte (Gato)', preco: 'R$ 50,00', image: require('../assets/img/caixadetransportegato.png') },
  { id: '13', nome: 'Caixa de Areia', preco: 'R$ 26,90', image: require('../assets/img/caixadeareia.png') },
];

export default function GatosScreen() {
  return (
    <CategoryScreen
      title="Gatos"
      description="Produtos selecionados para gatos: ração, mobiliário para arranhar, higiene e prazer."
      products={PRODUCTS}
      iconName="logo-octocat"
    />
  );
}
