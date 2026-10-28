import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ titulo, onFechar, children }) {
  useEffect(() => {
    function tecla(e) {
      if (e.key === 'Escape') onFechar();
    }
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [onFechar]);

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="janela modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
        <div className="modal-topo">
          <h2 id="modal-titulo">{titulo}</h2>
          <button type="button" className="btn-icone" onClick={onFechar} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
