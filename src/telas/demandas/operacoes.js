import { collection, doc, getDocs, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import { recalcular } from '../../lib/regras';

const refDemanda = (id) => doc(db, 'demandas', id);

async function demandasDoGrupo(mes, responsavelEmail) {
  const snap = await getDocs(
    query(collection(db, 'demandas'), where('mes', '==', mes), where('responsavelEmail', '==', responsavelEmail)),
  );
  return snap.docs.map((d) => ({ id: d.id, numero: d.get('numero') ?? 0, dataEntrega: d.get('dataEntrega') ?? '' }));
}

// Nº sequencial por mês e por responsável, sem buracos, mantendo a ordem atual
function renumerar(lote, grupo, removidos = []) {
  grupo
    .filter((d) => !removidos.includes(d.id))
    .sort((a, b) => a.numero - b.numero || a.dataEntrega.localeCompare(b.dataEntrega))
    .forEach((d, i) => {
      if (d.numero !== i + 1) lote.update(refDemanda(d.id), { numero: i + 1 });
    });
}

// dados: campos editados. Se o mês ou o responsável mudarem, a demanda vai para o fim do novo grupo
// e o grupo antigo é renumerado.
export async function salvarEdicao(original, dados) {
  const final = { ...original, ...dados };
  const campos = { ...dados, ...recalcular(final), atualizadoEm: serverTimestamp() };
  const lote = writeBatch(db);
  const mudouDeGrupo = final.mes !== original.mes || final.responsavelEmail !== original.responsavelEmail;
  if (mudouDeGrupo) {
    const novoGrupo = await demandasDoGrupo(final.mes, final.responsavelEmail);
    campos.numero = novoGrupo.reduce((maior, d) => Math.max(maior, d.numero), 0) + 1;
    renumerar(lote, await demandasDoGrupo(original.mes, original.responsavelEmail), [original.id]);
  }
  lote.update(refDemanda(original.id), campos);
  await lote.commit();
}

export async function excluir(demanda) {
  const lote = writeBatch(db);
  lote.delete(refDemanda(demanda.id));
  renumerar(lote, await demandasDoGrupo(demanda.mes, demanda.responsavelEmail), [demanda.id]);
  await lote.commit();
}

// Resultado de juntar duas demandas repetidas: soma o tempo, mantém a entrega mais recente
// e registra as outras datas em datasAjuste. Os outros campos vêm da principal.
export function previaJuncao(principal, outra) {
  const entregas = [principal.dataEntrega, outra.dataEntrega].filter(Boolean).sort();
  const dataEntrega = entregas.at(-1) ?? null;
  const datas = [...(principal.datasAjuste ?? []), ...(outra.datasAjuste ?? []), ...entregas];
  const solicitacoes = [principal.dataSolicitacao, outra.dataSolicitacao].filter(Boolean).sort();
  const final = {
    ...principal,
    tempoGastoSeg: (principal.tempoGastoSeg ?? 0) + (outra.tempoGastoSeg ?? 0),
    dataEntrega,
    datasAjuste: [...new Set(datas)].filter((d) => d !== dataEntrega).sort(),
    dataSolicitacao: solicitacoes[0] ?? null,
    sessoes: [...(principal.sessoes ?? []), ...(outra.sessoes ?? [])],
  };
  return { ...final, ...recalcular(final) };
}

export async function juntar(principal, outra) {
  const final = previaJuncao(principal, outra);
  const lote = writeBatch(db);
  lote.update(refDemanda(principal.id), {
    tempoGastoSeg: final.tempoGastoSeg,
    dataEntrega: final.dataEntrega,
    datasAjuste: final.datasAjuste,
    dataSolicitacao: final.dataSolicitacao,
    sessoes: final.sessoes,
    economizadoMinSeg: final.economizadoMinSeg,
    economizadoMaxSeg: final.economizadoMaxSeg,
    prazoDias: final.prazoDias,
    atualizadoEm: serverTimestamp(),
  });
  lote.delete(refDemanda(outra.id));
  renumerar(lote, await demandasDoGrupo(outra.mes, outra.responsavelEmail), [outra.id]);
  await lote.commit();
}
