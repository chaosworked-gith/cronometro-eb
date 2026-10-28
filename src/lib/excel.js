import { COLUNAS_DEMANDA } from './colunas.js';

// Exportação Excel: uma aba por pessoa (nome e cargo no topo) e uma aba "Equipe".
// Cabeçalho das colunas com fundo #001780, texto branco e fonte Lato. Tempos em HH:MM:SS.

const AZUL_MARINHO = 'FF001780';
const BRANCO = 'FFFFFFFF';
const PRETO = 'FF000000';
const LINHA_CABECALHO = 4;
const LARGURAS = { tipo: 34, nome: 48, ajuste: 16, solicitante: 16, publico: 18 };

// Caracteres que o Excel não aceita em nome de aba (a barra invertida é o código 92)
const PROIBIDOS_EM_ABA = new Set(['[', ']', ':', '*', '?', '/', String.fromCharCode(92)]);

function nomeDeAba(nome, usados) {
  const limpo = [...String(nome || 'Sem nome')].map((c) => (PROIBIDOS_EM_ABA.has(c) ? ' ' : c)).join('');
  const base = limpo.trim().slice(0, 28) || 'Sem nome';
  let final = base;
  for (let i = 2; usados.has(final.toLowerCase()); i++) final = `${base} ${i}`;
  usados.add(final.toLowerCase());
  return final;
}

function montarAba(planilha, { nomeAba, titulo, subtitulo, periodo, demandas, comResponsavel }) {
  const aba = planilha.addWorksheet(nomeAba, { views: [{ state: 'frozen', ySplit: LINHA_CABECALHO }] });
  const colunas = [...COLUNAS_DEMANDA, ...(comResponsavel ? [{ id: 'responsavel', titulo: 'Responsável', valor: (d) => d.responsavelNome ?? '' }] : [])];
  aba.columns = colunas.map((c) => ({ key: c.id, width: LARGURAS[c.id] ?? (c.tempo ? 14 : 13) }));

  aba.getCell('A1').value = titulo;
  aba.getCell('A1').font = { name: 'Lato', size: 14, bold: true, color: { argb: AZUL_MARINHO } };
  aba.getCell('A2').value = subtitulo;
  aba.getCell('A2').font = { name: 'Lato', size: 11, color: { argb: PRETO } };
  aba.getCell('A3').value = periodo;
  aba.getCell('A3').font = { name: 'Lato', size: 11, italic: true, color: { argb: PRETO } };

  const cabecalho = aba.getRow(LINHA_CABECALHO);
  colunas.forEach((c, i) => {
    const celula = cabecalho.getCell(i + 1);
    celula.value = c.titulo;
    celula.font = { name: 'Lato', bold: true, color: { argb: BRANCO } };
    celula.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUL_MARINHO } };
    celula.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  cabecalho.height = 36;

  demandas.forEach((d, i) => {
    const linha = aba.getRow(LINHA_CABECALHO + 1 + i);
    colunas.forEach((c, j) => {
      const celula = linha.getCell(j + 1);
      const valor = c.valor(d);
      celula.value = valor === '' ? null : valor;
      celula.font = { name: 'Lato', color: { argb: PRETO } };
      if (c.tempo || c.numero) celula.alignment = { horizontal: 'right' };
    });
  });
  return aba;
}

// pessoas: [{ nome, cargo, demandas }]; equipe: todas as demandas do período.
// Recebe o módulo do ExcelJS (assim dá para testar no Node) e devolve o conteúdo do arquivo.
export async function gerarPlanilha(ExcelJS, { periodo, pessoas, equipe }) {
  const planilha = new ExcelJS.Workbook();
  planilha.creator = 'Cronômetro de Atividades | Elétrica Bahiana';
  const usados = new Set(['equipe']);

  for (const p of pessoas) {
    montarAba(planilha, {
      nomeAba: nomeDeAba(p.nome, usados),
      titulo: p.nome,
      subtitulo: p.cargo || 'Equipe de Marketing',
      periodo,
      demandas: p.demandas,
      comResponsavel: false,
    });
  }
  montarAba(planilha, {
    nomeAba: 'Equipe',
    titulo: 'Equipe de Marketing',
    subtitulo: 'Elétrica Bahiana',
    periodo,
    demandas: equipe,
    comResponsavel: true,
  });

  return planilha.xlsx.writeBuffer();
}

export async function exportarExcel({ nomeArquivo, ...dados }) {
  const { default: ExcelJS } = await import('exceljs');
  const conteudo = await gerarPlanilha(ExcelJS, dados);
  const url = URL.createObjectURL(
    new Blob([conteudo], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Agrupa por pessoa (ordem alfabética), com o cargo vindo de membros
export function agruparPorPessoa(demandas, membros) {
  const cargoPorEmail = new Map((membros ?? []).map((m) => [m.id, m.cargo]));
  const grupos = new Map();
  for (const d of demandas) {
    if (!grupos.has(d.responsavelEmail)) {
      grupos.set(d.responsavelEmail, { nome: d.responsavelNome, cargo: cargoPorEmail.get(d.responsavelEmail) ?? '', demandas: [] });
    }
    grupos.get(d.responsavelEmail).demandas.push(d);
  }
  return [...grupos.values()].sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR'));
}
