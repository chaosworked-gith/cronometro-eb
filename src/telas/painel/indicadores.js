import { formatarData, nomeDoMes, rotuloMes, rotuloSemana, somarDias, somarMeses } from '../../lib/datas';

// Primeiro mês do histórico (planilha importada)
export const INICIO_HISTORICO = '2026-07';

// periodo: { modo: 'semana' | 'mes' | 'intervalo', segunda, mes, de, ate }
export function intervaloDoPeriodo(p) {
  if (p.modo === 'semana') {
    return { inicio: p.segunda, fim: somarDias(p.segunda, 5), rotulo: `Semana de ${rotuloSemana(p.segunda)}` };
  }
  if (p.modo === 'intervalo') {
    const [inicio, fim] = [p.de, p.ate].sort();
    return { inicio, fim, rotulo: `De ${formatarData(inicio)} a ${formatarData(fim)}` };
  }
  return { inicio: `${p.mes}-01`, fim: somarDias(`${somarMeses(p.mes, 1)}-01`, -1), rotulo: rotuloMes(p.mes) };
}

function agrupar(demandas, chave) {
  const grupos = new Map();
  for (const d of demandas) {
    const k = chave(d) || 'Não informado';
    const g = grupos.get(k) ?? { rotulo: k, quantidade: 0, totalSeg: 0 };
    g.quantidade++;
    g.totalSeg += d.tempoGastoSeg ?? 0;
    grupos.set(k, g);
  }
  return [...grupos.values()];
}

// Os tipos mais frequentes; o resto vira "Outros"
export function porTipo(demandas, limite = 8) {
  const lista = agrupar(demandas, (d) => d.tipo).sort((a, b) => b.quantidade - a.quantidade);
  if (lista.length <= limite) return lista;
  const resto = lista.slice(limite - 1);
  return [
    ...lista.slice(0, limite - 1),
    {
      rotulo: 'Outros',
      quantidade: resto.reduce((s, g) => s + g.quantidade, 0),
      totalSeg: resto.reduce((s, g) => s + g.totalSeg, 0),
    },
  ];
}

export function porPessoa(demandas) {
  return agrupar(demandas, (d) => d.responsavelNome).sort((a, b) => b.totalSeg - a.totalSeg);
}

export function porPublico(demandas) {
  return agrupar(demandas, (d) => d.publico).sort((a, b) => b.quantidade - a.quantidade);
}

// Horas e demandas de cada mês, de julho de 2026 até o mês final
export function evolucaoMensal(demandas, ateMes) {
  const meses = [];
  for (let m = INICIO_HISTORICO; m <= ateMes; m = somarMeses(m, 1)) meses.push(m);
  return meses.map((mes) => {
    const doMes = demandas.filter((d) => d.mes === mes);
    return {
      mes,
      rotulo: `${nomeDoMes(Number(mes.slice(5, 7))).slice(0, 3)}/${mes.slice(2, 4)}`,
      quantidade: doMes.length,
      totalSeg: doMes.reduce((s, d) => s + (d.tempoGastoSeg ?? 0), 0),
    };
  });
}

export function encurtar(texto, limite = 30) {
  return texto.length > limite ? `${texto.slice(0, limite - 3)}...` : texto;
}
