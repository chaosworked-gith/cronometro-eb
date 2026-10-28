import { diasEntre } from './datas.js';

// Regras de negócio do CLAUDE.md.

export const OPCOES_SOLICITANTE = [
  'Marketing',
  'RH',
  'Diretoria',
  'Comercial',
  'Financeiro',
  'Logística',
  'Marketing / RH',
];

export const OPCOES_PUBLICO = ['Interno', 'Externo', 'Interno e Externo', 'Endomarketing', 'Atividades de Rotina'];

// Tempo economizado = maior valor entre zero e (estimado menos gasto). Calcula sempre, com ou sem IA.
export function calcularEconomizado(estimadoSeg, gastoSeg) {
  if (estimadoSeg == null || gastoSeg == null) return null;
  return Math.max(0, estimadoSeg - gastoSeg);
}

// Prazo cumprido (dias) = data de entrega menos data de solicitação.
export function calcularPrazo(dataSolicitacao, dataEntrega) {
  if (!dataSolicitacao || !dataEntrega) return null;
  return diasEntre(dataSolicitacao, dataEntrega);
}
