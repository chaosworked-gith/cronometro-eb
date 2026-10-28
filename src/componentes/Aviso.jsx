import { Check, Info, TriangleAlert, X } from 'lucide-react';

const ICONES = { erro: TriangleAlert, info: Info, sucesso: Check };

export default function Aviso({ tipo = 'info', icone, onFechar, children }) {
  const Icone = icone ?? ICONES[tipo];
  return (
    <div className={`aviso aviso-${tipo}`} role={tipo === 'erro' ? 'alert' : 'status'}>
      <Icone size={20} className="aviso-icone" aria-hidden="true" />
      <div className="aviso-texto">{children}</div>
      {onFechar && (
        <button type="button" className="btn-icone" onClick={onFechar} aria-label="Fechar aviso">
          <X size={18} />
        </button>
      )}
    </div>
  );
}
