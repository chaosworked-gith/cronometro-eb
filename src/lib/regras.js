import { diasEntre } from './datas.js';
import { normalizar } from './texto.js';

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

export const TIPO_ALMOCO = 'Horário do Almoço';

export function ehAlmoco(tipo) {
  return normalizar(tipo) === normalizar(TIPO_ALMOCO);
}

function ehLetraOuNumero(caractere) {
  return !!caractere && /[a-z0-9]/.test(caractere);
}

// Posição onde o trecho aparece no começo de uma palavra ("card" acha "cards", mas "ia" não acha "diaria")
function inicioDePalavra(texto, trecho) {
  let i = texto.indexOf(trecho);
  while (i >= 0) {
    if (!ehLetraOuNumero(texto[i - 1])) return i;
    i = texto.indexOf(trecho, i + 1);
  }
  return -1;
}

function contemPalavraInteira(texto, palavra) {
  for (let i = texto.indexOf(palavra); i >= 0; i = texto.indexOf(palavra, i + 1)) {
    if (!ehLetraOuNumero(texto[i - 1]) && !ehLetraOuNumero(texto[i + palavra.length])) return true;
  }
  return false;
}

// Tipo sugerido pelas palavras-chave encontradas no nome, sem diferenciar maiúsculas e acentos.
// Se várias combinam, vale a palavra-chave mais longa (a mais específica).
export function sugerirTipo(nome, palavrasChave) {
  const texto = normalizar(nome);
  if (!texto) return null;
  let melhor = null;
  for (const p of palavrasChave) {
    const chave = normalizar(p.palavra);
    if (!chave || inicioDePalavra(texto, chave) < 0) continue;
    if (!melhor || chave.length > normalizar(melhor.palavra).length) melhor = p;
  }
  return melhor;
}

// Regras automáticas, nesta ordem de prioridade: Trello, Reunião de Setor, Claude.
// Nas três, Solicitante = Marketing.
export function regraAutomatica(nome, tipo) {
  const texto = normalizar(nome);
  if (contemPalavraInteira(texto, 'trello')) {
    return { regra: 'Trello', usoIA: 'Não', usoTemplate: 'Não', solicitante: 'Marketing' };
  }
  if (normalizar(tipo) === 'reuniao de setor') {
    return { regra: 'Reunião de Setor', usoIA: 'Não', usoTemplate: 'Não', solicitante: 'Marketing' };
  }
  if (contemPalavraInteira(texto, 'claude')) {
    return { regra: 'Claude', usoIA: 'Sim', usoTemplate: 'Não', solicitante: 'Marketing' };
  }
  return null;
}
