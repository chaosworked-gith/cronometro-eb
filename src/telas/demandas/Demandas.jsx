import { useMemo, useState } from 'react';
import { Combine, ListChecks, Pencil, Search, Trash2, TriangleAlert } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import Aviso from '../../componentes/Aviso';
import Carregando from '../../componentes/Carregando';
import Confirmar from '../../componentes/Confirmar';
import EtiquetaSituacao from '../../componentes/EtiquetaSituacao';
import Modal from '../../componentes/Modal';
import SeletorMes from '../../componentes/SeletorMes';
import useAviso from '../../hooks/useAviso';
import useColecao from '../../hooks/useColecao';
import useConsulta from '../../hooks/useConsulta';
import { COLUNAS_DEMANDA, camposFaltando } from '../../lib/colunas';
import { diaISO, formatarAjuste, formatarData, rotuloMes } from '../../lib/datas';
import { mensagemDeErro } from '../../lib/erros';
import { OPCOES_PUBLICO, OPCOES_SOLICITANTE } from '../../lib/regras';
import { formatarHMS } from '../../lib/tempo';
import { normalizar, ordenarPorTexto } from '../../lib/texto';
import { podeEscrever } from '../../permissoes';
import FormEditarDemanda from './FormEditarDemanda';
import { excluir, juntar, previaJuncao, salvarEdicao } from './operacoes';

const ordenarTipos = ordenarPorTexto('nome');
const CAMPOS_OBRIGATORIOS = new Set(['usoIA', 'usoTemplate', 'solicitante']);

function Filtro({ rotulo, valor, aoMudar, opcoes, todos }) {
  return (
    <label className="campo filtro">
      <span>{rotulo}</span>
      <select value={valor} onChange={(e) => aoMudar(e.target.value)}>
        <option value="">{todos}</option>
        {opcoes.map((o) => (
          <option key={o.valor ?? o} value={o.valor ?? o}>
            {o.rotulo ?? o}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function Demandas() {
  const { perfil } = useAuth();
  const editor = podeEscrever(perfil.papel);
  const admin = perfil.papel === 'admin';

  const [mes, setMes] = useState(() => diaISO().slice(0, 7));
  const consulta = useConsulta('demandas', [['mes', '==', mes]]);
  const membros = useColecao('membros', ordenarPorTexto('nome'));
  const tipos = useColecao('tipos', ordenarTipos);

  const [filtros, setFiltros] = useState({ responsavel: '', tipo: '', publico: '', solicitante: '', busca: '' });
  const [soFaltando, setSoFaltando] = useState(false);
  const [selecionadas, setSelecionadas] = useState([]);
  const [janela, setJanela] = useState(null);
  const [aviso, setAviso] = useAviso();
  const filtrar = (campo) => (valor) => setFiltros((f) => ({ ...f, [campo]: valor }));

  const demandas = useMemo(
    () =>
      [...(consulta.itens ?? [])].sort(
        (a, b) => (a.responsavelNome ?? '').localeCompare(b.responsavelNome ?? '', 'pt-BR') || (a.numero ?? 0) - (b.numero ?? 0),
      ),
    [consulta.itens],
  );

  const responsaveis = useMemo(() => {
    const mapa = new Map((membros.itens ?? []).filter((m) => m.ativo && podeEscrever(m.papel)).map((m) => [m.id, m.nome]));
    for (const d of demandas) if (!mapa.has(d.responsavelEmail)) mapa.set(d.responsavelEmail, d.responsavelNome);
    return [...mapa].map(([email, nome]) => ({ email, nome })).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [membros.itens, demandas]);

  const tiposDoMes = [...new Set(demandas.map((d) => d.tipo).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const busca = normalizar(filtros.busca);
  const visiveis = demandas.filter(
    (d) =>
      (!filtros.responsavel || d.responsavelEmail === filtros.responsavel) &&
      (!filtros.tipo || d.tipo === filtros.tipo) &&
      (!filtros.publico || d.publico === filtros.publico) &&
      (!filtros.solicitante || d.solicitante === filtros.solicitante) &&
      (!busca || normalizar(d.nome).includes(busca)) &&
      (!soFaltando || camposFaltando(d).length > 0),
  );
  const comFalta = demandas.filter((d) => camposFaltando(d).length > 0).length;
  const totalSeg = visiveis.reduce((s, d) => s + (d.tempoGastoSeg ?? 0), 0);
  const escolhidas = selecionadas.map((id) => demandas.find((d) => d.id === id)).filter(Boolean);

  function concluir(texto) {
    setJanela(null);
    setSelecionadas([]);
    setAviso({ tipo: 'sucesso', texto });
  }

  function alternarSelecao(id) {
    setSelecionadas((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual.slice(-1), id]));
  }

  function mudarMes(novo) {
    setMes(novo);
    setSelecionadas([]);
  }

  return (
    <section className="pagina">
      <div className="pagina-topo">
        <div>
          <h1 className="titulo-pagina">Demandas</h1>
          <p className="subtitulo">Todas as demandas do mês, nas mesmas colunas da planilha.</p>
        </div>
        <SeletorMes mes={mes} aoMudar={mudarMes} />
      </div>

      {aviso && (
        <Aviso tipo={aviso.tipo} onFechar={() => setAviso(null)}>
          {aviso.texto}
        </Aviso>
      )}

      <div className="cartao secao">
        <div className="filtros">
          <Filtro
            rotulo="Responsável"
            valor={filtros.responsavel}
            aoMudar={filtrar('responsavel')}
            todos="Todos"
            opcoes={responsaveis.map((r) => ({ valor: r.email, rotulo: r.nome }))}
          />
          <Filtro rotulo="Tipo" valor={filtros.tipo} aoMudar={filtrar('tipo')} todos="Todos" opcoes={tiposDoMes} />
          <Filtro rotulo="Público" valor={filtros.publico} aoMudar={filtrar('publico')} todos="Todos" opcoes={OPCOES_PUBLICO} />
          <Filtro rotulo="Solicitante" valor={filtros.solicitante} aoMudar={filtrar('solicitante')} todos="Todos" opcoes={OPCOES_SOLICITANTE} />
          <label className="campo filtro filtro-busca">
            <span>Buscar pelo nome</span>
            <span className="busca">
              <Search size={16} aria-hidden="true" />
              <input type="search" value={filtros.busca} onChange={(e) => filtrar('busca')(e.target.value)} placeholder="Nome da demanda" />
            </span>
          </label>
        </div>

        {comFalta > 0 && (
          <div className="aviso aviso-erro aviso-faltando">
            <TriangleAlert size={20} className="aviso-icone" aria-hidden="true" />
            <div className="aviso-texto">
              {comFalta === 1 ? '1 demanda' : `${comFalta} demandas`} de {rotuloMes(mes)} sem Uso de IA, Template ou
              Solicitante.
            </div>
            <button type="button" className="btn btn-perigo btn-pequeno" onClick={() => setSoFaltando((v) => !v)}>
              {soFaltando ? 'Mostrar todas' : 'Mostrar só essas'}
            </button>
          </div>
        )}

        <div className="tabela-resumo">
          <span className="texto-secundario">
            {visiveis.length} de {demandas.length} demandas · Tempo gasto{' '}
            <strong className="numero">{formatarHMS(totalSeg)}</strong>
          </span>
          {admin && (
            <span className="juntar-barra">
              <span className="texto-secundario">
                {escolhidas.length === 2 ? '2 demandas marcadas' : 'Marque 2 demandas repetidas para juntar'}
              </span>
              <button
                type="button"
                className="btn btn-secundario btn-pequeno"
                disabled={escolhidas.length !== 2}
                onClick={() => setJanela({ tipo: 'juntar' })}
              >
                <Combine size={16} />
                Juntar
              </button>
            </span>
          )}
        </div>

        {consulta.erro ? (
          <Aviso tipo="erro">Não foi possível carregar as demandas. Verifique a conexão.</Aviso>
        ) : !consulta.itens ? (
          <Carregando />
        ) : !visiveis.length ? (
          <p className="vazio">
            <ListChecks size={18} aria-hidden="true" /> Nenhuma demanda {demandas.length ? 'com esses filtros' : `em ${rotuloMes(mes)}`}.
          </p>
        ) : (
          <div className="tabela-moldura tabela-rolagem">
            <table className="tabela tabela-responsiva tabela-demandas">
              <thead>
                <tr>
                  {admin && (
                    <th className="celula-check">
                      <span className="sr-only">Marcar</span>
                    </th>
                  )}
                  <th>Situação</th>
                  <th>Responsável</th>
                  {COLUNAS_DEMANDA.map((c) => (
                    <th key={c.id} className={c.tempo || c.numero ? 'direita' : ''}>
                      {c.titulo}
                    </th>
                  ))}
                  {editor && (
                    <th>
                      <span className="sr-only">Ações</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {visiveis.map((d) => {
                  const falta = camposFaltando(d);
                  return (
                    <tr key={d.id} className={falta.length ? 'linha-alerta' : ''}>
                      {admin && (
                        <td className="celula-check">
                          <input
                            type="checkbox"
                            checked={selecionadas.includes(d.id)}
                            onChange={() => alternarSelecao(d.id)}
                            aria-label={`Marcar ${d.nome || 'demanda sem nome'}`}
                          />
                        </td>
                      )}
                      <td data-rotulo="Situação">
                        <EtiquetaSituacao status={d.status} />
                      </td>
                      <td data-rotulo="Responsável">{d.responsavelNome}</td>
                      {COLUNAS_DEMANDA.map((c) => {
                        const valor = c.valor(d);
                        const vazioObrigatorio = CAMPOS_OBRIGATORIOS.has(c.id) && !valor;
                        return (
                          <td
                            key={c.id}
                            data-rotulo={c.titulo}
                            className={[c.tempo || c.numero ? 'direita numero' : '', c.id === 'nome' ? 'celula-titulo' : ''].join(' ')}
                          >
                            {vazioObrigatorio ? <span className="texto-alerta">Falta</span> : c.id === 'nome' ? <strong>{valor || 'Sem nome'}</strong> : valor}
                          </td>
                        );
                      })}
                      {editor && (
                        <td className="celula-acoes">
                          <button type="button" className="btn btn-secundario btn-pequeno" onClick={() => setJanela({ tipo: 'editar', demanda: d })}>
                            <Pencil size={16} />
                            Editar
                          </button>
                          {admin && (
                            <button type="button" className="btn btn-perigo btn-pequeno" onClick={() => setJanela({ tipo: 'excluir', demanda: d })}>
                              <Trash2 size={16} />
                              Excluir
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {janela?.tipo === 'editar' && (
        <FormEditarDemanda
          demanda={janela.demanda}
          tipos={tipos.itens ?? []}
          responsaveis={responsaveis}
          onCancelar={() => setJanela(null)}
          onSalvar={async (dados) => {
            await salvarEdicao(janela.demanda, dados);
            concluir(`Demanda "${dados.nome}" atualizada.`);
          }}
        />
      )}
      {janela?.tipo === 'excluir' && (
        <Confirmar
          titulo="Excluir demanda"
          rotuloConfirmar="Excluir"
          perigo
          onCancelar={() => setJanela(null)}
          onConfirmar={async () => {
            await excluir(janela.demanda);
            concluir(`Demanda "${janela.demanda.nome || 'sem nome'}" excluída.`);
          }}
        >
          <p>
            Excluir <strong>{janela.demanda.nome || 'a demanda sem nome'}</strong> ({janela.demanda.responsavelNome}, Nº{' '}
            {janela.demanda.numero})? Não dá para desfazer.
          </p>
          <p className="texto-secundario">O Nº das outras demandas desse mês e dessa pessoa é renumerado.</p>
        </Confirmar>
      )}
      {janela?.tipo === 'juntar' && escolhidas.length === 2 && (
        <JanelaJuntar
          demandas={escolhidas}
          onCancelar={() => setJanela(null)}
          onJuntar={async (principal, outra) => {
            await juntar(principal, outra);
            concluir(`Demandas juntadas em "${principal.nome || 'sem nome'}".`);
          }}
        />
      )}
    </section>
  );
}

function JanelaJuntar({ demandas, onCancelar, onJuntar }) {
  const [principalId, setPrincipalId] = useState(demandas[0].id);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const principal = demandas.find((d) => d.id === principalId);
  const outra = demandas.find((d) => d.id !== principalId);
  const rodando = demandas.some((d) => d.status === 'em_andamento');
  const final = previaJuncao(principal, outra);

  async function confirmar() {
    setSalvando(true);
    setErro('');
    try {
      await onJuntar(principal, outra);
    } catch (e) {
      setErro(mensagemDeErro(e));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Juntar demandas repetidas" onFechar={onCancelar}>
      <div className="modal-corpo">
        <p>Qual demanda fica? Os outros campos (tipo, público, solicitante e usos) vêm dela.</p>
        {demandas.map((d) => (
          <label key={d.id} className={`opcao-juntar${d.id === principalId ? ' ativa' : ''}`}>
            <input type="radio" name="principal" checked={d.id === principalId} onChange={() => setPrincipalId(d.id)} />
            <span>
              <strong>{d.nome || 'Sem nome'}</strong>
              <span className="texto-secundario">
                {d.responsavelNome} · Nº {d.numero} · <span className="numero">{formatarHMS(d.tempoGastoSeg)}</span> · entrega{' '}
                {formatarData(d.dataEntrega)}
              </span>
            </span>
          </label>
        ))}
        <div className="previa-juncao">
          <span>
            Tempo somado <strong className="numero">{formatarHMS(final.tempoGastoSeg)}</strong>
          </span>
          <span>
            Entrega <strong>{formatarData(final.dataEntrega)}</strong>
          </span>
          <span>
            Ajustes <strong>{formatarAjuste(final.datasAjuste) || 'nenhum'}</strong>
          </span>
        </div>
        <p className="texto-secundario">"{outra.nome || 'Sem nome'}" será excluída e o Nº do mês é renumerado.</p>
      </div>
      {rodando && <Aviso tipo="erro">Uma delas está com o cronômetro rodando. Pause antes de juntar.</Aviso>}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <div className="modal-acoes">
        <button type="button" className="btn btn-secundario" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="button" className="btn btn-primario" onClick={confirmar} disabled={salvando || rodando}>
          <Combine size={18} />
          {salvando ? 'Juntando...' : 'Juntar'}
        </button>
      </div>
    </Modal>
  );
}
