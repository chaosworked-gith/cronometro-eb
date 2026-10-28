import { useMemo, useState } from 'react';
import { CircleCheck, Pause, Play, Plus, Utensils } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import Aviso from '../../componentes/Aviso';
import useAgora from '../../hooks/useAgora';
import useAviso from '../../hooks/useAviso';
import useColecao from '../../hooks/useColecao';
import useConsulta from '../../hooks/useConsulta';
import useDocumento from '../../hooks/useDocumento';
import { diaISO } from '../../lib/datas';
import { mensagemDeErro } from '../../lib/erros';
import { ehAlmoco } from '../../lib/regras';
import { formatarHMS } from '../../lib/tempo';
import { normalizar, ordenarPorTexto } from '../../lib/texto';
import { concluir, iniciarAlmoco, iniciarExistente, iniciarNova, pausar } from './acoes';
import EquipeAgora from './EquipeAgora';
import FormDemanda from './FormDemanda';
import ListaHoje from './ListaHoje';
import { montarNovaDemanda, validarNovaDemanda } from './novaDemanda';
import Visor from './Visor';

const ordenarTipos = ordenarPorTexto('nome');

function segundosHoje(demandas, hoje) {
  return demandas.reduce(
    (soma, d) => soma + (d.sessoes ?? []).filter((s) => diaISO(s.inicio) === hoje).reduce((t, s) => t + (s.seg ?? 0), 0),
    0,
  );
}

// O tempo corre a partir do "inicio" salvo em cronometros/{email}: fechar a aba ou trocar de
// computador não perde nada. Cada pessoa tem um cronômetro só.
export default function MeuCronometro() {
  const { perfil } = useAuth();
  const email = perfil.email;
  const agora = useAgora();
  const hoje = diaISO(agora);

  const { dado: cronometro } = useDocumento('cronometros', email);
  const emAndamento = useConsulta('demandas', [['status', '==', 'em_andamento']]);
  const pausadas = useConsulta('demandas', [['responsavelEmail', '==', email], ['status', '==', 'pausada']]);
  const deHoje = useConsulta('demandas', [['responsavelEmail', '==', email], ['dataEntrega', '==', hoje]]);
  const cronometros = useColecao('cronometros');
  const membros = useColecao('membros');
  const tipos = useColecao('tipos', ordenarTipos);
  const palavras = useColecao('palavrasChave');

  const [nome, setNome] = useState('');
  const [manual, setManual] = useState({});
  const [escolhidaId, setEscolhidaId] = useState(null);
  const [trocando, setTrocando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useAviso();

  const carregando = cronometro === undefined || !emAndamento.itens || !pausadas.itens;

  const abertas = useMemo(
    () => [...(emAndamento.itens ?? []).filter((d) => d.responsavelEmail === email), ...(pausadas.itens ?? [])],
    [emAndamento.itens, pausadas.itens, email],
  );

  const atual = (cronometro?.demandaId && abertas.find((d) => d.id === cronometro.demandaId)) || null;
  const rodando = !!(cronometro?.rodando && cronometro.inicio && atual);
  const sessaoSeg = rodando ? Math.max(0, Math.round((agora - cronometro.inicio.toMillis()) / 1000)) : 0;
  const totalSeg = (atual?.tempoGastoSeg ?? 0) + sessaoSeg;
  const hojeSeg =
    segundosHoje(deHoje.itens ?? [], hoje) + (rodando && diaISO(cronometro.inicio) === hoje ? sessaoSeg : 0);

  // Formulário para começar outra demanda (sempre aberto quando não há demanda atual)
  const formVisivel = !atual || trocando;
  const outrasAbertas = abertas.filter((d) => d.id !== atual?.id);
  const escolhida = outrasAbertas.find((d) => d.id === escolhidaId) ?? null;
  const exata = !escolhida && nome.trim() ? outrasAbertas.find((d) => normalizar(d.nome) === normalizar(nome)) ?? null : null;
  const nova = montarNovaDemanda({ nome, manual, tipos: tipos.itens ?? [], palavras: palavras.itens ?? [], hoje });
  const alvo = formVisivel ? escolhida ?? exata ?? (nome.trim() ? 'nova' : null) : null;

  const livre = !carregando && !ocupado;
  const podeIniciar = livre && (alvo != null || (atual && !rodando));
  const almocoRodando = rodando && ehAlmoco(atual.tipo);

  let legenda = '';
  if (alvo === 'nova') legenda = `Iniciar cria a demanda "${nova.dados.nome}"`;
  else if (alvo) legenda = `Iniciar retoma "${alvo.nome}"`;
  else if (atual && !rodando) legenda = `Iniciar retoma "${atual.nome}"`;
  if (legenda && alvo && rodando) legenda += almocoRodando ? ' e conclui o almoço' : ` e pausa "${atual.nome}"`;

  const ctx = { email, nome: perfil.nome, cronometro, atual };

  // sucesso: texto do aviso, ou função que recebe o resultado da ação e devolve o texto
  async function executar(acao, sucesso) {
    setOcupado(true);
    try {
      const resultado = await acao();
      if (sucesso) setAviso({ tipo: 'sucesso', texto: typeof sucesso === 'function' ? sucesso(resultado) : sucesso });
      return true;
    } catch (e) {
      setAviso({ tipo: 'erro', texto: mensagemDeErro(e) });
      return false;
    } finally {
      setOcupado(false);
    }
  }

  function limparForm() {
    setNome('');
    setManual({});
    setEscolhidaId(null);
    setTrocando(false);
  }

  async function clicarIniciar() {
    if (alvo === 'nova') {
      const erro = validarNovaDemanda(nova.dados, hoje);
      if (erro) {
        setAviso({ tipo: 'erro', texto: erro });
        return;
      }
      if (await executar(() => iniciarNova(nova.dados, ctx))) limparForm();
    } else if (alvo) {
      if (await executar(() => iniciarExistente(alvo, ctx))) limparForm();
    } else if (atual && !rodando) {
      await executar(() => iniciarExistente(atual, ctx));
    }
  }

  function clicarConcluir() {
    const nomeAtual = atual.nome || 'Demanda sem nome';
    executar(
      () => concluir(ctx),
      (total) => `"${nomeAtual}" concluída com ${formatarHMS(total)}. Mais forte por você!`,
    );
  }

  function clicarAlmoco() {
    executar(
      () => iniciarAlmoco(ctx, tipos.itens ?? []),
      'Bom almoço! Na volta, é só iniciar a próxima demanda ou concluir o almoço.',
    );
  }

  function mudarNome(valor) {
    setNome(valor);
    setEscolhidaId(null);
    if (!valor.trim()) setManual({});
  }

  function mudarCampo(campo, valor) {
    if (campo === null) setManual({});
    else setManual((m) => ({ ...m, [campo]: valor }));
  }

  const primeiroNome = perfil.nome?.split(' ')[0];

  return (
    <section className="pagina">
      <div>
        <h1 className="titulo-pagina">Meu Cronômetro</h1>
        <p className="subtitulo">Olá, {primeiroNome}! Escolha a demanda e bora dar o play.</p>
      </div>

      {aviso && (
        <Aviso tipo={aviso.tipo} onFechar={() => setAviso(null)}>
          {aviso.texto}
        </Aviso>
      )}

      <div className="cronometro-grade">
        <div className="cronometro-principal">
          <div className="cartao cartao-cronometro">
            <Visor atual={atual} rodando={rodando} totalSeg={totalSeg} sessaoSeg={sessaoSeg} hojeSeg={hojeSeg} carregando={carregando} />

            <div className="cronometro-controles">
              {formVisivel ? (
                <>
                  {atual && (
                    <div className="trocando-topo">
                      <strong>Começar ou retomar outra demanda</strong>
                      <button type="button" className="btn btn-link" onClick={limparForm}>
                        Cancelar
                      </button>
                    </div>
                  )}
                  <FormDemanda
                    nome={nome}
                    aoMudarNome={mudarNome}
                    abertas={outrasAbertas}
                    escolhida={escolhida}
                    aoEscolher={(d) => setEscolhidaId(d?.id ?? null)}
                    exata={exata}
                    nova={nova}
                    manual={manual}
                    aoMudarCampo={mudarCampo}
                    tipos={tipos.itens ?? []}
                  />
                </>
              ) : (
                <button type="button" className="btn btn-secundario btn-trocar" onClick={() => setTrocando(true)}>
                  <Plus size={18} />
                  Começar outra demanda
                </button>
              )}

              {legenda && <p className="legenda-iniciar">{legenda}.</p>}

              <div className="botoes-cronometro">
                <button type="button" className="btn btn-acao btn-iniciar" onClick={clicarIniciar} disabled={!podeIniciar}>
                  <Play size={20} />
                  Iniciar
                </button>
                <button type="button" className="btn btn-acao btn-pausar" onClick={() => executar(() => pausar(ctx))} disabled={!livre || !rodando}>
                  <Pause size={20} />
                  Pausar
                </button>
                <button type="button" className="btn btn-acao btn-concluir" onClick={clicarConcluir} disabled={!livre || !atual}>
                  <CircleCheck size={20} />
                  Concluir
                </button>
              </div>

              <div className="cronometro-rodape">
                <button type="button" className="btn btn-secundario" onClick={clicarAlmoco} disabled={!livre || almocoRodando}>
                  <Utensils size={18} />
                  Almoço
                </button>
                <span className="texto-secundario">
                  Iniciar outra demanda pausa a atual. O almoço é concluído quando você volta.
                </span>
              </div>
            </div>
          </div>

          <ListaHoje
            demandas={deHoje.itens ?? []}
            atualId={atual?.id}
            rodando={rodando}
            sessaoSeg={sessaoSeg}
            hojeSeg={hojeSeg}
            hoje={hoje}
            aoRetomar={(d) => executar(() => iniciarExistente(d, ctx))}
            ocupado={!livre}
          />
        </div>

        <EquipeAgora
          cronometros={cronometros.itens}
          demandasEmAndamento={emAndamento.itens}
          membros={membros.itens}
          agora={agora}
          emailProprio={email}
        />
      </div>
    </section>
  );
}
