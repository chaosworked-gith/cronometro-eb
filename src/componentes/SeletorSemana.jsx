import { ChevronLeft, ChevronRight } from 'lucide-react';
import { rotuloSemana, somarDias } from '../lib/datas';

// segunda: "AAAA-MM-DD" da segunda-feira da semana (segunda a sábado)
export default function SeletorSemana({ segunda, aoMudar }) {
  return (
    <div className="seletor-periodo">
      <button type="button" className="btn-icone" onClick={() => aoMudar(somarDias(segunda, -7))} aria-label="Semana anterior">
        <ChevronLeft size={20} />
      </button>
      <strong>{rotuloSemana(segunda)}</strong>
      <button type="button" className="btn-icone" onClick={() => aoMudar(somarDias(segunda, 7))} aria-label="Próxima semana">
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
