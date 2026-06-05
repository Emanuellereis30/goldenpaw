/**
 * INTERFACES E TIPOS PARA O PAINEL ADMIN
 */

export interface Produto {
  id: string;
  nome: string;
  preco: string;
  kg?: string;
  image: string;
  tag?: string;
  estoque?: number;
}

export interface Pet {
  id: string;
  petId: string;
  nome: string;
  tipo: "cachorro" | "gato" | "ave" | "peixe";
  raca: string;
  idade: number;
  porte: "pequeno" | "médio" | "grande";
  sexo: "macho" | "fêmea";
  tags: string;
  fotoUrl: string;
}

export interface Pedido {
  id: string;
  clienteId: string;
  clienteNome: string;
  data: string;
  horario: string;
  itens: ItemPedido[];
  total: string;
  endereco: string;
  metodoPagamento: "credito" | "debito" | "pix" | "boleto";
  status: "pendente" | "confirmado" | "enviado" | "entregue" | "cancelado";
  rastreamento?: string;
}

export interface ItemPedido {
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  preco: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf?: string;
  dataCadastro: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  pets: PetUsuario[];
  historicoCompras: HistoricoCompra[];
  totalGasto: string;
}

export interface PetUsuario {
  id: string;
  nome: string;
  tipo: string;
  raca: string;
  idade: number;
}

export interface HistoricoCompra {
  pedidoId: string;
  data: string;
  total: string;
  status: string;
}

export interface Funcionario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  dataAdmissao: string;
  salario: string;
  status: "ativo" | "inativo";
  endereco?: string;
}

export interface DashboardStats {
  produtosMaisVendidos: ProdutoVenda[];
  pedidosRecentes: Pedido[];
  usuariosMaisCompram: UsuarioCompra[];
  petsInteresse: PetInteresse[];
  totalVendas: string;
  totalPedidos: number;
  totalUsuarios: number;
  totalPets: number;
}

export interface ProdutoVenda {
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  total: string;
}

export interface UsuarioCompra {
  usuarioId: string;
  usuarioNome: string;
  totalGasto: string;
  quantidadePedidos: number;
}

export interface PetInteresse {
  petId: string;
  petNome: string;
  quantidadeInteresse: number;
}

export interface RequisicaoAdocao {
  id: string;
  petId: string;
  petNome: string;
  petRaca: string;
  petPorte: string;
  petSexo: string;
  nomeCompleto: string;
  dataNascimento: string;
  cpf: string;
  celular: string;
  email: string;
  endereco: string;
  cep: string;
  tipoResidencia: string;
  situacaoImovel: string;
  permiteAnimais?: string;
  pessoasNaCasa: number;
  temCriancas: string;
  temIdosos: string;
  temAlergias: string;
  temAnimaisAtuais: string;
  temAnimaisAnteriores: string;
  conscienciaFinanceira: string;
  mudancasRotina: string;
  concordaAcompanhamento: string;
  observacoes: string;
  criadoEm: string;
  status: "pendente" | "aprovado" | "rejeitado";
  visualizado: boolean;
}

export type TabType =
  | "dashboard"
  | "produtos"
  | "pedidos"
  | "usuarios"
  | "pets"
  | "funcionarios";
