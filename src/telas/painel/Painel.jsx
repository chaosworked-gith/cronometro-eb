import { useEffect, useMemo, useRef, useState } from 'react';
import { Presentation, X } from 'lucide-react';
import Aviso from '../../componentes/Aviso';
import Carregando from '../../componentes/Carregando';
import CartoesResumo from '../../componentes/CartoesResumo';
import Grafico, { corDaSerie } from '../../componentes/Grafico';
import Logo from '../../componentes/Logo';
import SeletorMes from '../../componentes/SeletorMes';
import SeletorSemana from '../../componentes/SeletorSemana';
import useColecao from '../../hooks/useColecao';
import useConsulta from '../../hooks/useConsulta';
import { diaISO, inicioDaSemana } from '../../lib/datas';
import { resumir } from '../../lib/resumo';
import { formatarHMS } from '../../lib/tempo';
import { encurtar, evolucaoMensal, INICIO_HISTORICO, intervaloDoPeriodo, porPessoa, porPublico, porTipo } from './indicadores';

const GRADE = 'rgba(0, 23, 128, 0.08)';
const horas = (seg) => Math.round((seg / 3600) * 10) / 10;

// Configuração dos cinco gráficos. "grande" aumenta as letras para o modo apresentação.
function montarGraficos(doPeriodo, historico, ateMes, grande) {
  const fonte = { size: grande ? 17 : 14 };
  // Com letra maior, o nome do tipo precisa ser mais curto para não cortar no eixo
  const nomeCurto = (texto) => encurtar(texto, grande ? 20 : 30);
  const eixo = { ticks: { font: fonte }, grid: { color: GRADE } };
  const semLegenda = { legend: { display: false } };
  const dicaHMS = (lista) => ({ callbacks: { title: (i) => lista[i[0].dataIndex].rotulo, label: (i) => formatarHMS(lista[i.dataIndex].totalSeg) } });

  const meses = evolucaoMensal(historico, ateMes);
  const tipos = porTipo(doPeriodo);
  const tiposMedia = tipos.filter((t) => t.rotulo !== 'Outros');
  const pessoas = porPessoa(doPeriodo);
  const publicos = porPublico(doPeriodo);

  return {
    evolucao: {
      dados: {
        labels: meses.map((m) => m.rotulo),
        datasets: [
          { type: 'bar', label: 'Horas', data: meses.map((m) => horas(m.totalSeg)), backgroundColor: corDaSerie(0), yAxisID: 'y', order: 2 },
          {
            type: 'line',
            label: 'Demandas',
            data: meses.map((m) => m.quantidade),
            borderColor: corDaSerie(1),
            backgroundColor: corDaSerie(1),
            borderWidth: 3,
            tension: 0.3,
            yAxisID: 'y2',
            order: 1,
          },
        ],
      },
      opcoes: {
        plugins: {
          legend: { labels: { font: fonte } },
          tooltip: { callbacks: { label: (i) => (i.datasetIndex === 0 ? `Horas: ${formatarHMS(meses[i.dataIndex].totalSeg)}` : `Demandas: ${i.raw}`) } },
        },
        scales: {
          x: eixo,
          y: { ...eixo, beginAtZero: true, title: { display: true, text: 'Horas', font: fonte } },
          y2: { position: 'right', beginAtZero: true, ticks: { font: fonte, precision: 0 }, grid: { display: false }, title: { display: true, text: 'Demandas', font: fonte } },
        },
      },
    },
    tipos: {
      dados: {
        labels: tipos.map((t) => nomeCurto(t.rotulo)),
        datasets: [{ label: 'Demandas', data: tipos.map((t) => t.quantidade), backgroundColor: tipos.map((_, i) => corDaSerie(i)) }],
      },
      opcoes: {
        indexAxis: 'y',
        plugins: { ...semLegenda, tooltip: { callbacks: { title: (i) => tipos[i[0].dataIndex].rotulo } } },
        scales: { x: { ...eixo, beginAtZero: true, ticks: { font: fonte, precision: 0 } }, y: { ticks: { font: fonte }, grid: { display: false } } },
      },
    },
    tempoMedio: {
      dados: {
        labels: tiposMedia.map((t) => nomeCurto(t.rotulo)),
        datasets: [
          {
            label: 'Minutos',
            data: tiposMedia.map((t) => Math.round(t.totalSeg / t.quantidade / 6) / 10),
            backgroundColor: tiposMedia.map((_, i) => corDaSerie(i)),
          },
        ],
      },
      opcoes: {
        indexAxis: 'y',
        plugins: {
          ...semLegenda,
          tooltip: {
            callbacks: {
              title: (i) => tiposMedia[i[0].dataIndex].rotulo,
              label: (i) => `Média ${formatarHMS(tiposMedia[i.dataIndex].totalSeg / tiposMedia[i.dataIndex].quantidade)}`,
            },
          },
        },
        scales: {
          x: { ...eixo, beginAtZero: true, title: { display: true, text: 'Minutos', font: fonte } },
          y: { ticks: { font: fonte }, grid: { display: false } },
        },
      },
    },
    pessoas: {
      dados: {
        labels: pessoas.map((p) => p.rotulo),
        datasets: [{ label: 'Horas', data: pessoas.map((p) => horas(p.totalSeg)), backgroundColor: pessoas.map((_, i) => corDaSerie(i)) }],
      },
      opcoes: {
        plugins: { ...semLegenda, tooltip: dicaHMS(pessoas) },
        scales: { x: { ticks: { font: fonte }, grid: { display: false } }, y: { ...eixo, beginAtZero: true, title: { display: true, text: 'Horas', font: fonte } } },
      },
    },
    publico: {
      dados: {
        labels: publicos.map((p) => p.rotulo),
        datasets: [
          { data: publicos.map((p) => p.quantidade), backgroundColor: publicos.map((_, i) => corDaSerie(i)), borderColor: '#ffffff', borderWidth: 2 },
        ],
      },
      opcoes: { cutout: '55%', plugins: { legend: { position: 'bottom', labels: { font: fonte, padding: 16 } } } },
    },
  };
}

function Graficos({ graficos, vazio }) {
  const cartao = (titulo, chave, tipo, classe = '') => (
    <div className={`cartao secao cartao-grafico ${classe}`}>
      <h2>{titulo}</h2>
      {vazio && chave !== 'evolucao' ? (
        <p className="vazio">Nenhuma demanda neste período.</p>
      ) : (
        <Grafico tipo={tipo} dados={graficos[chave].dados} opcoes={graficos[chave].opcoes} rotulo={titulo} />
      )}
    </div>
  );
  return (
    <div className="graficos">
      {cartao('Evolução mês a mês desde julho de 2026', 'evolucao', 'bar', 'grafico-largo')}
      {cartao('Demandas por tipo', 'tipos', 'bar')}
      {cartao('Tempo médio por tipo', 'tempoMedio', 'bar')}
      {cartao('Horas por pessoa', 'pessoas', 'bar')}
      {cartao('Distribuição por público', 'publico', 'doughnut')}
    </div>
  );
}

// Painel para gestão e diretoria: indicadores, gráficos e modo apresentação em tela cheia
export default function Painel() {
  const hoje = diaISO();
  const [periodo, setPeriodo] = useState({
    modo: 'mes',
    mes: hoje.slice(0, 7),
    segunda: inicioDaSemana(hoje),
    de: `${hoje.slice(0, 7)}-01`,
    ate: hoje,
  });
  const [pessoa, setPessoa] = useState('');
  const [apresentando, setApresentando] = useState(false);
  const telaCheia = useRef(null);
  const mudar = (campo) => (valor) => setPeriodo((p) => ({ ...p, [campo]: valor }));

  const consulta = useConsulta('demandas', [['dataEntrega', '>=', `${INICIO_HISTORICO}-01`]]);
  const membros = useColecao('membros');
  const intervalo = intervaloDoPeriodo(periodo);

  const pessoas = useMemo(() => {
    const mapa = new Map();
    for (const d of consulta.itens ?? []) mapa.set(d.responsavelEmail, d.responsavelNome);
    for (const m of membros.itens ?? []) if (m.ativo && (m.papel === 'admin' || m.papel === 'equipe')) mapa.set(m.id, m.nome);
    return [...mapa].sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'));
  }, [consulta.itens, membros.itens]);
  const nomePessoa = pessoas.find(([email]) => email === pessoa)?.[1];

  const historico = useMemo(
    () => (consulta.itens ?? []).filter((d) => !pessoa || d.responsavelEmail === pessoa),
    [consulta.itens, pessoa],
  );
  const doPeriodo = useMemo(
    () => historico.filter((d) => d.dataEntrega >= intervalo.inicio && d.dataEntrega <= intervalo.fim),
    [historico, intervalo.inicio, intervalo.fim],
  );
  const resumo = resumir(doPeriodo);
  const ateMes = [hoje.slice(0, 7), intervalo.fim.slice(0, 7)].sort().at(-1);
  const graficos = useMemo(() => montarGraficos(doPeriodo, historico, ateMes, false), [doPeriodo, historico, ateMes]);
  const graficosGrandes = useMemo(
    () => (apresentando ? montarGraficos(doPeriodo, historico, ateMes, true) : null),
    [apresentando, doPeriodo, historico, ateMes],
  );

  // Tela cheia: sair com Esc (o navegador avisa pelo fullscreenchange)
  useEffect(() => {
    if (!apresentando) return;
    telaCheia.current?.requestFullscreen?.().catch(() => {});
    const aoMudarTelaCheia = () => {
      if (!document.fullscreenElement) setApresentando(false);
    };
    const aoTeclar = (e) => {
      if (e.key === 'Escape') setApresentando(false);
    };
    document.addEventListener('fullscreenchange', aoMudarTelaCheia);
    window.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('fullscreenchange', aoMudarTelaCheia);
      window.removeEventListener('keydown', aoTeclar);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [apresentando]);

  const quem = nomePessoa ?? 'Equipe de Marketing';

  return (
    <section className="pagina painel">
      <div className="pagina-topo">
        <div>
          <h1 className="titulo-pagina">Painel</h1>
          <p className="subtitulo">
            {intervalo.rotulo} · {quem}
          </p>
        </div>
        <button type="button" className="btn btn-primario btn-grande" onClick={() => setApresentando(true)} disabled={!consulta.itens}>
          <Presentation size={20} />
          Modo apresentação
        </button>
      </div>

      <div className="cartao secao painel-filtros">
        <div className="abas" role="tablist" aria-label="Período">
          {[
            ['semana', 'Semana'],
            ['mes', 'Mês'],
            ['intervalo', 'Intervalo'],
          ].map(([modo, rotulo]) => (
            <button
              key={modo}
              type="button"
              role="tab"
              aria-selected={periodo.modo === modo}
              className={`aba${periodo.modo === modo ? ' ativa' : ''}`}
              onClick={() => mudar('modo')(modo)}
            >
              {rotulo}
            </button>
          ))}
        </div>
        {periodo.modo === 'semana' && <SeletorSemana segunda={periodo.segunda} aoMudar={mudar('segunda')} />}
        {periodo.modo === 'mes' && <SeletorMes mes={periodo.mes} aoMudar={mudar('mes')} />}
        {periodo.modo === 'intervalo' && (
          <div className="intervalo">
            <label className="campo">
              <span>De</span>
              <input type="date" value={periodo.de} onChange={(e) => mudar('de')(e.target.value)} />
            </label>
            <label className="campo">
              <span>Até</span>
              <input type="date" value={periodo.ate} onChange={(e) => mudar('ate')(e.target.value)} />
            </label>
          </div>
        )}
        <label className="campo filtro">
          <span>Pessoa</span>
          <select value={pessoa} onChange={(e) => setPessoa(e.target.value)}>
            <option value="">Equipe toda</option>
            {pessoas.map(([email, nome]) => (
              <option key={email} value={email}>
                {nome}
              </option>
            ))}
          </select>
        </label>
      </div>

      {consulta.erro ? (
        <Aviso tipo="erro">Não foi possível carregar o painel. Verifique a conexão.</Aviso>
      ) : !consulta.itens ? (
        <Carregando />
      ) : (
        <>
          <CartoesResumo resumo={resumo} rotuloHoras="Horas do período" />
          <Graficos graficos={graficos} vazio={!doPeriodo.length} />
        </>
      )}

      {apresentando && graficosGrandes && (
        <div className="apresentacao" ref={telaCheia}>
          <header className="apresentacao-topo">
            <Logo versao="horizontal-branco" className="apresentacao-logo" />
            <div className="apresentacao-titulo">
              <strong>Cronômetro de Atividades</strong>
              <span>
                {intervalo.rotulo} · {quem}
              </span>
            </div>
            <button type="button" className="btn btn-fantasma" onClick={() => setApresentando(false)}>
              <X size={18} />
              Sair
            </button>
          </header>
          <CartoesResumo resumo={resumo} rotuloHoras="Horas do período" variante="apresentacao" />
          <Graficos graficos={graficosGrandes} vazio={!doPeriodo.length} />
          <footer className="apresentacao-rodape">
            <span className="hashtag">#EnergiaBahiana</span>
          </footer>
        </div>
      )}
    </section>
  );
}
