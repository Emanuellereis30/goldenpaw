import { CategoryProduct, CategoryScreen } from '@/components/category-screen';

const PRODUCTS: CategoryProduct[] = [
  { id: '26', nome: 'Ração para Pássaros', preco: 'R$ 21,50', image: require('../assets/img/racaopassaro.png') },
  { id: '27', nome: 'Ração Premium para Pássaros', preco: 'R$ 99,90', image: require('../assets/img/racaopassaropremium.png') },
  { id: '28', nome: 'Bebedouro para Pássaros', preco: 'R$ 11,90', image: require('../assets/img/bebedouropassaro.png') },
  { id: '29', nome: 'Comedouro para Pássaros', preco: 'R$ 14,99', image: require('../assets/img/comedouropassaro.png') },
  { id: '30', nome: 'Kit Bebedouro e Comedouro', preco: 'R$ 25,00', image: require('../assets/img/kitcomedouroebebedouro.png') },
];

export default function AvesScreen() {
  return (
    <CategoryScreen
      title="Aves"
      description="Tudo para suas aves: alimentação, água, comedouros e acessórios confortáveis."
      products={PRODUCTS}
      iconName="egg"
    />
  );
}
