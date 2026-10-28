import { collection, doc, getDocs, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import { normalizar } from '../../lib/texto';

// Lotes pequenos para ficar longe do limite de gravações por lote do Firestore
const TAMANHO_LOTE = 200;

// Quantas demandas cada mês ("2026-07") já tem para o responsável
export async function contarDemandasPorMes(responsavelEmail) {
  const snap = await getDocs(query(collection(db, 'demandas'), where('responsavelEmail', '==', responsavelEmail)));
  const contagem = {};
  snap.forEach((d) => {
    const mes = d.get('mes');
    contagem[mes] = (contagem[mes] ?? 0) + 1;
  });
  return contagem;
}

// Tipos e palavras-chave com o mesmo nome (sem diferenciar acento) são atualizados; os outros são criados
async function operacoesDeTabela(colecao, campo, itens) {
  const existentes = await getDocs(collection(db, colecao));
  const porNome = new Map(existentes.docs.map((d) => [normalizar(d.get(campo)), d.ref]));
  return itens.map((item) => ({
    ref: porNome.get(normalizar(item[campo])) ?? doc(collection(db, colecao)),
    dados: item,
  }));
}

export async function gravarImportacao({ tipos, palavras, demandas, responsavel }, aoProgredir) {
  const operacoes = [
    ...(tipos.length ? await operacoesDeTabela('tipos', 'nome', tipos) : []),
    ...(palavras.length ? await operacoesDeTabela('palavrasChave', 'palavra', palavras) : []),
  ];

  for (const { linha, ...demanda } of demandas) {
    operacoes.push({
      ref: doc(collection(db, 'demandas')),
      dados: {
        ...demanda,
        responsavelEmail: responsavel.email,
        responsavelNome: responsavel.nome,
        status: 'concluida',
        sessoes: [],
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      },
    });
  }

  let gravadas = 0;
  aoProgredir?.(0, operacoes.length);
  try {
    for (let i = 0; i < operacoes.length; i += TAMANHO_LOTE) {
      const lote = writeBatch(db);
      for (const { ref, dados } of operacoes.slice(i, i + TAMANHO_LOTE)) lote.set(ref, dados);
      await lote.commit();
      gravadas = Math.min(i + TAMANHO_LOTE, operacoes.length);
      aoProgredir?.(gravadas, operacoes.length);
    }
  } catch (erro) {
    erro.gravadas = gravadas;
    erro.total = operacoes.length;
    throw erro;
  }
  return operacoes.length;
}
