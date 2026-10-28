import { formatarAjuste, formatarData } from './datas.js';
import { formatarHMS } from './tempo.js';

// Colunas da exportação Excel, nesta ordem (CLAUDE.md). A tela Demandas usa as mesmas.
// tempo: alinhado à direita e em HH:MM:SS; numero: alinhado à direita.
export const COLUNAS_DEMANDA = [
  { id: 'tipo', titulo: 'Tipo de Demanda', valor: (d) => d.tipo ?? '' },
  { id: 'dataSolicitacao', titulo: 'Data de Solicitação', valor: (d) => formatarData(d.dataSolicitacao) },
  { id: 'ajuste', titulo: 'Ajuste', valor: (d) => formatarAjuste(d.datasAjuste) },
  { id: 'dataEntrega', titulo: 'Data de Entrega', valor: (d) => formatarData(d.dataEntrega) },
  { id: 'tempoGasto', titulo: 'Tempo Gasto', valor: (d) => formatarHMS(d.tempoGastoSeg), tempo: true },
  { id: 'usoIA', titulo: 'Uso de IA', valor: (d) => d.usoIA ?? '' },
  { id: 'usoTemplate', titulo: 'Uso de Template', valor: (d) => d.usoTemplate ?? '' },
  { id: 'solicitante', titulo: 'Solicitante', valor: (d) => d.solicitante ?? '' },
  { id: 'publico', titulo: 'Público', valor: (d) => d.publico ?? '' },
  { id: 'nome', titulo: 'Nome da Demanda', valor: (d) => d.nome ?? '' },
  { id: 'numero', titulo: 'Nº', valor: (d) => d.numero ?? '', numero: true },
  { id: 'tempoMin', titulo: 'Tempo mínimo estimado sem IA (h)', valor: (d) => formatarHMS(d.tempoMinSeg), tempo: true },
  { id: 'tempoMax', titulo: 'Tempo máximo estimado sem IA (h)', valor: (d) => formatarHMS(d.tempoMaxSeg), tempo: true },
  { id: 'economizadoMin', titulo: 'Tempo economizado mín. com IA (h)', valor: (d) => formatarHMS(d.economizadoMinSeg), tempo: true },
  { id: 'economizadoMax', titulo: 'Tempo economizado máx. com IA (h)', valor: (d) => formatarHMS(d.economizadoMaxSeg), tempo: true },
  { id: 'prazo', titulo: 'Prazo cumprido (dias)', valor: (d) => d.prazoDias ?? '', numero: true },
];

// Campos que precisam estar preenchidos; os que faltam aparecem em destaque
export function camposFaltando(d) {
  return [!d.usoIA && 'Uso de IA', !d.usoTemplate && 'Template', !d.solicitante && 'Solicitante'].filter(Boolean);
}
