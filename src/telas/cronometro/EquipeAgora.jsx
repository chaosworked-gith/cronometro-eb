import { Users } from 'lucide-react';
import { urlMarca } from '../../lib/marca';
import { formatarHMS } from '../../lib/tempo';
import { podeEscrever } from '../../permissoes';

// Quem está cronometrando qual demanda agora, e há quanto tempo (sessão atual), em tempo real
export default function EquipeAgora({ cronometros, demandasEmAndamento, membros, agora, emailProprio }) {
  const demandaPorId = new Map((demandasEmAndamento ?? []).map((d) => [d.id, d]));
  const nomePorEmail = new Map((membros ?? []).map((m) => [m.id, m.nome]));

  const rodando = (cronometros ?? [])
    .filter((c) => c.rodando && c.inicio && demandaPorId.has(c.demandaId))
    .map((c) => ({
      email: c.id,
      nome: nomePorEmail.get(c.id) ?? c.id.split('@')[0],
      demanda: demandaPorId.get(c.demandaId),
      segundos: Math.max(0, Math.round((agora - c.inicio.toMillis()) / 1000)),
    }))
    .sort((a, b) => b.segundos - a.segundos);

  const emailsRodando = new Set(rodando.map((r) => r.email));
  const parados = (membros ?? [])
    .filter((m) => m.ativo && podeEscrever(m.papel) && !emailsRodando.has(m.id))
    .map((m) => m.nome)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  return (
    <aside className="cartao secao equipe-agora" aria-label="Equipe agora">
      <div className="secao-topo">
        <h2>
          <Users size={20} aria-hidden="true" />
          Equipe agora
        </h2>
        {rodando.length > 0 && <span className="badge badge-azul">{rodando.length}</span>}
      </div>

      {!cronometros || !membros ? (
        <p className="vazio">Carregando...</p>
      ) : rodando.length === 0 ? (
        <p className="vazio">Ninguém cronometrando agora.</p>
      ) : (
        <ul className="lista-equipe">
          {rodando.map((r) => (
            <li key={r.email}>
              <img className="avatar" src={urlMarca('logos/Icone_Azul.png')} alt="" />
              <div className="equipe-texto">
                <strong>
                  {r.nome}
                  {r.email === emailProprio && <span className="etiqueta etiqueta-suave">Você</span>}
                </strong>
                <span className="equipe-demanda">{r.demanda.nome || 'Demanda sem nome'}</span>
                <span className="texto-secundario">{r.demanda.tipo}</span>
              </div>
              <span className="equipe-tempo numero" title="Tempo desta sessão">
                {formatarHMS(r.segundos)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {membros && parados.length > 0 && (
        <p className="texto-secundario equipe-parados">Sem cronômetro agora: {parados.join(', ')}.</p>
      )}
    </aside>
  );
}
