import { CategoryProduct, CategoryScreen } from '@/components/category-screen';

const PRODUCTS: CategoryProduct[] = [
  { id: '1', nome: 'Ração Premium Cães', preco: 'R$ 189,90', image: require('../assets/img/racao.png') },
  { id: '4', nome: 'Coleira Antipulgas', preco: 'R$ 189,90', image: require('../assets/img/coleira.png') },
  { id: '5', nome: 'Cama Ortopédica', preco: 'R$ 159,90', image: require('../assets/img/cama.png') },
  { id: '10', nome: 'Petisco para Cães', preco: 'R$ 15,00', image: require('../assets/img/petiscocachorro.png') },
  { id: '12', nome: 'Caixa de Transporte (Cachorro)', preco: 'R$ 60,00', image: require('../assets/img/caixadetransportecachorro.png') },
];

export default function CaesScreen() {
  return (
    <CategoryScreen
      title="Cães"
      description="Encontre os melhores produtos para o seu cachorro: ração, brinquedos, higiene e conforto."
      products={PRODUCTS}
      iconName="paw"
    />
  );
}
