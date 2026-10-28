import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';

// Consulta em tempo real com filtros de igualdade, ex.: [['responsavelEmail', '==', email]].
// Só igualdades: assim o Firestore não pede índice composto. itens fica null enquanto carrega.
export default function useConsulta(colecao, filtros) {
  const chave = `${colecao}:${JSON.stringify(filtros)}`;
  const [estado, setEstado] = useState({ chave: null, itens: null, erro: false });

  useEffect(() => {
    const condicoes = JSON.parse(chave.slice(colecao.length + 1)).map(([campo, op, valor]) => where(campo, op, valor));
    return onSnapshot(
      query(collection(db, colecao), ...condicoes),
      (snap) =>
        setEstado({
          chave,
          itens: snap.docs.map((d) => ({ ...d.data({ serverTimestamps: 'estimate' }), id: d.id })),
          erro: false,
        }),
      () => setEstado({ chave, itens: null, erro: true }),
    );
  }, [colecao, chave]);

  return estado.chave === chave ? estado : { itens: null, erro: false };
}
