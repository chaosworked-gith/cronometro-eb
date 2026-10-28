import { useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet, TriangleAlert, Upload } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import Aviso from '../../componentes/Aviso';
import Carregando from '../../componentes/Carregando';
import useAviso from '../../hooks/useAviso';
import useColecao from '../../hooks/useColecao';
import { rotuloMes } from '../../lib/datas';
import { mensagemDeErro } from '../../lib/erros';
import { lerPlanilha } from '../../lib/planilha';
import { formatarHMS } from '../../lib/tempo';
import { ordenarPorTexto } from '../../lib/texto';
import { podeEscrever } from '../../permissoes';
import { contarDemandasPorMes, gravarImportacao } from './gravarImportacao';

// O histórico da planilha original é de Ivie
const RESPONSAVEL_PADRAO = 'ivie.cidreira@eletricabahiana.com.br';

function plural(n, singular, pluralTexto) {
  return `${n} ${n === 1 ? singular : pluralTexto}`;
}

export default function Importacao() {
  const { perfil } = useAuth();
  const { itens: membros } = useColecao('membros', ordenarPorTexto('nome'));
  const [arquivo, setArquivo] = useState('');
  const [leitura, setLeitura] = useState(null);
  const [lendo, setLendo] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const [erroLeitura, setErroLeitura] = useState('');
  const [responsavelEmail, setResponsavelEmail] = useState(RESPONSAVEL_PADRAO);
  const [existentes, setExistentes] = useState(null);
  const [selecao, setSelecao] = useState({ tipos: true, palavras: true, meses: {} });
  const [progresso, setProgresso] = useState(null);
  const [aviso, setAviso] = useAviso(12000);

  // Quem pode ser responsável: pessoas ativas que usam o cronômetro
  const responsaveis = useMemo(
    () => (membros ?? []).filter((m) => m.ativo && podeEscrever(m.papel)).map((m) => ({ email: m.id, nome: m.nome })),
    [membros],
  );
  const responsavel = responsaveis.find((r) => r.email === responsavelEmail);

  useEffect(() => {
    if (membros && !responsaveis.some((r) => r.email === responsavelEmail)) setResponsavelEmail(perfil.email);
  }, [membros, responsaveis, responsavelEmail, perfil.email]);

  // Meses que já têm demandas desse responsável começam desmarcados, para não duplicar
  useEffect(() => {
    if (!leitura || !responsavelEmail) return;
    let ativo = true;
    setExistentes(null);
    contarDemandasPorMes(responsavelEmail)
      .then((contagem) => {
        if (!ativo) return;
        setExistentes(contagem);
        setSelecao((s) => ({
          ...s,
          meses: Object.fromEntries(leitura.meses.map((m) => [m.aba, !contagem[m.mes]])),
        }));
      })
      .catch(() => ativo && setExistentes({}));
    return () => {
      ativo = false;
    };
  }, [leitura, responsavelEmail]);

  async function lerArquivo(file) {
    if (!file) return;
    if (!/\.xlsx$/i.test(file.name)) {
      setErroLeitura('Escolha um arquivo .xlsx.');
      return;
    }
    setLendo(true);
    setErroLeitura('');
    setLeitura(null);
    try {
      const XLSX = await import('xlsx');
      const resultado = lerPlanilha(XLSX, XLSX.read(await file.arrayBuffer(), { cellNF: true }));
      if (!resultado.tipos && !resultado.palavras && !resultado.meses.length) throw new Error('sem abas reconhecidas');
      setArquivo(file.name);
      setLeitura(resultado);
      setSelecao({ tipos: !!resultado.tipos?.itens.length, palavras: !!resultado.palavras?.itens.length, meses: {} });
    } catch {
      setErroLeitura('Não consegui ler essa planilha. Confira se é o arquivo do Cronômetro em .xlsx.');
    } finally {
      setLendo(false);
    }
  }

  function soltar(e) {
    e.preventDefault();
    setArrastando(false);
    lerArquivo(e.dataTransfer.files[0]);
  }

  const mesesMarcados = leitura?.meses.filter((m) => selecao.meses[m.aba]) ?? [];
  const totalDemandas = mesesMarcados.reduce((soma, m) => soma + m.demandas.length, 0);
  const totalTipos = selecao.tipos ? leitura?.tipos?.itens.length ?? 0 : 0;
  const totalPalavras = selecao.palavras ? leitura?.palavras?.itens.length ?? 0 : 0;
  const duplicados = (leitura?.meses ?? []).filter((m) => existentes?.[m.mes]);
  const totalObservacoes = (leitura?.meses ?? []).reduce(
    (soma, m) => soma + m.observacoes.length + (m.tiposDesconhecidos.length ? 1 : 0),
    0,
  );
  const podeImportar = !!responsavel && existentes !== null && !progresso && totalDemandas + totalTipos + totalPalavras > 0;

  async function importar() {
    setProgresso({ feito: 0, total: null });
    try {
      await gravarImportacao(
        {
          tipos: selecao.tipos ? leitura.tipos.itens : [],
          palavras: selecao.palavras ? leitura.palavras.itens : [],
          demandas: mesesMarcados.flatMap((m) => m.demandas),
          responsavel,
        },
        (feito, total) => setProgresso({ feito, total }),
      );
      const partes = [];
      if (totalTipos) partes.push(plural(totalTipos, 'tipo', 'tipos'));
      if (totalPalavras) partes.push(plural(totalPalavras, 'palavra-chave', 'palavras-chave'));
      if (totalDemandas) partes.push(`${plural(totalDemandas, 'demanda', 'demandas')} para ${responsavel.nome}`);
      setAviso({ tipo: 'sucesso', texto: `Importação concluída: ${partes.join(', ')}.` });
      setLeitura(null);
      setArquivo('');
    } catch (e) {
      const parcial = e.gravadas ? ` ${e.gravadas} de ${e.total} registros chegaram a ser gravados.` : '';
      setAviso({ tipo: 'erro', texto: `${mensagemDeErro(e)}${parcial}` });
    } finally {
      setProgresso(null);
    }
  }

  return (
    <>
      {aviso && (
        <Aviso tipo={aviso.tipo} onFechar={() => setAviso(null)}>
          {aviso.texto}
        </Aviso>
      )}

      <div className="cartao secao">
        <div className="secao-topo">
          <h2>
            <Upload size={20} aria-hidden="true" />
            Importar planilha
          </h2>
        </div>
        <p className="texto-secundario">
          Lê as abas mensais, a aba "Tipo de Atividade" e a aba "Palavras-chave". Nada é gravado antes de você
          conferir a prévia e clicar em Importar.
        </p>

        <label
          className={`envio${arrastando ? ' arrastando' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setArrastando(true);
          }}
          onDragLeave={() => setArrastando(false)}
          onDrop={soltar}
        >
          <input
            type="file"
            accept=".xlsx"
            className="sr-only"
            onChange={(e) => {
              lerArquivo(e.target.files[0]);
              e.target.value = '';
            }}
          />
          <FileSpreadsheet size={40} aria-hidden="true" />
          <strong>{arquivo ? 'Trocar a planilha' : 'Arraste a planilha aqui ou clique para escolher'}</strong>
          <span className="texto-secundario">{arquivo || 'Arquivo .xlsx do Cronômetro de Atividades'}</span>
        </label>

        {lendo && <Carregando texto="Lendo a planilha..." />}
        {erroLeitura && <Aviso tipo="erro">{erroLeitura}</Aviso>}

        <label className="campo campo-responsavel">
          <span>Responsável pelas demandas importadas</span>
          <select value={responsavelEmail} onChange={(e) => setResponsavelEmail(e.target.value)} disabled={!!progresso}>
            {responsaveis.map((r) => (
              <option key={r.email} value={r.email}>
                {r.nome}
              </option>
            ))}
          </select>
          <small className="ajuda">As demandas entram como concluídas, no nome dessa pessoa.</small>
        </label>
      </div>

      {leitura && (
        <div className="cartao secao">
          <div className="secao-topo">
            <h2>Prévia</h2>
          </div>

          {existentes === null ? (
            <Carregando texto="Conferindo o que já foi importado..." />
          ) : (
            <>
              {duplicados.length > 0 && (
                <Aviso tipo="erro">
                  {duplicados.map((m) => rotuloMes(m.mes)).join(', ')}{' '}
                  {duplicados.length === 1 ? 'já tem' : 'já têm'} demandas de {responsavel?.nome}. Para não duplicar,{' '}
                  {duplicados.length === 1 ? 'esse mês ficou desmarcado' : 'esses meses ficaram desmarcados'}. Marque só
                  se quiser gravar de novo.
                </Aviso>
              )}

              <div className="tabela-moldura">
                <table className="tabela tabela-responsiva tabela-previa">
                  <thead>
                    <tr>
                      <th className="celula-check">
                        <span className="sr-only">Importar</span>
                      </th>
                      <th>Conteúdo</th>
                      <th>Registros</th>
                      <th>Detalhes</th>
                      <th>Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leitura.tipos && (
                      <LinhaPrevia
                        marcado={selecao.tipos}
                        aoMarcar={(v) => setSelecao((s) => ({ ...s, tipos: v }))}
                        titulo="Tipos de atividade"
                        registros={plural(leitura.tipos.itens.length, 'tipo', 'tipos')}
                        detalhes={leitura.tipos.semTempo ? `${leitura.tipos.semTempo} sem tempo estimado` : 'Completos'}
                        situacao="Atualiza os que têm o mesmo nome e cria os novos"
                      />
                    )}
                    {leitura.palavras && (
                      <LinhaPrevia
                        marcado={selecao.palavras}
                        aoMarcar={(v) => setSelecao((s) => ({ ...s, palavras: v }))}
                        titulo="Palavras-chave"
                        registros={plural(leitura.palavras.itens.length, 'palavra', 'palavras')}
                        detalhes="Ligadas aos tipos de atividade"
                        situacao="Atualiza as que já existem e cria as novas"
                      />
                    )}
                    {leitura.meses.map((m) => (
                      <LinhaPrevia
                        key={m.aba}
                        marcado={!!selecao.meses[m.aba]}
                        aoMarcar={(v) => setSelecao((s) => ({ ...s, meses: { ...s.meses, [m.aba]: v } }))}
                        titulo={m.mes ? rotuloMes(m.mes) : m.aba}
                        registros={plural(m.demandas.length, 'demanda', 'demandas')}
                        detalhes={detalhesDoMes(m)}
                        alerta={
                          existentes[m.mes]
                            ? `Já importado: ${plural(existentes[m.mes], 'demanda', 'demandas')} de ${responsavel?.nome}`
                            : ''
                        }
                        situacao="Novo"
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {(totalObservacoes > 0 || leitura.abasIgnoradas.length > 0) && (
                <details className="observacoes">
                  <summary>Ver observações da leitura ({totalObservacoes + leitura.abasIgnoradas.length})</summary>
                  <ul>
                    {leitura.abasIgnoradas.map((aba) => (
                      <li key={aba}>A aba "{aba}" não está no formato de demandas e fica de fora.</li>
                    ))}
                    {leitura.meses.map((m) => (
                      <li key={m.aba}>
                        <strong>{m.aba}</strong>
                        <ul>
                          {m.tiposDesconhecidos.length > 0 && (
                            <li>
                              Tipos que não estão na tabela de tipos (entram como estão, sem tempo estimado quando a
                              linha não traz): {m.tiposDesconhecidos.join('; ')}.
                            </li>
                          )}
                          {m.observacoes.map((o) => (
                            <li key={o}>{o}</li>
                          ))}
                          {!m.tiposDesconhecidos.length && !m.observacoes.length && <li>Nada a observar.</li>}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              <p className="texto-secundario">
                Tempo economizado e prazo cumprido são recalculados pelas regras do Cronômetro. Linhas sem nome e sem
                tempo ficam de fora.
              </p>

              {progresso ? (
                <div className="progresso-area">
                  <div className="progresso" role="progressbar" aria-valuenow={progresso.feito} aria-valuemax={progresso.total ?? 0}>
                    <div
                      className="progresso-barra"
                      style={{ width: progresso.total ? `${(100 * progresso.feito) / progresso.total}%` : '0%' }}
                    />
                  </div>
                  <span className="texto-secundario">
                    {progresso.total
                      ? `Gravando ${progresso.feito} de ${progresso.total}...`
                      : 'Preparando a gravação...'}
                  </span>
                </div>
              ) : (
                <div className="acoes-importar">
                  <span className="texto-secundario">
                    {totalTipos + totalPalavras + totalDemandas > 0
                      ? `Serão gravados: ${[
                          totalTipos && plural(totalTipos, 'tipo', 'tipos'),
                          totalPalavras && plural(totalPalavras, 'palavra-chave', 'palavras-chave'),
                          totalDemandas && `${plural(totalDemandas, 'demanda', 'demandas')} para ${responsavel?.nome}`,
                        ]
                          .filter(Boolean)
                          .join(', ')}.`
                      : 'Marque o que deve ser importado.'}
                  </span>
                  <button type="button" className="btn btn-primario" onClick={importar} disabled={!podeImportar}>
                    <Upload size={18} />
                    Importar
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}

function detalhesDoMes(m) {
  const partes = [`Tempo gasto ${formatarHMS(m.tempoTotalSeg)}`];
  const comAjuste = m.demandas.filter((d) => d.datasAjuste.length).length;
  const semNome = m.demandas.filter((d) => !d.nome).length;
  if (comAjuste) partes.push(plural(comAjuste, 'com ajuste', 'com ajuste'));
  if (semNome) partes.push(plural(semNome, 'sem nome', 'sem nome'));
  if (m.semEstimativa) partes.push(plural(m.semEstimativa, 'sem tempo estimado', 'sem tempo estimado'));
  if (m.ignoradas) partes.push(plural(m.ignoradas, 'linha ignorada', 'linhas ignoradas'));
  return partes.join(' · ');
}

function LinhaPrevia({ marcado, aoMarcar, titulo, registros, detalhes, situacao, alerta }) {
  return (
    <tr className={alerta ? 'linha-alerta' : ''}>
      <td className="celula-check">
        <input type="checkbox" checked={marcado} onChange={(e) => aoMarcar(e.target.checked)} aria-label={`Importar ${titulo}`} />
      </td>
      <td className="celula-titulo">
        <strong>{titulo}</strong>
      </td>
      <td data-rotulo="Registros">{registros}</td>
      <td data-rotulo="Detalhes">{detalhes}</td>
      <td data-rotulo="Situação">
        {alerta ? (
          <span className="texto-alerta">
            <TriangleAlert size={16} aria-hidden="true" />
            {alerta}
          </span>
        ) : (
          situacao
        )}
      </td>
    </tr>
  );
}
