import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

// Pedidos de acesso em tempo real. Só admin pode ler a coleção.
export default function usePedidosAcesso(ativo) {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    setPedidos([]);
    if (!ativo) return;
    return onSnapshot(
      collection(db, 'solicitacoes'),
      (snap) => {
        const lista = snap.docs.map((d) => ({ ...d.data({ serverTimestamps: 'estimate' }), email: d.id }));
        lista.sort((a, b) => (a.criadoEm?.toMillis?.() ?? 0) - (b.criadoEm?.toMillis?.() ?? 0));
        setPedidos(lista);
      },
      () => setPedidos([]),
    );
  }, [ativo]);

  return pedidos;
}
