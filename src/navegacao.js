import { CalendarDays, LayoutDashboard, ListChecks, ShieldCheck, Timer } from 'lucide-react';
import { PAPEIS } from './permissoes';

export const TELAS = [
  {
    id: 'cronometro',
    caminho: '/cronometro',
    rotulo: 'Meu Cronômetro',
    rotuloCurto: 'Cronômetro',
    icone: Timer,
    papeis: ['admin', 'equipe'],
    descricao: 'Aqui você vai iniciar, pausar e concluir as suas demandas.',
  },
  {
    id: 'demandas',
    caminho: '/demandas',
    rotulo: 'Demandas',
    rotuloCurto: 'Demandas',
    icone: ListChecks,
    papeis: PAPEIS,
    descricao: 'Lista das demandas da equipe, com filtros e exportação para Excel.',
  },
  {
    id: 'semana',
    caminho: '/semana',
    rotulo: 'Semana',
    rotuloCurto: 'Semana',
    icone: CalendarDays,
    papeis: PAPEIS,
    descricao: 'Resumo da semana de trabalho, de segunda a sábado.',
  },
  {
    id: 'painel',
    caminho: '/painel',
    rotulo: 'Painel',
    rotuloCurto: 'Painel',
    icone: LayoutDashboard,
    papeis: PAPEIS,
    descricao: 'Gráficos e indicadores da equipe de marketing.',
  },
  {
    id: 'admin',
    caminho: '/administracao',
    rotulo: 'Administração',
    rotuloCurto: 'Admin',
    icone: ShieldCheck,
    papeis: ['admin'],
  },
];

export function telasDoPapel(papel) {
  return TELAS.filter((tela) => tela.papeis.includes(papel));
}

export function telaInicial(papel) {
  // Gestor e diretoria entram direto no Painel
  if (papel === 'diretoria' || papel === 'gestor') return '/painel';
  return telasDoPapel(papel)[0]?.caminho ?? '/painel';
}
