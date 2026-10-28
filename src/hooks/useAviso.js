import { useEffect, useState } from 'react';

// Aviso que some sozinho depois de alguns segundos. Avisos de erro ficam até a pessoa fechar.
export default function useAviso(duracao = 8000) {
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    if (!aviso || aviso.tipo === 'erro') return;
    const t = setTimeout(() => setAviso(null), duracao);
    return () => clearTimeout(t);
  }, [aviso, duracao]);

  return [aviso, setAviso];
}
