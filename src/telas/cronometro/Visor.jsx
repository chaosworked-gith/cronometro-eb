import { formatarHMS } from '../../lib/tempo';

// Números grandes em Klavika Bold (ou Lato Black) sobre o gradiente principal com o Pattern_EB
export default function Visor({ atual, rodando, totalSeg, sessaoSeg, hojeSeg, carregando }) {
  let estado = 'Pronto para começar';
  if (carregando) estado = 'Carregando...';
  else if (rodando) estado = 'Rodando';
  else if (atual) estado = 'Pausado';

  return (
    <>
      <div className={`visor${rodando ? ' rodando' : ''}`}>
        <div className="visor-topo">
          <span className="visor-estado" role="status">
            {rodando && <span className="visor-pulso" aria-hidden="true" />}
            {estado}
          </span>
          <span className="visor-hoje">
            Hoje <strong className="numero">{formatarHMS(hojeSeg)}</strong>
          </span>
        </div>
        <p className="visor-nome">{atual ? atual.nome || 'Demanda sem nome' : 'Escolha ou crie uma demanda abaixo'}</p>
        {atual?.tipo && <p className="visor-tipo">{atual.tipo}</p>}
        <div className="visor-tempo numero">{formatarHMS(totalSeg)}</div>
        <p className="visor-sessao">{rodando ? `Nesta sessão ${formatarHMS(sessaoSeg)}` : ' '}</p>
      </div>
      <div className={`circuito${rodando ? ' ligado' : ''}`} aria-hidden="true" />
    </>
  );
}
