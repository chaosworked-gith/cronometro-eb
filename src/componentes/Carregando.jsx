import { LoaderCircle } from 'lucide-react';

export default function Carregando({ texto = 'Carregando...' }) {
  return (
    <div className="carregando" role="status">
      <LoaderCircle size={20} className="girando" aria-hidden="true" />
      <span>{texto}</span>
    </div>
  );
}
