import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

// Demandas do histórico para a sugestão de tipo. Lidas uma vez (não em tempo real) e guardadas por
// 30 minutos, para não repetir a leitura a cada tela. desde: "AAAA-MM-DD" (dataEntrega) ou null para tudo.
const GUARDA_MS = 30 * 60 * 1000;
const guardados = new Map();

function carregar(desde) {
  const chave = desde ?? 'tudo';
  const guardado = guardados.get(chave);
  if (guardado && Date.now() - guardado.em < GUARDA_MS) return guardado.promessa;
  const ref = desde ? query(collection(db, 'demandas'), where('dataEntrega', '>=', desde)) : collection(db, 'demandas');
  const promessa = getDocs(ref).then((snap) => snap.docs.map((d) => ({ ...d.data(), id: d.id })));
  promessa.catch(() => guardados.delete(chave));
  guardados.set(chave, { em: Date.now(), promessa });
  return promessa;
}

// ativo: só lê quando precisar (ex.: quando a pessoa começa a digitar um nome). itens fica null até chegar.
export default function useHistorico(ativo, desde = null) {
  const chave = desde ?? 'tudo';
  const [estado, setEstado] = useState({ chave: null, itens: null, erro: false });

  useEffect(() => {
    if (!ativo) return undefined;
    let vivo = true;
    carregar(desde).then(
      (itens) => vivo && setEstado({ chave, itens, erro: false }),
      () => vivo && setEstado({ chave, itens: null, erro: true }),
    );
    return () => {
      vivo = false;
    };
  }, [ativo, desde, chave]);

  return estado.chave === chave ? estado : { itens: null, erro: false };
}
