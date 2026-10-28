import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import Aviso from '../../componentes/Aviso';
import Modal from '../../componentes/Modal';
import { formatarData } from '../../lib/datas';
import { mensagemDeErro } from '../../lib/erros';
import { OPCOES_PUBLICO, OPCOES_SOLICITANTE } from '../../lib/regras';
import { formatarHMS, lerHMS } from '../../lib/tempo';

function Campo({ rotulo, children, ajuda, largo }) {
  return (
    <label className={`campo${largo ? ' campo-largo' : ''}`}>
      <span>{rotulo}</span>
      {children}
      {ajuda && <small className="ajuda">{ajuda}</small>}
    </label>
  );
}

function Opcoes({ valor, opcoes, aoMudar, vazio = 'Não informado' }) {
  return (
    <select value={valor ?? ''} onChange={(e) => aoMudar(e.target.value || null)}>
      <option value="">{vazio}</option>
      {valor && !opcoes.includes(valor) && <option value={valor}>{valor}</option>}
      {opcoes.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

// Edição de uma demanda. Tempo gasto só pode ser corrigido com a demanda parada.
export default function FormEditarDemanda({ demanda, tipos, responsaveis, onCancelar, onSalvar }) {
  const rodando = demanda.status === 'em_andamento';
  const [d, setD] = useState({
    nome: demanda.nome ?? '',
    tipo: demanda.tipo ?? '',
    publico: demanda.publico ?? null,
    solicitante: demanda.solicitante ?? null,
    usoIA: demanda.usoIA ?? null,
    usoTemplate: demanda.usoTemplate ?? null,
    dataSolicitacao: demanda.dataSolicitacao ?? '',
    dataEntrega: demanda.dataEntrega ?? '',
    datasAjuste: demanda.datasAjuste ?? [],
    mes: demanda.mes,
    responsavelEmail: demanda.responsavelEmail,
    status: demanda.status,
    tempoGasto: formatarHMS(demanda.tempoGastoSeg ?? 0),
    tempoMin: formatarHMS(demanda.tempoMinSeg),
    tempoMax: formatarHMS(demanda.tempoMaxSeg),
  });
  const [novoAjuste, setNovoAjuste] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const mudar = (campo) => (valor) => setD((atual) => ({ ...atual, [campo]: valor }));

  function adicionarAjuste() {
    if (!novoAjuste) return;
    setD((atual) => ({ ...atual, datasAjuste: [...new Set([...atual.datasAjuste, novoAjuste])].sort() }));
    setNovoAjuste('');
  }

  async function enviar(e) {
    e.preventDefault();
    const tempoGastoSeg = lerHMS(d.tempoGasto);
    const tempoMinSeg = d.tempoMin.trim() ? lerHMS(d.tempoMin) : null;
    const tempoMaxSeg = d.tempoMax.trim() ? lerHMS(d.tempoMax) : null;
    if (!d.nome.trim()) return setErro('Informe o nome da demanda.');
    if (!d.tipo) return setErro('Escolha o tipo.');
    if (tempoGastoSeg == null) return setErro('Tempo gasto inválido. Use HH:MM:SS, por exemplo 01:30:00.');
    if (d.tempoMin.trim() && tempoMinSeg == null) return setErro('Tempo mínimo inválido. Use HH:MM:SS.');
    if (d.tempoMax.trim() && tempoMaxSeg == null) return setErro('Tempo máximo inválido. Use HH:MM:SS.');
    if (!d.mes) return setErro('Informe o mês.');
    if (d.dataSolicitacao && d.dataEntrega && d.dataSolicitacao > d.dataEntrega) {
      return setErro('A data de solicitação não pode ser depois da entrega.');
    }

    const responsavel = responsaveis.find((r) => r.email === d.responsavelEmail);
    const dados = {
      nome: d.nome.trim(),
      tipo: d.tipo,
      publico: d.publico,
      solicitante: d.solicitante,
      usoIA: d.usoIA,
      usoTemplate: d.usoTemplate,
      dataSolicitacao: d.dataSolicitacao || null,
      dataEntrega: d.dataEntrega || null,
      datasAjuste: d.datasAjuste,
      mes: d.mes,
      responsavelEmail: d.responsavelEmail,
      responsavelNome: responsavel?.nome ?? demanda.responsavelNome,
      tempoMinSeg,
      tempoMaxSeg,
    };
    if (!rodando) {
      dados.tempoGastoSeg = tempoGastoSeg;
      dados.status = d.status;
    }

    setSalvando(true);
    setErro('');
    try {
      await onSalvar(dados);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
      setSalvando(false);
    }
  }

  const nomesTipos = tipos.map((t) => t.nome);

  return (
    <Modal titulo="Editar demanda" onFechar={onCancelar} largo>
      <form className="formulario" onSubmit={enviar} noValidate>
        <div className="campos-demanda">
          <Campo rotulo="Nome da demanda" largo>
            <input value={d.nome} onChange={(e) => mudar('nome')(e.target.value)} maxLength={160} autoFocus />
          </Campo>
          <Campo rotulo="Situação" ajuda={rodando ? 'Cronômetro rodando. Pause para mudar.' : null}>
            <select value={d.status} onChange={(e) => mudar('status')(e.target.value)} disabled={rodando}>
              {rodando && <option value="em_andamento">Em andamento</option>}
              <option value="pausada">Pausada</option>
              <option value="concluida">Concluída</option>
            </select>
          </Campo>
          <Campo rotulo="Tipo" largo>
            <Opcoes valor={d.tipo} opcoes={nomesTipos} aoMudar={mudar('tipo')} vazio="Escolha o tipo" />
          </Campo>
          <Campo rotulo="Público">
            <Opcoes valor={d.publico} opcoes={OPCOES_PUBLICO} aoMudar={mudar('publico')} />
          </Campo>
          <Campo rotulo="Uso de IA">
            <Opcoes valor={d.usoIA} opcoes={['Sim', 'Não']} aoMudar={mudar('usoIA')} />
          </Campo>
          <Campo rotulo="Uso de Template">
            <Opcoes valor={d.usoTemplate} opcoes={['Sim', 'Não']} aoMudar={mudar('usoTemplate')} />
          </Campo>
          <Campo rotulo="Solicitante">
            <Opcoes valor={d.solicitante} opcoes={OPCOES_SOLICITANTE} aoMudar={mudar('solicitante')} />
          </Campo>
          <Campo rotulo="Data de solicitação">
            <input type="date" value={d.dataSolicitacao} onChange={(e) => mudar('dataSolicitacao')(e.target.value)} />
          </Campo>
          <Campo rotulo="Data de entrega">
            <input type="date" value={d.dataEntrega} onChange={(e) => mudar('dataEntrega')(e.target.value)} />
          </Campo>
          <Campo rotulo="Mês" ajuda="Mudar o mês ou o responsável renumera o Nº.">
            <input type="month" value={d.mes} onChange={(e) => mudar('mes')(e.target.value)} />
          </Campo>
          <Campo rotulo="Tempo gasto" ajuda={rodando ? 'Pause a demanda para corrigir o tempo.' : null}>
            <input value={d.tempoGasto} onChange={(e) => mudar('tempoGasto')(e.target.value)} disabled={rodando} placeholder="00:00:00" />
          </Campo>
          <Campo rotulo="Tempo mínimo sem IA">
            <input value={d.tempoMin} onChange={(e) => mudar('tempoMin')(e.target.value)} placeholder="00:30:00" />
          </Campo>
          <Campo rotulo="Tempo máximo sem IA">
            <input value={d.tempoMax} onChange={(e) => mudar('tempoMax')(e.target.value)} placeholder="02:00:00" />
          </Campo>
          <Campo rotulo="Responsável">
            <select value={d.responsavelEmail} onChange={(e) => mudar('responsavelEmail')(e.target.value)}>
              {!responsaveis.some((r) => r.email === d.responsavelEmail) && (
                <option value={d.responsavelEmail}>{demanda.responsavelNome}</option>
              )}
              {responsaveis.map((r) => (
                <option key={r.email} value={r.email}>
                  {r.nome}
                </option>
              ))}
            </select>
          </Campo>
          <div className="campo campo-largo">
            <span>Datas de ajuste</span>
            <div className="ajustes">
              {d.datasAjuste.map((data) => (
                <span key={data} className="pilula pilula-ajuste">
                  {formatarData(data)}
                  <button
                    type="button"
                    className="btn-icone"
                    aria-label={`Remover ${formatarData(data)}`}
                    onClick={() => mudar('datasAjuste')(d.datasAjuste.filter((x) => x !== data))}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
              <span className="ajuste-novo">
                <input type="date" value={novoAjuste} onChange={(e) => setNovoAjuste(e.target.value)} aria-label="Nova data de ajuste" />
                <button type="button" className="btn btn-secundario btn-pequeno" onClick={adicionarAjuste} disabled={!novoAjuste}>
                  <Plus size={16} />
                  Adicionar
                </button>
              </span>
            </div>
          </div>
        </div>
        <p className="texto-secundario">Tempo economizado e prazo cumprido são recalculados ao salvar.</p>
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        <div className="modal-acoes">
          <button type="button" className="btn btn-secundario" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primario" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
