import { formatarHMS } from '../lib/tempo';

// Cartões com o gradiente principal, números em Klavika Bold (ou Lato Black) e texto branco
// variante "apresentacao": cartões translúcidos sobre o gradiente premium do modo apresentação
export default function CartoesResumo({ resumo, rotuloHoras = 'Total de horas', variante }) {
  const cartoes = [
    { rotulo: rotuloHoras, valor: formatarHMS(resumo.totalSeg) },
    { rotulo: 'Demandas', valor: resumo.quantidade },
    {
      rotulo: 'Tempo economizado com IA',
      valor: formatarHMS(resumo.economizadoIAMinSeg),
      detalhe: `até ${formatarHMS(resumo.economizadoIAMaxSeg)}`,
    },
    { rotulo: 'Demandas com IA', valor: `${resumo.percentualIA}%` },
  ];
  return (
    <div className={`cartoes-resumo${variante ? ` cartoes-${variante}` : ''}`}>
      {cartoes.map((c) => (
        <div key={c.rotulo} className="cartao-resumo">
          <span className="cartao-resumo-rotulo">{c.rotulo}</span>
          <strong className="cartao-resumo-valor numero">{c.valor}</strong>
          {c.detalhe && <span className="cartao-resumo-detalhe numero">{c.detalhe}</span>}
        </div>
      ))}
    </div>
  );
}
