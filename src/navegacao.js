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
  },
  {
    id: 'demandas',
    caminho: '/demandas',
    rotulo: 'Demandas',
    rotuloCurto: 'Demandas',
    icone: ListChecks,
    papeis: PAPEIS,
  },
  {
    id: 'semana',
    caminho: '/semana',
    rotulo: 'Semana',
    rotuloCurto: 'Semana',
    icone: CalendarDays,
    papeis: PAPEIS,
  },
  {
    id: 'painel',
    caminho: '/painel',
    rotulo: 'Painel',
    rotuloCurto: 'Painel',
    icone: LayoutDashboard,
    papeis: PAPEIS,
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
