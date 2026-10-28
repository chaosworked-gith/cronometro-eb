import { useMemo, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import Aviso from '../../componentes/Aviso';
import EtiquetaSituacao from '../../componentes/EtiquetaSituacao';
import { OPCOES_PUBLICO, OPCOES_SOLICITANTE } from '../../lib/regras';
import { formatarHMS } from '../../lib/tempo';
import { normalizar } from '../../lib/texto';

function Alternador({ rotulo, nome, valor, aoMudar }) {
  return (
    <fieldset className="campo alternador">
      <legend>{rotulo}</legend>
      <div className="alternador-opcoes">
        {['Sim', 'Não'].map((opcao) => (
          <label key={opcao} className={valor === opcao ? 'ativo' : ''}>
            <input type="radio" name={nome} value={opcao} checked={valor === opcao} onChange={() => aoMudar(opcao)} className="sr-only" />
            {opcao}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Selecao({ rotulo, valor, opcoes, aoMudar, vazio, ajuda }) {
  const fora = valor && !opcoes.includes(valor);
  return (
    <label className="campo">
      <span>{rotulo}</span>
      <select value={valor} onChange={(e) => aoMudar(e.target.value)}>
        {!valor && <option value="">{vazio}</option>}
        {fora && <option value={valor}>{valor} (não cadastrado)</option>}
        {opcoes.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {ajuda && <small className="ajuda">{ajuda}</small>}
    </label>
  );
}

// Campo do nome com busca nas demandas em aberto da pessoa (para retomar em vez de criar outra)
// e, para nome novo, os campos preenchidos sozinhos que a pessoa pode alterar.
export default function FormDemanda({ nome, aoMudarNome, abertas, escolhida, aoEscolher, exata, nova, manual, aoMudarCampo, tipos }) {
  const [listaAberta, setListaAberta] = useState(false);
  const [destaque, setDestaque] = useState(0);

  const opcoes = useMemo(() => {
    const busca = normalizar(nome);
    return abertas.filter((d) => normalizar(d.nome).includes(busca)).slice(0, 6);
  }, [abertas, nome]);
  const mostrarLista = listaAberta && opcoes.length > 0;

  function escolher(demanda) {
    aoEscolher(demanda);
    setListaAberta(false);
  }

  function teclar(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setListaAberta(true);
      setDestaque((i) => Math.min(i + 1, opcoes.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setDestaque((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && mostrarLista && opcoes[destaque]) {
      e.preventDefault();
      escolher(opcoes[destaque]);
    } else if (e.key === 'Escape') {
      setListaAberta(false);
    }
  }

  const retomar = escolhida ?? exata;
  if (escolhida) {
    return (
      <div className="retomar">
        <div>
          <span className="retomar-rotulo">Retomar</span>
          <strong>{escolhida.nome || 'Demanda sem nome'}</strong>
          <span className="texto-secundario">
            {escolhida.tipo} · <span className="numero">{formatarHMS(escolhida.tempoGastoSeg)}</span> registrados
          </span>
        </div>
        <EtiquetaSituacao status={escolhida.status} />
        <button type="button" className="btn btn-secundario btn-pequeno" onClick={() => aoEscolher(null)}>
          <X size={16} />
          Trocar
        </button>
      </div>
    );
  }

  const { dados, palavraSugerida, regra } = nova;
  const nomesDeTipos = tipos.map((t) => t.nome);

  return (
    <div className="form-demanda">
      <div className="combo">
        <label className="campo" htmlFor="nome-demanda">
          <span>Nome da demanda</span>
        </label>
        <input
          id="nome-demanda"
          className="combo-campo"
          role="combobox"
          aria-expanded={mostrarLista}
          aria-controls="demandas-em-aberto"
          aria-autocomplete="list"
          autoComplete="off"
          value={nome}
          placeholder="Ex.: Carrossel Dia do Eletricista"
          maxLength={160}
          onChange={(e) => {
            aoMudarNome(e.target.value);
            setListaAberta(true);
            setDestaque(0);
          }}
          onFocus={() => setListaAberta(true)}
          onBlur={() => setListaAberta(false)}
          onKeyDown={teclar}
        />
        {mostrarLista && (
          <ul className="combo-lista" role="listbox" id="demandas-em-aberto">
            <li className="combo-titulo" role="presentation">
              Em aberto: retome em vez de criar outra
            </li>
            {opcoes.map((d, i) => (
              <li
                key={d.id}
                role="option"
                aria-selected={i === destaque}
                className={`combo-opcao${i === destaque ? ' destaque' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  escolher(d);
                }}
                onMouseEnter={() => setDestaque(i)}
              >
                <span className="combo-texto">
                  <strong>{d.nome || 'Demanda sem nome'}</strong>
                  <span className="texto-secundario">
                    {d.tipo} · <span className="numero">{formatarHMS(d.tempoGastoSeg)}</span>
                  </span>
                </span>
                <EtiquetaSituacao status={d.status} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {retomar && (
        <Aviso tipo="info">
          Já existe em aberto a demanda "{retomar.nome}". O Iniciar vai retomá-la, sem criar outra.
        </Aviso>
      )}

      {nome.trim() && !retomar && (
        <>
          {regra && (
            <p className="regra-aplicada">
              <Sparkles size={16} aria-hidden="true" />
              Regra {regra.regra === 'Reunião de Setor' ? 'da Reunião de Setor' : `do ${regra.regra}`}: Uso de IA {regra.usoIA}, Template{' '}
              {regra.usoTemplate}, Solicitante {regra.solicitante}.
            </p>
          )}
          <div className="campos-demanda">
            <div className="campo-largo">
              <Selecao
                rotulo="Tipo"
                valor={dados.tipo}
                opcoes={nomesDeTipos}
                vazio="Escolha o tipo"
                aoMudar={(v) => aoMudarCampo('tipo', v)}
                ajuda={palavraSugerida ? `Sugerido pela palavra-chave "${palavraSugerida.palavra}".` : null}
              />
            </div>
            <Selecao
              rotulo="Público"
              valor={dados.publico}
              opcoes={OPCOES_PUBLICO}
              vazio="Escolha o público"
              aoMudar={(v) => aoMudarCampo('publico', v)}
            />
            <Alternador rotulo="Uso de IA" nome="uso-ia" valor={dados.usoIA} aoMudar={(v) => aoMudarCampo('usoIA', v)} />
            <Alternador rotulo="Uso de Template" nome="uso-template" valor={dados.usoTemplate} aoMudar={(v) => aoMudarCampo('usoTemplate', v)} />
            <Selecao
              rotulo="Solicitante"
              valor={dados.solicitante}
              opcoes={OPCOES_SOLICITANTE}
              vazio="Escolha o solicitante"
              aoMudar={(v) => aoMudarCampo('solicitante', v)}
            />
            <label className="campo">
              <span>Data de solicitação</span>
              <input type="date" value={dados.dataSolicitacao} onChange={(e) => aoMudarCampo('dataSolicitacao', e.target.value)} />
            </label>
            <p className="estimativa campo-largo">
              {dados.tempoMinSeg != null
                ? `Estimativa sem IA para este tipo: ${formatarHMS(dados.tempoMinSeg)} a ${formatarHMS(dados.tempoMaxSeg)}.`
                : 'Este tipo não tem tempo estimado na tabela.'}
            </p>
          </div>
          {Object.keys(manual).length > 0 && (
            <button type="button" className="btn btn-link" onClick={() => aoMudarCampo(null)}>
              Voltar aos valores sugeridos
            </button>
          )}
        </>
      )}
    </div>
  );
}
