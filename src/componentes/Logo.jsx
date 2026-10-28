import { useState } from 'react';

// Usa public/logo.svg. Enquanto o arquivo não existir, mostra o nome da empresa.
export default function Logo({ className = '' }) {
  const [semArquivo, setSemArquivo] = useState(false);

  if (semArquivo) return <span className={`logo-texto ${className}`}>Elétrica Bahiana</span>;

  return (
    <img
      src={`${import.meta.env.BASE_URL}logo.svg`}
      alt="Elétrica Bahiana"
      className={className}
      onError={() => setSemArquivo(true)}
    />
  );
}
