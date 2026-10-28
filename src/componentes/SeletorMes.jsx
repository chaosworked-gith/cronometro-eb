import { ChevronLeft, ChevronRight } from 'lucide-react';
import { rotuloMes, somarMeses } from '../lib/datas';

export default function SeletorMes({ mes, aoMudar }) {
  return (
    <div className="seletor-periodo">
      <button type="button" className="btn-icone" onClick={() => aoMudar(somarMeses(mes, -1))} aria-label="Mês anterior">
        <ChevronLeft size={20} />
      </button>
      <strong>{rotuloMes(mes)}</strong>
      <button type="button" className="btn-icone" onClick={() => aoMudar(somarMeses(mes, 1))} aria-label="Próximo mês">
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
