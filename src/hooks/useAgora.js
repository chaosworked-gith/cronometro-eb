import { useEffect, useState } from 'react';

// Hora atual em milissegundos, atualizada a cada segundo (para os cronômetros na tela).
export default function useAgora(intervalo = 1000) {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), intervalo);
    return () => clearInterval(t);
  }, [intervalo]);

  return agora;
}
