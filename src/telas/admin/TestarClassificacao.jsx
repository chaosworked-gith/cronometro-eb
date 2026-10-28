import { useMemo, useState } from 'react';
import { History, ListChecks, Play, Tags } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import Aviso from '../../componentes/Aviso';
import Carregando from '../../componentes/Carregando';
import useColecao from '../../hooks/useColecao';
import useHistorico from '../../hooks/useHistorico';
import { avaliarHistorico, criarClassificador, explicarSugestao, SEMELHANCA_MINIMA } from '../../lib/classificacao';
import { diaISO, formatarData } from '../../lib/datas';
import { ordenarPorTexto } from '../../lib/texto';

const ordenarTipos = ordenarPorTexto('nome');
const ROTULO_ORIGEM = { historico: 'Histórico', palavra: 'Palavra-chave', nenhuma: 'Sem pista' };
const MAXIMO_PARECIDAS = 10;

const porcentagem = (parte, total) => (total ? `${Math.round((100 * parte) / total)}%` : '0%');
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

function motivoDaPalavra(resultado) {
  if (resultado.motivo === 'formato') return 'Formato de rede social ganha de data comemorativa.';
  if (resultado.motivo === 'mais longa') return 'Entre as palavras-chave encontradas, vale a mais longa (a mais específica).';
  return null;
}

// Resultado do teste de um nome: tipo sugerido e por quê
function Explicacao({ resultado, termos, usarHistorico }) {
  const somaVotos = resultado.votos.reduce((s, v) => s + v.peso, 0);
  return (
    <div className="explicacao">
      <div className={`explicacao-tipo${resultado.tipo ? '' : ' sem-tipo'}`}>
        <span className="texto-secundario">Tipo sugerido</span>
        <strong>{resultado.tipo ?? 'Nenhum: o campo fica em "Escolha o tipo", em vermelho'}</strong>
        {resultado.tipo && <span>{explicarSugestao(resultado)}.</span>}
        {resultado.origem === 'historico' && resultado.palavra && (
          <span className="texto-secundario">O histórico vem antes das palavras-chave.</span>
        )}
        {resultado.origem === 'palavra' && motivoDaPalavra(resultado) && (
          <span className="texto-secundario">{motivoDaPalavra(resultado)}</span>
        )}
        {resultado.alternativas.length > 0 && (
          <span className="texto-secundario">Outras opções: {resultado.alternativas.join(', ')}.</span>
        )}
      </div>

      {usarHistorico && (
        <div className="explicacao-bloco">
          <h3>Histórico</h3>
          <p className="texto-secundario">
            Palavras comparadas: {termos.length ? termos.join(', ') : 'nenhuma'}. Conta como parecida a demanda com pelo menos{' '}
            {Math.round(SEMELHANCA_MINIMA * 100)}% de semelhança.
          </p>
          {resultado.parecidas.length === 0 ? (
            <p>Nenhuma demanda parecida.</p>
          ) : (
            <>
              <ul className="lista-votos">
                {resultado.votos.map((v) => (
                  <li key={v.tipo}>
                    <strong>{v.tipo}</strong>: {plural(v.quantidade, 'demanda', 'demandas')} ({porcentagem(v.peso, somaVotos)} do peso)
                  </li>
                ))}
              </ul>
              <div className="tabela-moldura">
                <table className="tabela tabela-responsiva tabela-compacta">
                  <thead>
                    <tr>
                      <th>Demanda parecida</th>
                      <th>Tipo</th>
                      <th className="direita">Semelhança</th>
                      <th>Responsável</th>
                      <th>Entrega</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.parecidas.slice(0, MAXIMO_PARECIDAS).map((p) => (
                      <tr key={p.demanda.id}>
                        <td className="celula-titulo">{p.demanda.nome}</td>
                        <td data-rotulo="Tipo">{p.tipo}</td>
                        <td data-rotulo="Semelhança" className="direita numero">
                          {Math.round(p.semelhanca * 100)}%
                        </td>
                        <td data-rotulo="Responsável">{p.demanda.responsavelNome}</td>
                        <td data-rotulo="Entrega" className="numero">
                          {formatarData(p.demanda.dataEntrega)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {resultado.parecidas.length > MAXIMO_PARECIDAS && (
                <p className="texto-secundario">E mais {resultado.parecidas.length - MAXIMO_PARECIDAS} com semelhança menor.</p>
              )}
            </>
          )}
        </div>
      )}

      <div className="explicacao-bloco">
        <h3>Palavras-chave encontradas</h3>
        {resultado.palavras.length === 0 ? (
          <p>Nenhuma palavra-chave no nome.</p>
        ) : (
          <ul className="lista-palavras">
            {resultado.palavras.map((c) => (
              <li key={c.palavra}>
                <strong>{c.palavra}</strong> leva a {c.tipo}
                {c === resultado.palavra && <span className="etiqueta etiqueta-suave">Mais forte</span>}
                {c.formato && <span className="etiqueta etiqueta-clara">Formato</span>}
                {c.comemorativa && <span className="etiqueta etiqueta-clara">Data comemorativa</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Relatorio({ relatorio }) {
  const [filtro, setFiltro] = useState('todas');
  const erros = relatorio.erros.filter((l) => filtro === 'todas' || (l.resultado.origem ?? 'nenhuma') === filtro);
  // Sem o histórico, a linha "Histórico" ficaria zerada
  const origens = relatorio.porOrigem.filter((o) => o.total > 0);
  const cartoes = [
    { rotulo: 'Acerto', valor: porcentagem(relatorio.certos, relatorio.total), detalhe: `${relatorio.certos} de ${relatorio.total}` },
    { rotulo: 'Certo entre as opções', valor: porcentagem(relatorio.nasOpcoes, relatorio.total), detalhe: 'sugerido ou nas etiquetas' },
    { rotulo: 'Sem sugestão', valor: relatorio.semSugestao, detalhe: porcentagem(relatorio.semSugestao, relatorio.total) },
    { rotulo: 'Erradas', valor: relatorio.erros.length, detalhe: 'lista abaixo' },
  ];

  return (
    <>
      <div className="cartoes-resumo">
        {cartoes.map((c) => (
          <div key={c.rotulo} className="cartao-resumo">
            <span className="cartao-resumo-rotulo">{c.rotulo}</span>
            <strong className="cartao-resumo-valor numero">{c.valor}</strong>
            <span className="cartao-resumo-detalhe">{c.detalhe}</span>
          </div>
        ))}
      </div>
      {(relatorio.foraDaTabela > 0 || relatorio.semNome > 0) && (
        <p className="texto-secundario">
          Ficaram de fora: {plural(relatorio.foraDaTabela, 'demanda com tipo que não está', 'demandas com tipo que não está')} na
          tabela de tipos e {plural(relatorio.semNome, 'demanda sem nome', 'demandas sem nome')}.
        </p>
      )}

      <div className="tabela-moldura">
        <table className="tabela tabela-responsiva tabela-compacta">
          <thead>
            <tr>
              <th>De onde veio a sugestão</th>
              <th className="direita">Demandas</th>
              <th className="direita">Acertos</th>
              <th className="direita">Acerto</th>
            </tr>
          </thead>
          <tbody>
            {origens.map((o) => (
              <tr key={o.origem ?? 'nenhuma'}>
                <td className="celula-titulo">{ROTULO_ORIGEM[o.origem ?? 'nenhuma']}</td>
                <td data-rotulo="Demandas" className="direita numero">{o.total}</td>
                <td data-rotulo="Acertos" className="direita numero">{o.certos}</td>
                <td data-rotulo="Acerto" className="direita numero">{o.origem ? porcentagem(o.certos, o.total) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="secao-topo">
        <h3>Palavras-chave que erraram</h3>
        <Link to="/administracao/tabelas" className="btn btn-secundario btn-pequeno">
          <Tags size={16} />
          Ajustar palavras-chave
        </Link>
      </div>
      {relatorio.palavras.length === 0 ? (
        <p>Nenhuma palavra-chave errou.</p>
      ) : (
        <div className="tabela-moldura">
          <table className="tabela tabela-responsiva tabela-compacta">
            <thead>
              <tr>
                <th>Palavra-chave</th>
                <th>Leva a</th>
                <th className="direita">Acertos</th>
                <th className="direita">Erros</th>
                <th>Tipo certo mais comum nos erros</th>
              </tr>
            </thead>
            <tbody>
              {relatorio.palavras.map((p) => (
                <tr key={p.palavra}>
                  <td className="celula-titulo">{p.palavra}</td>
                  <td data-rotulo="Leva a">{p.tipo}</td>
                  <td data-rotulo="Acertos" className="direita numero">{p.certos}</td>
                  <td data-rotulo="Erros" className="direita numero celula-alerta">{p.erros}</td>
                  <td data-rotulo="Tipo certo mais comum">{p.tipoMaisComum}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="secao-topo">
        <h3>Demandas que deram errado</h3>
        <label className="campo campo-inline">
          <span>Mostrar</span>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="todas">Todas ({relatorio.erros.length})</option>
            {origens.map((o) => (
              <option key={o.origem ?? 'nenhuma'} value={o.origem ?? 'nenhuma'}>
                {ROTULO_ORIGEM[o.origem ?? 'nenhuma']} ({o.total - o.certos})
              </option>
            ))}
          </select>
        </label>
      </div>
      {erros.length === 0 ? (
        <p>Nenhuma demanda errada aqui.</p>
      ) : (
        <div className="tabela-moldura">
          <table className="tabela tabela-responsiva tabela-compacta">
            <thead>
              <tr>
                <th>Demanda</th>
                <th>Tipo registrado</th>
                <th>Sugerido</th>
                <th>De onde veio</th>
              </tr>
            </thead>
            <tbody>
              {erros.map((l) => (
                <tr key={l.demanda.id}>
                  <td className="celula-titulo">{l.demanda.nome}</td>
                  <td data-rotulo="Tipo registrado">{l.demanda.tipo}</td>
                  <td data-rotulo="Sugerido" className={l.resultado.tipo ? '' : 'celula-alerta'}>
                    {l.resultado.tipo ?? 'Sem sugestão'}
                  </td>
                  <td data-rotulo="De onde veio">{explicarSugestao(l.resultado) ?? 'Sem pista no nome'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// Administração > Testar classificação: o tipo que seria sugerido para um nome e por quê, e o
// relatório de acerto da classificação em todo o histórico.
export default function TestarClassificacao() {
  const { perfil } = useAuth();
  const hoje = diaISO();
  const historico = useHistorico(true);
  const tipos = useColecao('tipos', ordenarTipos);
  const palavras = useColecao('palavrasChave');

  const [nome, setNome] = useState('');
  const [usarHistorico, setUsarHistorico] = useState(true);
  const [rodar, setRodar] = useState(false);

  const pronto = !!(historico.itens && tipos.itens && palavras.itens);
  const classificador = useMemo(
    () => (pronto ? criarClassificador({ demandas: historico.itens, palavras: palavras.itens, tipos: tipos.itens, hoje }) : null),
    [pronto, historico.itens, palavras.itens, tipos.itens, hoje],
  );
  const resultado = useMemo(
    () => (classificador && nome.trim() ? classificador.classificar(nome, { email: perfil.email, semHistorico: !usarHistorico }) : null),
    [classificador, nome, perfil.email, usarHistorico],
  );
  const relatorio = useMemo(
    () => (rodar && classificador ? avaliarHistorico(classificador, historico.itens, tipos.itens, { semHistorico: !usarHistorico }) : null),
    [rodar, classificador, historico.itens, tipos.itens, usarHistorico],
  );

  if (historico.erro || tipos.erro || palavras.erro) {
    return <Aviso tipo="erro">Não foi possível ler o histórico. Recarregue a página.</Aviso>;
  }
  if (!pronto) return <Carregando texto="Lendo o histórico de demandas..." />;

  return (
    <>
      <div className="cartao secao">
        <div className="secao-topo">
          <h2>
            <History size={20} aria-hidden="true" />
            Testar classificação
          </h2>
          <label className="check">
            <input type="checkbox" checked={usarHistorico} onChange={(e) => setUsarHistorico(e.target.checked)} />
            Usar o histórico
          </label>
        </div>
        <p className="texto-secundario">
          Digite um nome para ver o tipo que o Meu Cronômetro sugeriria e por quê. Ordem: histórico de{' '}
          {plural(classificador.tamanhoDoHistorico, 'demanda', 'demandas')}, depois palavras-chave. Desmarque "Usar o histórico"
          para testar só as palavras-chave.
        </p>
        <label className="campo">
          <span>Nome da demanda</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Reels Dia das Mães" maxLength={160} />
        </label>
        {resultado ? (
          <Explicacao resultado={resultado} termos={classificador.termosDoNome(nome)} usarHistorico={usarHistorico} />
        ) : (
          <p className="vazio">Digite um nome para ver a sugestão.</p>
        )}
      </div>

      <div className="cartao secao">
        <div className="secao-topo">
          <h2>
            <ListChecks size={20} aria-hidden="true" />
            Relatório de acerto
          </h2>
          {!rodar && (
            <button type="button" className="btn btn-primario" onClick={() => setRodar(true)}>
              <Play size={18} />
              Rodar relatório
            </button>
          )}
        </div>
        <p className="texto-secundario">
          Cada demanda do histórico é classificada como se fosse nova (ela mesma fica fora da comparação) e o resultado é
          comparado com o tipo registrado. {usarHistorico ? 'Usa histórico e palavras-chave.' : 'Usa só as palavras-chave.'}
        </p>
        {relatorio && <Relatorio key={String(usarHistorico)} relatorio={relatorio} />}
      </div>
    </>
  );
}
