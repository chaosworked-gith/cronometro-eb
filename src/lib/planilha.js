import { dataISO, diasEntre, somarDias } from './datas.js';
import { calcularEconomizado, calcularPrazo, OPCOES_PUBLICO, OPCOES_SOLICITANTE } from './regras.js';
import { horasParaSegundos, lerHMS } from './tempo.js';
import { normalizar } from './texto.js';

// Leitura da planilha do Cronômetro (abas mensais, "Tipo de Atividade" e "Palavras-chave").
// Não grava nada: devolve os dados prontos para a prévia e para a gravação.
// Recebe o módulo do SheetJS para funcionar tanto no navegador quanto em testes no Node.

const MESES = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

// Cabeçalhos das abas mensais, comparados sem acento e sem maiúsculas
const COLUNAS_DEMANDA = {
  tipo: (c) => c === 'tipo de demanda',
  dataSolicitacao: (c) => c === 'data de solicitacao',
  ajuste: (c) => c === 'ajuste',
  dataEntrega: (c) => c === 'data de entrega',
  tempoGasto: (c) => c === 'tempo gasto',
  usoIA: (c) => c === 'uso de ia',
  usoTemplate: (c) => c === 'uso de template',
  solicitante: (c) => c === 'solicitante',
  publico: (c) => c === 'publico',
  nome: (c) => c === 'nome da demanda',
  numero: (c) => ['nº', 'n°', 'no', 'n', 'numero', 'n.º'].includes(c),
  tempoMin: (c) => c.startsWith('tempo minimo'),
  tempoMax: (c) => c.startsWith('tempo maximo'),
};

const COLUNAS_TIPO = {
  nome: (c) => c === 'tipo de atividade' || c === 'tipo',
  min: (c) => c.startsWith('tempo minimo'),
  max: (c) => c.startsWith('tempo maximo'),
  publico: (c) => c === 'publico',
};

const COLUNAS_PALAVRA = {
  palavra: (c) => c.startsWith('palavra'),
  tipo: (c) => c === 'tipo de atividade' || c === 'tipo',
};

export function lerPlanilha(XLSX, workbook) {
  const resultado = { tipos: null, palavras: null, meses: [], abasIgnoradas: [] };

  for (const aba of workbook.SheetNames) {
    const grade = lerGrade(XLSX, workbook.Sheets[aba]);
    const nomeAba = normalizar(aba);

    if (nomeAba.startsWith('tipo de atividade') || nomeAba === 'tipos') {
      resultado.tipos = lerTipos(grade);
    } else if (nomeAba.startsWith('palavras')) {
      resultado.palavras = lerPalavras(grade);
    } else {
      const cabecalho = acharCabecalho(grade, ['tipo de demanda', 'nome da demanda', 'tempo gasto']);
      if (cabecalho) resultado.meses.push(lerMes(XLSX, aba, grade, cabecalho));
      else resultado.abasIgnoradas.push(aba);
    }
  }

  // Tempo estimado e público que faltam na linha vêm da tabela de tipos
  const tiposPorNome = new Map((resultado.tipos?.itens ?? []).map((t) => [normalizar(t.nome), t]));
  for (const mes of resultado.meses) completarComTipos(mes, tiposPorNome);

  return resultado;
}

// ---------- Grade de células ----------

function lerGrade(XLSX, ws) {
  if (!ws || !ws['!ref']) return [];
  const area = XLSX.utils.decode_range(ws['!ref']);
  const linhas = [];
  for (let r = area.s.r; r <= area.e.r; r++) {
    const linha = [];
    for (let c = area.s.c; c <= area.e.c; c++) linha.push(ws[XLSX.utils.encode_cell({ r, c })] ?? null);
    linhas.push(linha);
  }
  return linhas;
}

function textoCelula(cel) {
  if (!cel || cel.v == null) return '';
  return String(cel.t === 's' ? cel.v : (cel.w ?? cel.v)).trim();
}

// A primeira linha é o título e a segunda o cabeçalho; procura nas primeiras linhas por segurança.
function acharCabecalho(grade, obrigatorias) {
  for (let i = 0; i < Math.min(grade.length, 5); i++) {
    const nomes = grade[i].map((cel) => normalizar(textoCelula(cel)));
    if (obrigatorias.every((o) => nomes.includes(o))) return { linha: i, nomes };
  }
  return null;
}

function mapearColunas(nomes, definicao) {
  const mapa = {};
  for (const [campo, combina] of Object.entries(definicao)) {
    const indice = nomes.findIndex((n) => n && combina(n));
    if (indice >= 0) mapa[campo] = indice;
  }
  return mapa;
}

// ---------- Valores ----------

function ehFormatoDeHora(formato) {
  return typeof formato === 'string' && /h|s|:/i.test(formato) && !/[dy]/i.test(formato);
}

// emHoras: colunas "(h)" com número decimal (0.5 = 00:30:00)
function lerTempo(cel, emHoras) {
  if (!cel || cel.v == null || cel.v === '') return null;
  if (cel.t === 'n') {
    if (ehFormatoDeHora(cel.z)) return Math.round(cel.v * 86400);
    return emHoras ? horasParaSegundos(cel.v) : Math.round(cel.v * 86400);
  }
  const texto = textoCelula(cel);
  const hms = lerHMS(texto);
  if (hms != null) return hms;
  if (emHoras && /^\d+([.,]\d+)?$/.test(texto)) return horasParaSegundos(Number(texto.replace(',', '.')));
  return undefined; // não reconhecido
}

// Uma célula pode ter várias datas: "08/07 e 09/07/2026", "23, 24 e 25/09", "16/10".
// O mês e o ano que faltam numa parte vêm da parte seguinte; se faltar em todas, usa o ano padrão.
function lerDatas(XLSX, cel, anoPadrao) {
  if (!cel || cel.v == null || cel.v === '') return { datas: [], erro: false };
  if (cel.t === 'n') {
    const d = XLSX.SSF.parse_date_code(cel.v);
    const iso = d ? dataISO(d.y, d.m, d.d) : null;
    return { datas: iso ? [iso] : [], erro: !iso };
  }
  if (cel.v instanceof Date) {
    return { datas: [dataISO(cel.v.getFullYear(), cel.v.getMonth() + 1, cel.v.getDate())], erro: false };
  }

  const partes = textoCelula(cel).split(/\s*(?:,|\be\b)\s*/i).filter(Boolean);
  const lidas = partes.map((p) => p.match(/^(\d{1,2})(?:\/(\d{1,2}))?(?:\/(\d{2,4}))?$/));
  if (!lidas.length || lidas.some((m) => !m)) return { datas: [], erro: true };

  let mes = null;
  let ano = null;
  const datas = [];
  for (let i = lidas.length - 1; i >= 0; i--) {
    const [, d, m, a] = lidas[i];
    if (m) mes = Number(m);
    if (a) ano = a.length === 2 ? 2000 + Number(a) : Number(a);
    const iso = mes ? dataISO(ano ?? anoPadrao, mes, Number(d)) : null;
    if (!iso) return { datas: [], erro: true };
    datas.unshift(iso);
  }
  return { datas, erro: false };
}

function lerSimNao(cel) {
  const v = normalizar(textoCelula(cel));
  if (v === 'sim') return 'Sim';
  if (v === 'nao') return 'Não';
  return null;
}

// Usa a grafia oficial da lista quando o texto bate (ex.: "Marketing/RH" vira "Marketing / RH")
function lerOpcao(cel, opcoes) {
  const texto = textoCelula(cel);
  if (!texto) return null;
  const chave = normalizar(texto).replace(/\s/g, '');
  return opcoes.find((o) => normalizar(o).replace(/\s/g, '') === chave) ?? texto;
}

// ---------- Abas ----------

function lerTipos(grade) {
  const cabecalho = acharCabecalho(grade, ['publico']);
  if (!cabecalho) return { itens: [], erro: 'Cabeçalho da aba "Tipo de Atividade" não encontrado.' };
  const col = mapearColunas(cabecalho.nomes, COLUNAS_TIPO);
  const itens = [];
  const vistos = new Set();
  for (const linha of grade.slice(cabecalho.linha + 1)) {
    const nome = textoCelula(linha[col.nome]);
    if (!nome || vistos.has(normalizar(nome))) continue;
    vistos.add(normalizar(nome));
    const min = lerTempo(linha[col.min], true);
    const max = lerTempo(linha[col.max], true);
    itens.push({
      nome,
      minH: min == null ? null : min / 3600,
      maxH: max == null ? null : max / 3600,
      publico: lerOpcao(linha[col.publico], OPCOES_PUBLICO),
    });
  }
  return { itens, semTempo: itens.filter((t) => t.minH == null || t.maxH == null).length };
}

function lerPalavras(grade) {
  const cabecalho = acharCabecalho(grade, ['tipo de atividade']) ?? acharCabecalho(grade, ['tipo']);
  if (!cabecalho) return { itens: [], erro: 'Cabeçalho da aba "Palavras-chave" não encontrado.' };
  const col = mapearColunas(cabecalho.nomes, COLUNAS_PALAVRA);
  const itens = [];
  const vistas = new Set();
  for (const linha of grade.slice(cabecalho.linha + 1)) {
    const palavra = textoCelula(linha[col.palavra]);
    const tipo = textoCelula(linha[col.tipo]);
    if (!palavra || !tipo || vistas.has(normalizar(palavra))) continue;
    vistas.add(normalizar(palavra));
    itens.push({ palavra, tipo });
  }
  return { itens };
}

// "Julho 2026" vira "2026-07"
function mesDaAba(aba) {
  const partes = normalizar(aba).match(/^([a-z]+)\s*(?:de\s*)?(\d{4})/);
  const indice = partes ? MESES.indexOf(partes[1]) : -1;
  return indice >= 0 ? `${partes[2]}-${String(indice + 1).padStart(2, '0')}` : null;
}

function lerMes(XLSX, aba, grade, cabecalho) {
  const col = mapearColunas(cabecalho.nomes, COLUNAS_DEMANDA);
  const mes = mesDaAba(aba);
  const anoPadrao = mes ? Number(mes.slice(0, 4)) : new Date().getFullYear();
  const resultado = { aba, mes, temAjuste: col.ajuste != null, demandas: [], ignoradas: 0, observacoes: [] };
  const anotar = (linha, texto) => resultado.observacoes.push(`Linha ${linha}: ${texto}`);

  grade.slice(cabecalho.linha + 1).forEach((linha, i) => {
    const numeroLinha = cabecalho.linha + i + 2;
    if (linha.every((cel) => !textoCelula(cel))) return;

    const nome = textoCelula(linha[col.nome]);
    const tempoGastoSeg = lerTempo(linha[col.tempoGasto], false);
    if (!nome && tempoGastoSeg == null) {
      resultado.ignoradas++;
      return;
    }
    if (!nome) anotar(numeroLinha, 'sem nome da demanda.');
    if (tempoGastoSeg === undefined) anotar(numeroLinha, `tempo gasto "${textoCelula(linha[col.tempoGasto])}" não reconhecido.`);

    const solicitacao = lerDatas(XLSX, linha[col.dataSolicitacao], anoPadrao);
    const entrega = lerDatas(XLSX, linha[col.dataEntrega], anoPadrao);
    const anoDaLinha = Number((solicitacao.datas[0] ?? entrega.datas.at(-1) ?? String(anoPadrao)).slice(0, 4));
    const ajuste = lerDatas(XLSX, linha[col.ajuste], anoDaLinha);
    if (solicitacao.erro) anotar(numeroLinha, `data de solicitação "${textoCelula(linha[col.dataSolicitacao])}" não reconhecida.`);
    if (entrega.erro) anotar(numeroLinha, `data de entrega "${textoCelula(linha[col.dataEntrega])}" não reconhecida.`);
    if (ajuste.erro) anotar(numeroLinha, `ajuste "${textoCelula(linha[col.ajuste])}" não reconhecido.`);

    const dataSolicitacao = solicitacao.datas[0] ?? null;
    // Várias datas na entrega: a última é a entrega e as outras são ajustes
    const dataEntrega = entrega.datas.at(-1) ?? null;
    let datasAjuste = [...ajuste.datas, ...entrega.datas.slice(0, -1)];
    // Ajuste sem ano que caiu muito antes da solicitação é da virada do ano (ex.: 28/12 e 02/01)
    if (dataSolicitacao) datasAjuste = datasAjuste.map((d) => (diasEntre(dataSolicitacao, d) < -180 ? somarDias(d, 365) : d));
    datasAjuste = [...new Set(datasAjuste)].sort();

    const numero = linha[col.numero]?.t === 'n' ? Math.round(linha[col.numero].v) : null;
    const tempoMin = lerTempo(linha[col.tempoMin], true);
    const tempoMax = lerTempo(linha[col.tempoMax], true);

    resultado.demandas.push({
      linha: numeroLinha,
      numero,
      mes,
      tipo: textoCelula(linha[col.tipo]),
      dataSolicitacao,
      datasAjuste,
      dataEntrega,
      tempoGastoSeg: tempoGastoSeg ?? null,
      usoIA: lerSimNao(linha[col.usoIA]),
      usoTemplate: lerSimNao(linha[col.usoTemplate]),
      solicitante: lerOpcao(linha[col.solicitante], OPCOES_SOLICITANTE),
      publico: lerOpcao(linha[col.publico], OPCOES_PUBLICO),
      nome,
      tempoMinSeg: tempoMin ?? null,
      tempoMaxSeg: tempoMax ?? null,
    });
  });

  // Mês pelo nome da aba; se não der, pelo mês mais comum das entregas
  if (!resultado.mes) {
    const contagem = {};
    for (const d of resultado.demandas) if (d.dataEntrega) contagem[d.dataEntrega.slice(0, 7)] = (contagem[d.dataEntrega.slice(0, 7)] ?? 0) + 1;
    resultado.mes = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    for (const d of resultado.demandas) d.mes = resultado.mes;
  }

  // Número que faltar continua a sequência do mês
  let proximo = Math.max(0, ...resultado.demandas.map((d) => d.numero ?? 0)) + 1;
  for (const d of resultado.demandas) if (d.numero == null) d.numero = proximo++;

  return resultado;
}

function completarComTipos(mes, tiposPorNome) {
  const tiposDesconhecidos = new Set();
  mes.completadasPeloTipo = 0;
  for (const d of mes.demandas) {
    const tipo = tiposPorNome.get(normalizar(d.tipo));
    if (!tipo && d.tipo) tiposDesconhecidos.add(d.tipo);
    if (tipo && (d.tempoMinSeg == null || d.tempoMaxSeg == null)) {
      d.tempoMinSeg ??= horasParaSegundos(tipo.minH);
      d.tempoMaxSeg ??= horasParaSegundos(tipo.maxH);
      mes.completadasPeloTipo++;
    }
    if (tipo && !d.publico) d.publico = tipo.publico;

    d.economizadoMinSeg = calcularEconomizado(d.tempoMinSeg, d.tempoGastoSeg);
    d.economizadoMaxSeg = calcularEconomizado(d.tempoMaxSeg, d.tempoGastoSeg);
    d.prazoDias = calcularPrazo(d.dataSolicitacao, d.dataEntrega);
  }
  mes.tiposDesconhecidos = [...tiposDesconhecidos];
  mes.semEstimativa = mes.demandas.filter((d) => d.tempoMinSeg == null || d.tempoMaxSeg == null).length;
  mes.tempoTotalSeg = mes.demandas.reduce((soma, d) => soma + (d.tempoGastoSeg ?? 0), 0);
}
