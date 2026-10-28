// Números do topo da Semana e do Painel
export function resumir(demandas) {
  const comIA = demandas.filter((d) => d.usoIA === 'Sim');
  const soma = (lista, campo) => lista.reduce((total, d) => total + (d[campo] ?? 0), 0);
  return {
    quantidade: demandas.length,
    totalSeg: soma(demandas, 'tempoGastoSeg'),
    economizadoIAMinSeg: soma(comIA, 'economizadoMinSeg'),
    economizadoIAMaxSeg: soma(comIA, 'economizadoMaxSeg'),
    percentualIA: demandas.length ? Math.round((100 * comIA.length) / demandas.length) : 0,
  };
}
