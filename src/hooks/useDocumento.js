import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

// Um documento em tempo real. dado: undefined enquanto carrega, null se não existe.
export default function useDocumento(colecao, id) {
  const chave = `${colecao}/${id}`;
  const [estado, setEstado] = useState({ chave: null, dado: undefined, erro: false });

  useEffect(
    () =>
      onSnapshot(
        doc(db, colecao, id),
        (snap) =>
          setEstado({
            chave,
            dado: snap.exists() ? { ...snap.data({ serverTimestamps: 'estimate' }), id: snap.id } : null,
            erro: false,
          }),
        () => setEstado({ chave, dado: null, erro: true }),
      ),
    [colecao, id, chave],
  );

  return estado.chave === chave ? estado : { dado: undefined, erro: false };
}
