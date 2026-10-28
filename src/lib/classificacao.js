import { diasEntre } from './datas.js';
import { inicioDePalavra } from './regras.js';
import { normalizar } from './texto.js';

// Sugestão do Tipo de Demanda pelo nome, nesta ordem de prioridade:
// 1) Histórico: demandas já registradas com nome parecido. Vale o tipo mais usado nelas, com
//    preferência para as da própria pessoa e as mais recentes.
// 2) Palavras-chave: a mais longa encontrada no nome. Formato de rede social ganha de data comemorativa.
// 3) Sem pista: nenhum tipo.

// Ignoradas ao comparar nomes
const PALAVRAS_VAZIAS = new Set([
  'a', 'o', 'as', 'os', 'e', 'de', 'do', 'da', 'dos', 'das', 'para', 'pra', 'pro', 'em', 'no', 'na',
  'nos', 'nas', 'com', 'por', 'ao', 'aos', 'um', 'uma', 'ft', 'se', 'que',
]);

// Formatos de rede social: ganham de datas comemorativas (um Reels de data especial é Conteúdo para Redes Sociais)
export const FORMATOS = ['reels', 'carrossel', 'story', 'stories', 'post', 'artigo'];

// Palavra-chave de data comemorativa: começa com "dia" ou com o nome de um mês ("setembro amarelo")
const MESES = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

// Semelhança mínima (0 a 1, pelo peso das palavras em comum) para uma demanda contar como parecida
export const SEMELHANCA_MINIMA = 0.5;
// Demandas da própria pessoa valem o dobro; o peso cai pela metade a cada 90 dias desde a entrega
const PESO_PROPRIA = 2;
const DIAS_PARA_METADE = 90;
// Palavra que aparece em 3 ou mais nomes (ou nas tabelas) não é nome de pessoa
const MINIMO_CONHECIDA = 3;

// Hífen, meia-risca ou travessão entre espaços: "Card - Leidiane"
const SEPARADOR = new RegExp(`\\s+[-${String.fromCharCode(0x2013, 0x2014)}]\\s+`);

// Sem maiúsculas, acentos e pontuação
export function limpar(texto) {
  return normalizar(texto)
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

// Plural e singular contam como a mesma palavra ("cards" e "card", "cartões" e "cartão")
function radical(palavra) {
  if (palavra.length <= 4) return palavra;
  if (/(oes|aes)$/.test(palavra)) return `${palavra.slice(0, -3)}ao`;
  if (/(res|zes|ses)$/.test(palavra)) return palavra.slice(0, -2);
  if (palavra.endsWith('s')) return palavra.slice(0, -1);
  return palavra;
}

function radicais(texto) {
  return limpar(texto)
    .split(' ')
    .filter((p) => p.length > 1 && !PALAVRAS_VAZIAS.has(p) && !/^\d+$/.test(p))
    .map(radical);
}

// "Card de Reconhecimento - Leidiane" vira "Card de Reconhecimento": o trecho depois do último " - "
// sai quando parece nome de pessoa (até 3 palavras, começa com maiúscula e com palavra desconhecida).
// "(ft. Taís)" também sai.
export function semNomeDePessoa(nome, ehConhecida) {
  const texto = String(nome ?? '').replace(/\(\s*ft\b[^)]*\)/gi, ' ');
  const partes = texto.split(SEPARADOR);
  if (partes.length < 2) return texto;
  const ultima = partes[partes.length - 1].replace(/\([^)]*\)/g, ' ').trim();
  const palavras = ultima.split(/\s+/).filter(Boolean);
  if (palavras.length === 0 || palavras.length > 3) return texto;
  if (!/^\p{Lu}/u.test(palavras[0]) || ehConhecida(palavras[0])) return texto;
  return partes.slice(0, -1).join(' - ');
}

function maisPesado(lista) {
  return [...lista].sort((a, b) => b.peso - a.peso);
}

// demandas: histórico ({ id, nome, tipo, responsavelEmail, dataEntrega }); palavras: tabela palavrasChave;
// tipos: tabela tipos. Só sugere tipos que existem na tabela de tipos.
export function criarClassificador({ demandas = [], palavras = [], tipos = [], hoje = null }) {
  const tipoPorChave = new Map(tipos.map((t) => [normalizar(t.nome), t.nome]));
  const tipoCadastrado = (nome) => tipoPorChave.get(normalizar(nome)) ?? null;

  // Vocabulário conhecido, para não confundir palavra comum com nome de pessoa
  const vezes = new Map();
  for (const d of demandas) for (const r of new Set(radicais(d.nome))) vezes.set(r, (vezes.get(r) ?? 0) + 1);
  const dasTabelas = new Set([...tipos.map((t) => t.nome), ...palavras.map((p) => p.palavra)].flatMap(radicais));
  const ehConhecida = (palavra) => {
    const r = radicais(palavra)[0];
    return !r || dasTabelas.has(r) || (vezes.get(r) ?? 0) >= MINIMO_CONHECIDA;
  };
  const termosDoNome = (nome) => [...new Set(radicais(semNomeDePessoa(nome, ehConhecida)))];

  // Histórico: só demandas com nome e com tipo da tabela
  const historico = [];
  for (const d of demandas) {
    const tipo = tipoCadastrado(d.tipo);
    const termos = tipo ? termosDoNome(d.nome) : [];
    if (termos.length) historico.push({ demanda: d, tipo, termos: new Set(termos) });
  }

  // Palavra rara pesa mais que palavra comum ("reconhecimento" pesa mais que "card")
  const emQuantas = new Map();
  const indice = new Map();
  historico.forEach((h, i) => {
    for (const t of h.termos) {
      emQuantas.set(t, (emQuantas.get(t) ?? 0) + 1);
      if (!indice.has(t)) indice.set(t, []);
      indice.get(t).push(i);
    }
  });
  const total = historico.length;
  const pesoDoTermo = (t) => Math.log((total + 1) / ((emQuantas.get(t) ?? 0) + 1)) + 1;
  const somarPesos = (termos) => [...termos].reduce((soma, t) => soma + pesoDoTermo(t), 0);
  for (const h of historico) h.pesoTotal = somarPesos(h.termos);

  // Palavras-chave da tabela, mais os formatos de rede social que não estão nela
  const chaves = palavras
    .map((p) => ({ palavra: p.palavra, texto: limpar(p.palavra), tipo: tipoCadastrado(p.tipo) }))
    .filter((c) => c.texto && c.tipo)
    .map((c) => ({
      ...c,
      formato: FORMATOS.some((f) => c.texto === f || c.texto.startsWith(`${f} `)),
      comemorativa: c.texto.startsWith('dia ') || MESES.some((m) => c.texto === m || c.texto.startsWith(`${m} `)),
    }));
  const contagemFormatos = new Map();
  for (const c of chaves) if (c.formato) contagemFormatos.set(c.tipo, (contagemFormatos.get(c.tipo) ?? 0) + 1);
  const tipoDosFormatos = [...contagemFormatos].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  if (tipoDosFormatos) {
    for (const f of FORMATOS) {
      if (!chaves.some((c) => c.texto === f)) chaves.push({ palavra: f, texto: f, tipo: tipoDosFormatos, formato: true, comemorativa: false });
    }
  }

  function peloHistorico(termos, { email, ignorarId }) {
    const candidatas = new Set(termos.flatMap((t) => indice.get(t) ?? []));
    const pesoBusca = somarPesos(termos);
    const parecidas = [];
    for (const i of candidatas) {
      const h = historico[i];
      if (ignorarId != null && h.demanda.id === ignorarId) continue;
      const comum = termos.reduce((soma, t) => soma + (h.termos.has(t) ? pesoDoTermo(t) : 0), 0);
      const semelhanca = comum / (pesoBusca + h.pesoTotal - comum);
      if (semelhanca < SEMELHANCA_MINIMA) continue;
      const dias = hoje && h.demanda.dataEntrega ? Math.max(0, diasEntre(h.demanda.dataEntrega, hoje)) : 0;
      const propria = !!email && h.demanda.responsavelEmail === email;
      const peso = semelhanca * (propria ? PESO_PROPRIA : 1) * 0.5 ** (dias / DIAS_PARA_METADE);
      parecidas.push({ demanda: h.demanda, tipo: h.tipo, semelhanca, propria, peso });
    }
    const porTipo = new Map();
    for (const p of parecidas) {
      const voto = porTipo.get(p.tipo) ?? { tipo: p.tipo, peso: 0, quantidade: 0 };
      voto.peso += p.peso;
      voto.quantidade += 1;
      porTipo.set(p.tipo, voto);
    }
    return { parecidas: maisPesado(parecidas), votos: maisPesado(porTipo.values()) };
  }

  // Todas as palavras-chave que aparecem no começo de uma palavra do nome; vale a mais longa,
  // mas formato de rede social ganha de data comemorativa
  function pelasPalavras(nome) {
    const texto = limpar(nome);
    const encontradas = chaves
      .filter((c) => (c.formato && FORMATOS.includes(c.texto) ? palavraInteira(texto, c.texto) : inicioDePalavra(texto, c.texto) >= 0))
      .sort((a, b) => b.texto.length - a.texto.length);
    let escolhida = encontradas[0] ?? null;
    let motivo = encontradas.length > 1 ? 'mais longa' : null;
    if (escolhida?.comemorativa) {
      const formato = encontradas.find((c) => c.formato);
      if (formato) {
        escolhida = formato;
        motivo = 'formato';
      }
    }
    return { escolhida, encontradas, motivo };
  }

  // opcoes: email (quem está criando), ignorarId (demanda que fica fora do histórico), semHistorico
  function classificar(nome, { email = null, ignorarId = null, semHistorico = false } = {}) {
    const termos = semHistorico ? [] : termosDoNome(nome);
    const { parecidas, votos } = termos.length ? peloHistorico(termos, { email, ignorarId }) : { parecidas: [], votos: [] };
    const { escolhida, encontradas, motivo } = pelasPalavras(nome);

    let tipo = null;
    let origem = null;
    if (votos.length) {
      tipo = votos[0].tipo;
      origem = 'historico';
    } else if (escolhida) {
      tipo = escolhida.tipo;
      origem = 'palavra';
    }

    const alternativas = [];
    for (const t of [...votos.map((v) => v.tipo), ...(escolhida ? [escolhida.tipo] : []), ...encontradas.map((c) => c.tipo)]) {
      if (t !== tipo && !alternativas.includes(t)) alternativas.push(t);
    }

    return {
      tipo,
      origem,
      parecidas,
      votos,
      palavra: escolhida,
      palavras: encontradas,
      motivo,
      alternativas: alternativas.slice(0, 3),
    };
  }

  return { classificar, termosDoNome, tamanhoDoHistorico: historico.length };
}

function palavraInteira(texto, palavra) {
  return ` ${texto} `.includes(` ${palavra} `);
}

// Relatório de acerto: classifica cada demanda do histórico como se fosse nova (ela mesma fica fora do
// histórico) e compara com o tipo registrado. Demandas sem nome ou com tipo fora da tabela ficam de fora.
export function avaliarHistorico(classificador, demandas, tipos, { semHistorico = false } = {}) {
  const cadastrados = new Set(tipos.map((t) => normalizar(t.nome)));
  const mesmoTipo = (a, b) => !!a && normalizar(a) === normalizar(b);
  const linhas = [];
  let semNome = 0;
  let foraDaTabela = 0;
  for (const d of demandas) {
    if (!limpar(d.nome)) semNome += 1;
    else if (!cadastrados.has(normalizar(d.tipo))) foraDaTabela += 1;
    else {
      const resultado = classificador.classificar(d.nome, { email: d.responsavelEmail, ignorarId: d.id, semHistorico });
      const certo = mesmoTipo(resultado.tipo, d.tipo);
      const nasOpcoes = certo || resultado.alternativas.some((t) => mesmoTipo(t, d.tipo));
      linhas.push({ demanda: d, resultado, certo, nasOpcoes });
    }
  }

  const porOrigem = ['historico', 'palavra', null].map((origem) => {
    const daOrigem = linhas.filter((l) => l.resultado.origem === origem);
    return { origem, total: daOrigem.length, certos: daOrigem.filter((l) => l.certo).length };
  });

  // Palavras-chave que decidiram a sugestão: acertos, erros e o tipo certo mais comum nos erros
  const porPalavra = new Map();
  for (const l of linhas) {
    if (l.resultado.origem !== 'palavra') continue;
    const { palavra, tipo } = l.resultado.palavra;
    const item = porPalavra.get(palavra) ?? { palavra, tipo, certos: 0, erros: 0, tiposCertos: new Map() };
    if (l.certo) item.certos += 1;
    else {
      item.erros += 1;
      item.tiposCertos.set(l.demanda.tipo, (item.tiposCertos.get(l.demanda.tipo) ?? 0) + 1);
    }
    porPalavra.set(palavra, item);
  }
  const palavras = [...porPalavra.values()]
    .filter((p) => p.erros > 0)
    .map(({ tiposCertos, ...p }) => ({ ...p, tipoMaisComum: [...tiposCertos].sort((a, b) => b[1] - a[1])[0][0] }))
    .sort((a, b) => b.erros - a.erros || a.palavra.localeCompare(b.palavra, 'pt-BR'));

  return {
    total: linhas.length,
    certos: linhas.filter((l) => l.certo).length,
    nasOpcoes: linhas.filter((l) => l.nasOpcoes).length,
    semSugestao: linhas.filter((l) => !l.resultado.tipo).length,
    semNome,
    foraDaTabela,
    porOrigem,
    palavras,
    erros: linhas.filter((l) => !l.certo),
  };
}

// Texto curto de onde veio a sugestão, para mostrar embaixo do campo
export function explicarSugestao(resultado) {
  if (resultado.origem === 'historico') {
    const n = resultado.parecidas.length;
    return `Sugerido pelo histórico: ${n} ${n === 1 ? 'demanda parecida' : 'demandas parecidas'}`;
  }
  if (resultado.origem === 'palavra') return `Sugerido pela palavra-chave '${resultado.palavra.palavra}'`;
  return null;
}
