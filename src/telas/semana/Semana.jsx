import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import Aviso from '../../componentes/Aviso';
import Carregando from '../../componentes/Carregando';
import CartoesResumo from '../../componentes/CartoesResumo';
import EtiquetaSituacao from '../../componentes/EtiquetaSituacao';
import SeletorSemana from '../../componentes/SeletorSemana';
import useAviso from '../../hooks/useAviso';
import useColecao from '../../hooks/useColecao';
import useConsulta from '../../hooks/useConsulta';
import { diaISO, diasDaSemana, inicioDaSemana, rotuloDia, rotuloSemana, somarDias } from '../../lib/datas';
import { agruparPorPessoa, exportarExcel } from '../../lib/excel';
import { resumir } from '../../lib/resumo';
import { formatarHMS } from '../../lib/tempo';

function ordenarDemandas(a, b) {
  return (
    (a.dataEntrega ?? '').localeCompare(b.dataEntrega ?? '') ||
    (a.responsavelNome ?? '').localeCompare(b.responsavelNome ?? '', 'pt-BR') ||
    (a.numero ?? 0) - (b.numero ?? 0)
  );
}

// Semana de segunda a sábado, pela data de entrega (último dia trabalhado) de cada demanda
export default function Semana() {
  const [segunda, setSegunda] = useState(() => inicioDaSemana(diaISO()));
  const [pessoa, setPessoa] = useState('');
  const [exportando, setExportando] = useState(false);
  const [aviso, setAviso] = useAviso();
  const sabado = somarDias(segunda, 5);

  const consulta = useConsulta('demandas', [
    ['dataEntrega', '>=', segunda],
    ['dataEntrega', '<=', sabado],
  ]);
  const membros = useColecao('membros');

  const todas = useMemo(() => [...(consulta.itens ?? [])].sort(ordenarDemandas), [consulta.itens]);
  const pessoas = useMemo(() => agruparPorPessoa(todas, membros.itens), [todas, membros.itens]);
  const opcoesPessoa = useMemo(() => {
    const mapa = new Map(
      (membros.itens ?? []).filter((m) => m.ativo && (m.papel === 'admin' || m.papel === 'equipe')).map((m) => [m.id, m.nome]),
    );
    for (const d of todas) mapa.set(d.responsavelEmail, d.responsavelNome);
    return [...mapa].sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'));
  }, [membros.itens, todas]);

  const visiveis = pessoa ? todas.filter((d) => d.responsavelEmail === pessoa) : todas;
  const resumo = resumir(visiveis);

  async function exportar() {
    setExportando(true);
    try {
      const ddmm = (iso) => `${iso.slice(8, 10)}-${iso.slice(5, 7)}`;
      await exportarExcel({
        nomeArquivo: `Cronometro_Semana_${ddmm(segunda)}_a_${ddmm(sabado)}.xlsx`,
        periodo: `Semana de ${rotuloSemana(segunda)}`,
        pessoas,
        equipe: todas,
      });
    } catch {
      setAviso({ tipo: 'erro', texto: 'Não foi possível gerar o Excel. Tente de novo.' });
    } finally {
      setExportando(false);
    }
  }

  return (
    <section className="pagina">
      <div className="pagina-topo">
        <div>
          <h1 className="titulo-pagina">Semana</h1>
          <p className="subtitulo">De segunda a sábado, pela data de entrega de cada demanda.</p>
        </div>
        <div className="pagina-acoes">
          <SeletorSemana segunda={segunda} aoMudar={setSegunda} />
          <label className="campo filtro">
            <span className="sr-only">Pessoa</span>
            <select value={pessoa} onChange={(e) => setPessoa(e.target.value)} aria-label="Pessoa">
              <option value="">Equipe toda</option>
              {opcoesPessoa.map(([email, nome]) => (
                <option key={email} value={email}>
                  {nome}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn btn-primario" onClick={exportar} disabled={exportando || !todas.length}>
            <Download size={18} />
            {exportando ? 'Gerando...' : 'Exportar Excel'}
          </button>
        </div>
      </div>

      {aviso && (
        <Aviso tipo={aviso.tipo} onFechar={() => setAviso(null)}>
          {aviso.texto}
        </Aviso>
      )}

      {consulta.erro ? (
        <Aviso tipo="erro">Não foi possível carregar a semana. Verifique a conexão.</Aviso>
      ) : !consulta.itens ? (
        <Carregando />
      ) : (
        <>
          <CartoesResumo resumo={resumo} />

          <div className="dias-semana">
            {diasDaSemana(segunda).map((dia) => {
              const doDia = visiveis.filter((d) => d.dataEntrega === dia);
              const totalDia = doDia.reduce((s, d) => s + (d.tempoGastoSeg ?? 0), 0);
              return (
                <div key={dia} className="cartao secao dia">
                  <div className="dia-topo">
                    <h2>{rotuloDia(dia)}</h2>
                    <span className="texto-secundario">
                      {doDia.length} {doDia.length === 1 ? 'demanda' : 'demandas'} · Total{' '}
                      <strong className="numero">{formatarHMS(totalDia)}</strong>
                    </span>
                  </div>
                  {doDia.length === 0 ? (
                    <p className="vazio">Nada registrado neste dia.</p>
                  ) : (
                    <ul className="lista-dia">
                      {doDia.map((d) => (
                        <li key={d.id}>
                          <div className="lista-hoje-texto">
                            <strong>{d.nome || 'Demanda sem nome'}</strong>
                            <span className="texto-secundario">
                              {d.tipo}
                              {!pessoa && ` · ${d.responsavelNome}`}
                            </span>
                          </div>
                          <span className="lista-hoje-tempo numero">{formatarHMS(d.tempoGastoSeg)}</span>
                          <EtiquetaSituacao status={d.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
