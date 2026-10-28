import { CalendarCheck, Play } from 'lucide-react';
import EtiquetaSituacao from '../../componentes/EtiquetaSituacao';
import { urlMarca } from '../../lib/marca';
import { formatarHMS } from '../../lib/tempo';

const ORDEM = { em_andamento: 0, pausada: 1, concluida: 2 };

function ms(valor) {
  return valor?.toMillis?.() ?? 0;
}

export default function ListaHoje({ demandas, atualId, rodando, sessaoSeg, hojeSeg, hoje, aoRetomar, ocupado }) {
  const lista = [...demandas].sort(
    (a, b) => (ORDEM[a.status] ?? 3) - (ORDEM[b.status] ?? 3) || ms(b.atualizadoEm) - ms(a.atualizadoEm),
  );
  // Mascote do dia: alterna entre Ebinha e Ebinho
  const mascote = Number(hoje.slice(-2)) % 2 ? 'Ebinho' : 'Ebinha';

  return (
    <div className="cartao secao">
      <div className="secao-topo">
        <h2>
          <CalendarCheck size={20} aria-hidden="true" />
          Minhas demandas de hoje
        </h2>
        <span className="texto-secundario">
          Hoje <strong className="numero">{formatarHMS(hojeSeg)}</strong>
        </span>
      </div>

      {lista.length === 0 ? (
        <div className="vazio-mascote">
          <img src={urlMarca(`mascotes/Mascote_${mascote}.png`)} alt="" />
          <div>
            <strong>Seu dia ainda está em branco.</strong>
            <p>Bora dar o play na primeira demanda e colocar essa energia baiana para trabalhar!</p>
          </div>
        </div>
      ) : (
        <ul className="lista-hoje">
          {lista.map((d) => {
            const estaRodando = rodando && d.id === atualId;
            return (
              <li key={d.id} className={estaRodando ? 'rodando' : ''}>
                <div className="lista-hoje-texto">
                  <strong>{d.nome || 'Demanda sem nome'}</strong>
                  <span className="texto-secundario">{d.tipo}</span>
                </div>
                <span className="lista-hoje-tempo numero">
                  {formatarHMS((d.tempoGastoSeg ?? 0) + (estaRodando ? sessaoSeg : 0))}
                </span>
                <EtiquetaSituacao status={d.status} />
                {d.status === 'pausada' && (
                  <button type="button" className="btn btn-secundario btn-pequeno" onClick={() => aoRetomar(d)} disabled={ocupado}>
                    <Play size={16} />
                    Retomar
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
