import { arrayUnion, collection, doc, getDocs, query, serverTimestamp, Timestamp, where, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import { diaISO } from '../../lib/datas';
import { calcularEconomizado, calcularPrazo, ehAlmoco, TIPO_ALMOCO } from '../../lib/regras';
import { horasParaSegundos } from '../../lib/tempo';
import { normalizar } from '../../lib/texto';

// Ações do Meu Cronômetro. Cada uma grava a demanda e o cronometros/{email} no mesmo lote.
// ctx: { email, nome, cronometro (documento ou null), atual (demanda do cronômetro ou null) }

const refCronometro = (email) => doc(db, 'cronometros', email);
const refDemanda = (id) => doc(db, 'demandas', id);
const datasUnicas = (datas) => [...new Set(datas)].sort();

// Fecha a sessão que está rodando: grava a sessão e recalcula tempo gasto, economizado, prazo e entrega.
function camposAoFecharSessao(demanda, inicio, status) {
  const hoje = diaISO();
  const fim = Timestamp.now();
  const seg = Math.max(0, Math.round((fim.toMillis() - inicio.toMillis()) / 1000));
  const total = (demanda.tempoGastoSeg ?? 0) + seg;
  return {
    sessoes: arrayUnion({ inicio, fim, seg }),
    tempoGastoSeg: total,
    economizadoMinSeg: calcularEconomizado(demanda.tempoMinSeg, total),
    economizadoMaxSeg: calcularEconomizado(demanda.tempoMaxSeg, total),
    dataEntrega: hoje,
    prazoDias: calcularPrazo(demanda.dataSolicitacao, hoje),
    datasAjuste: datasUnicas(demanda.datasAjuste ?? []),
    status,
    atualizadoEm: serverTimestamp(),
  };
}

// Encerra o cronômetro que está rodando. Almoço é sempre concluído; o resto fica pausado.
// Devolve o tempo gasto total gravado na demanda.
function encerrarAtual(lote, ctx, status = 'pausada') {
  const { cronometro, atual } = ctx;
  if (!cronometro?.rodando || !cronometro.inicio || !atual) return atual?.tempoGastoSeg ?? 0;
  const campos = camposAoFecharSessao(atual, cronometro.inicio, ehAlmoco(atual.tipo) ? 'concluida' : status);
  lote.update(refDemanda(atual.id), campos);
  return campos.tempoGastoSeg;
}

function ligarCronometro(lote, email, demandaId) {
  lote.set(refCronometro(email), { demandaId, inicio: serverTimestamp(), rodando: true });
}

// Retoma uma demanda em andamento ou pausada: soma o tempo na mesma demanda, atualiza a entrega
// e registra o dia em datasAjuste (sem repetir). Nunca cria outra demanda.
export async function iniciarExistente(demanda, ctx) {
  if (ctx.cronometro?.rodando && ctx.cronometro.demandaId === demanda.id) return;
  const hoje = diaISO();
  const retomada = (demanda.tempoGastoSeg ?? 0) > 0;
  const lote = writeBatch(db);
  encerrarAtual(lote, ctx);
  lote.update(refDemanda(demanda.id), {
    status: 'em_andamento',
    dataEntrega: hoje,
    prazoDias: calcularPrazo(demanda.dataSolicitacao, hoje),
    datasAjuste: datasUnicas([...(demanda.datasAjuste ?? []), ...(retomada ? [hoje] : [])]),
    atualizadoEm: serverTimestamp(),
  });
  ligarCronometro(lote, ctx.email, demanda.id);
  await lote.commit();
}

// Número sequencial por mês e por responsável
async function proximoNumero(email, mes) {
  const snap = await getDocs(
    query(collection(db, 'demandas'), where('responsavelEmail', '==', email), where('mes', '==', mes)),
  );
  return snap.docs.reduce((maior, d) => Math.max(maior, d.get('numero') ?? 0), 0) + 1;
}

// dados: nome, tipo, publico, usoIA, usoTemplate, solicitante, dataSolicitacao, tempoMinSeg, tempoMaxSeg
export async function iniciarNova(dados, ctx) {
  const hoje = diaISO();
  const mes = hoje.slice(0, 7);
  const numero = await proximoNumero(ctx.email, mes);
  const ref = doc(collection(db, 'demandas'));
  const lote = writeBatch(db);
  encerrarAtual(lote, ctx);
  lote.set(ref, {
    numero,
    mes,
    tipo: dados.tipo,
    dataSolicitacao: dados.dataSolicitacao,
    datasAjuste: [],
    dataEntrega: hoje,
    tempoGastoSeg: 0,
    usoIA: dados.usoIA,
    usoTemplate: dados.usoTemplate,
    solicitante: dados.solicitante,
    publico: dados.publico,
    nome: dados.nome,
    tempoMinSeg: dados.tempoMinSeg,
    tempoMaxSeg: dados.tempoMaxSeg,
    economizadoMinSeg: calcularEconomizado(dados.tempoMinSeg, 0),
    economizadoMaxSeg: calcularEconomizado(dados.tempoMaxSeg, 0),
    prazoDias: calcularPrazo(dados.dataSolicitacao, hoje),
    responsavelEmail: ctx.email,
    responsavelNome: ctx.nome,
    status: 'em_andamento',
    sessoes: [],
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
  ligarCronometro(lote, ctx.email, ref.id);
  await lote.commit();
}

export async function pausar(ctx) {
  const lote = writeBatch(db);
  encerrarAtual(lote, ctx);
  // Almoço pausado já fica concluído, então não continua como demanda atual
  const demandaId = ctx.atual && !ehAlmoco(ctx.atual.tipo) ? ctx.atual.id : null;
  lote.set(refCronometro(ctx.email), { demandaId, inicio: null, rodando: false });
  await lote.commit();
}

// Devolve o tempo gasto total da demanda concluída
export async function concluir(ctx) {
  const lote = writeBatch(db);
  let total = ctx.atual.tempoGastoSeg ?? 0;
  if (ctx.cronometro?.rodando) {
    total = encerrarAtual(lote, ctx, 'concluida');
  } else {
    const hoje = diaISO();
    lote.update(refDemanda(ctx.atual.id), {
      status: 'concluida',
      dataEntrega: hoje,
      prazoDias: calcularPrazo(ctx.atual.dataSolicitacao, hoje),
      atualizadoEm: serverTimestamp(),
    });
  }
  lote.set(refCronometro(ctx.email), { demandaId: null, inicio: null, rodando: false });
  await lote.commit();
  return total;
}

// Botão rápido: pausa o que estiver rodando e começa o almoço com o tipo Horário do Almoço
export async function iniciarAlmoco(ctx, tipos) {
  if (ctx.cronometro?.rodando && ehAlmoco(ctx.atual?.tipo)) return;
  const tipo = tipos.find((t) => normalizar(t.nome) === normalizar(TIPO_ALMOCO));
  await iniciarNova(
    {
      nome: 'Almoço',
      tipo: tipo?.nome ?? TIPO_ALMOCO,
      publico: tipo?.publico ?? 'Interno',
      usoIA: 'Não',
      usoTemplate: 'Não',
      solicitante: 'Marketing',
      dataSolicitacao: diaISO(),
      tempoMinSeg: horasParaSegundos(tipo?.minH),
      tempoMaxSeg: horasParaSegundos(tipo?.maxH),
    },
    ctx,
  );
}
