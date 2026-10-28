import { regraAutomatica, sugerirTipo } from '../../lib/regras';
import { horasParaSegundos } from '../../lib/tempo';
import { normalizar } from '../../lib/texto';

// Monta a demanda nova a partir do nome: tipo pela palavra-chave, público e tempos pela tabela de tipos
// e as regras de Trello, Reunião de Setor e Claude. O que a pessoa mudou à mão (manual) sempre vale.
export function montarNovaDemanda({ nome, manual, tipos, palavras, hoje }) {
  const palavraSugerida = manual.tipo ? null : sugerirTipo(nome, palavras);
  const nomeDoTipo = manual.tipo ?? palavraSugerida?.tipo ?? '';
  const tipo = tipos.find((t) => normalizar(t.nome) === normalizar(nomeDoTipo));
  const regra = regraAutomatica(nome, nomeDoTipo);

  return {
    dados: {
      nome: nome.trim(),
      tipo: tipo?.nome ?? nomeDoTipo,
      publico: manual.publico ?? tipo?.publico ?? '',
      usoIA: manual.usoIA ?? regra?.usoIA ?? 'Não',
      usoTemplate: manual.usoTemplate ?? regra?.usoTemplate ?? 'Não',
      solicitante: manual.solicitante ?? regra?.solicitante ?? 'Marketing',
      dataSolicitacao: manual.dataSolicitacao ?? hoje,
      tempoMinSeg: horasParaSegundos(tipo?.minH),
      tempoMaxSeg: horasParaSegundos(tipo?.maxH),
    },
    palavraSugerida,
    regra,
  };
}

export function validarNovaDemanda(dados, hoje) {
  if (!dados.nome) return 'Escreva o nome da demanda.';
  if (!dados.tipo) return 'Escolha o tipo da demanda.';
  if (!dados.publico) return 'Escolha o público.';
  if (!dados.dataSolicitacao) return 'Informe a data de solicitação.';
  if (dados.dataSolicitacao > hoje) return 'A data de solicitação não pode ser depois de hoje.';
  return null;
}
