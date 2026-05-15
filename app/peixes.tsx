import { CategoryProduct, CategoryScreen } from '@/components/category-screen';

const PRODUCTS: CategoryProduct[] = [
  { id: '11', nome: 'Aquário para Peixes (50L)', preco: 'R$ 250,00', image: require('../assets/img/aquario.png') },
  { id: '19', nome: 'Ração para Peixes', preco: 'R$ 46,10', image: require('../assets/img/racaopeixe.png') },
  { id: '20', nome: 'Filtro de Água para Aquário', preco: 'R$ 96,90', image: require('../assets/img/filtroaquario.png') },
  { id: '21', nome: 'Bomba de Oxigênio para Aquário', preco: 'R$ 57,80', image: require('../assets/img/camadepet.png') },
  { id: '24', nome: 'Pedras Decorativas para Aquário', preco: 'R$ 2,90', image: require('../assets/img/aquario.png') },
];

export default function PeixesScreen() {
  return (
    <CategoryScreen
      title="Peixes"
      description="Peixes e aquário: tanque, ração, filtragem e itens de decoração para seu aquário." 
      products={PRODUCTS}
      iconName="fish"
    />
  );
}
