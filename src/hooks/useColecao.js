import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

// Coleção inteira em tempo real. itens fica null enquanto carrega.
export default function useColecao(nome, ordenar) {
  const [itens, setItens] = useState(null);
  const [erro, setErro] = useState(false);

  useEffect(
    () =>
      onSnapshot(
        collection(db, nome),
        (snap) => {
          const lista = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
          setItens(ordenar ? lista.sort(ordenar) : lista);
          setErro(false);
        },
        () => setErro(true),
      ),
    // ordenar é uma função fixa definida fora do componente
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nome],
  );

  return { itens, erro };
}
