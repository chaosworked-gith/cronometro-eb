import { useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, setDoc, writeBatch } from 'firebase/firestore';
import { KeyRound, ListTree, Pencil, Plus, Search, Trash2, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import Aviso from '../../componentes/Aviso';
import Carregando from '../../componentes/Carregando';
import Confirmar from '../../componentes/Confirmar';
import { db } from '../../firebase';
import useAviso from '../../hooks/useAviso';
import useColecao from '../../hooks/useColecao';
import { formatarHMS, horasParaSegundos } from '../../lib/tempo';
import { normalizar, ordenarPorTexto } from '../../lib/texto';
import { FormPalavra, FormTipo } from './FormTabelas';

const ordenarTipos = ordenarPorTexto('nome');
const ordenarPalavras = ordenarPorTexto('palavra');

function Tempo({ horas }) {
  if (horas == null) return <span className="texto-secundario">Sem tempo</span>;
  return <span className="numero">{formatarHMS(horasParaSegundos(horas))}</span>;
}

function Busca({ valor, aoMudar, rotulo }) {
  return (
    <label className="busca">
      <Search size={16} aria-hidden="true" />
      <input type="search" value={valor} onChange={(e) => aoMudar(e.target.value)} placeholder={rotulo} aria-label={rotulo} />
    </label>
  );
}

// Tabelas de referência: tipos de atividade (tempo estimado e público padrão) e palavras-chave
export default function Tabelas() {
  const tipos = useColecao('tipos', ordenarTipos);
  const palavras = useColecao('palavrasChave', ordenarPalavras);
  const [buscaTipo, setBuscaTipo] = useState('');
  const [buscaPalavra, setBuscaPalavra] = useState('');
  const [janela, setJanela] = useState(null);
  const [aviso, setAviso] = useAviso();

  const nomesDeTipos = useMemo(() => new Set((tipos.itens ?? []).map((t) => normalizar(t.nome))), [tipos.itens]);
  const palavrasDoTipo = (nome) => (palavras.itens ?? []).filter((p) => normalizar(p.tipo) === normalizar(nome));

  const tiposFiltrados = (tipos.itens ?? []).filter((t) => normalizar(t.nome).includes(normalizar(buscaTipo)));
  const palavrasFiltradas = (palavras.itens ?? []).filter(
    (p) => normalizar(p.palavra).includes(normalizar(buscaPalavra)) || normalizar(p.tipo).includes(normalizar(buscaPalavra)),
  );

  function concluir(texto) {
    setJanela(null);
    setAviso({ tipo: 'sucesso', texto });
  }

  function outros(itens, campo, atual) {
    return new Set(itens.filter((i) => i.id !== atual?.id).map((i) => normalizar(i[campo])));
  }

  async function salvarTipo(atual, dados) {
    if (!atual) {
      await addDoc(collection(db, 'tipos'), dados);
      return concluir(`Tipo "${dados.nome}" adicionado.`);
    }
    // Renomear o tipo leva junto as palavras-chave ligadas a ele
    const lote = writeBatch(db);
    lote.set(doc(db, 'tipos', atual.id), dados);
    if (atual.nome !== dados.nome) {
      for (const p of palavrasDoTipo(atual.nome)) lote.update(doc(db, 'palavrasChave', p.id), { tipo: dados.nome });
    }
    await lote.commit();
    concluir(`Tipo "${dados.nome}" atualizado.`);
  }

  async function removerTipo(tipo) {
    const lote = writeBatch(db);
    lote.delete(doc(db, 'tipos', tipo.id));
    for (const p of palavrasDoTipo(tipo.nome)) lote.delete(doc(db, 'palavrasChave', p.id));
    await lote.commit();
    concluir(`Tipo "${tipo.nome}" removido.`);
  }

  async function salvarPalavra(atual, dados) {
    if (atual) await setDoc(doc(db, 'palavrasChave', atual.id), dados);
    else await addDoc(collection(db, 'palavrasChave'), dados);
    concluir(`Palavra-chave "${dados.palavra}" ${atual ? 'atualizada' : 'adicionada'}.`);
  }

  async function removerPalavra(palavra) {
    await deleteDoc(doc(db, 'palavrasChave', palavra.id));
    concluir(`Palavra-chave "${palavra.palavra}" removida.`);
  }

  const tabelaVazia = (
    <p className="vazio">
      Nada cadastrado ainda. Importe a planilha na aba <Link to="/administracao/importar">Importar planilha</Link> ou
      adicione aqui.
    </p>
  );

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
            <ListTree size={20} aria-hidden="true" />
            Tipos de atividade
          </h2>
          {tipos.itens && <span className="texto-secundario">{tipos.itens.length} tipos</span>}
          <button type="button" className="btn btn-primario btn-pequeno" onClick={() => setJanela({ tipo: 'tipo' })}>
            <Plus size={16} />
            Adicionar tipo
          </button>
        </div>
        <p className="texto-secundario">
          O tempo estimado sem IA e o público padrão de cada tipo preenchem as demandas novas e o cálculo do tempo
          economizado.
        </p>

        {tipos.erro ? (
          <Aviso tipo="erro">Não foi possível carregar os tipos. Verifique a conexão.</Aviso>
        ) : !tipos.itens ? (
          <Carregando />
        ) : !tipos.itens.length ? (
          tabelaVazia
        ) : (
          <>
            <Busca valor={buscaTipo} aoMudar={setBuscaTipo} rotulo="Buscar tipo" />
            <div className="tabela-moldura">
              <table className="tabela tabela-responsiva">
                <thead>
                  <tr>
                    <th>Tipo de atividade</th>
                    <th>Mínimo</th>
                    <th>Máximo</th>
                    <th>Público</th>
                    <th>
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tiposFiltrados.map((t) => (
                    <tr key={t.id}>
                      <td className="celula-titulo">
                        <strong>{t.nome}</strong>
                      </td>
                      <td data-rotulo="Mínimo">
                        <Tempo horas={t.minH} />
                      </td>
                      <td data-rotulo="Máximo">
                        <Tempo horas={t.maxH} />
                      </td>
                      <td data-rotulo="Público">{t.publico}</td>
                      <td className="celula-acoes">
                        <button type="button" className="btn btn-secundario btn-pequeno" onClick={() => setJanela({ tipo: 'tipo', item: t })}>
                          <Pencil size={16} />
                          Editar
                        </button>
                        <button type="button" className="btn btn-perigo btn-pequeno" onClick={() => setJanela({ tipo: 'removerTipo', item: t })}>
                          <Trash2 size={16} />
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!tiposFiltrados.length && <p className="vazio">Nenhum tipo encontrado com "{buscaTipo}".</p>}
          </>
        )}
      </div>

      <div className="cartao secao">
        <div className="secao-topo">
          <h2>
            <KeyRound size={20} aria-hidden="true" />
            Palavras-chave
          </h2>
          {palavras.itens && <span className="texto-secundario">{palavras.itens.length} palavras</span>}
          <button
            type="button"
            className="btn btn-primario btn-pequeno"
            onClick={() => setJanela({ tipo: 'palavra' })}
            disabled={!tipos.itens?.length}
          >
            <Plus size={16} />
            Adicionar palavra-chave
          </button>
        </div>
        <p className="texto-secundario">
          Quando o nome de uma demanda tem a palavra-chave, o tipo ligado a ela é sugerido (sem diferenciar maiúsculas
          e acentos).
        </p>

        {palavras.erro ? (
          <Aviso tipo="erro">Não foi possível carregar as palavras-chave. Verifique a conexão.</Aviso>
        ) : !palavras.itens ? (
          <Carregando />
        ) : !palavras.itens.length ? (
          tabelaVazia
        ) : (
          <>
            <Busca valor={buscaPalavra} aoMudar={setBuscaPalavra} rotulo="Buscar palavra ou tipo" />
            <div className="tabela-moldura">
              <table className="tabela tabela-responsiva">
                <thead>
                  <tr>
                    <th>Palavra-chave</th>
                    <th>Tipo de atividade</th>
                    <th>
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {palavrasFiltradas.map((p) => (
                    <tr key={p.id}>
                      <td className="celula-titulo">
                        <strong>{p.palavra}</strong>
                      </td>
                      <td data-rotulo="Tipo">
                        {p.tipo}
                        {tipos.itens && !nomesDeTipos.has(normalizar(p.tipo)) && (
                          <span className="texto-alerta">
                            <TriangleAlert size={14} aria-hidden="true" />
                            Tipo não cadastrado
                          </span>
                        )}
                      </td>
                      <td className="celula-acoes">
                        <button type="button" className="btn btn-secundario btn-pequeno" onClick={() => setJanela({ tipo: 'palavra', item: p })}>
                          <Pencil size={16} />
                          Editar
                        </button>
                        <button type="button" className="btn btn-perigo btn-pequeno" onClick={() => setJanela({ tipo: 'removerPalavra', item: p })}>
                          <Trash2 size={16} />
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!palavrasFiltradas.length && <p className="vazio">Nenhuma palavra-chave encontrada com "{buscaPalavra}".</p>}
          </>
        )}
      </div>

      {janela?.tipo === 'tipo' && (
        <FormTipo
          inicial={janela.item}
          outrosNomes={outros(tipos.itens ?? [], 'nome', janela.item)}
          onCancelar={() => setJanela(null)}
          onSalvar={(dados) => salvarTipo(janela.item, dados)}
        />
      )}
      {janela?.tipo === 'palavra' && (
        <FormPalavra
          inicial={janela.item}
          tipos={tipos.itens ?? []}
          outrasPalavras={outros(palavras.itens ?? [], 'palavra', janela.item)}
          onCancelar={() => setJanela(null)}
          onSalvar={(dados) => salvarPalavra(janela.item, dados)}
        />
      )}
      {janela?.tipo === 'removerTipo' && (
        <Confirmar
          titulo="Remover tipo de atividade"
          rotuloConfirmar="Remover"
          perigo
          onCancelar={() => setJanela(null)}
          onConfirmar={() => removerTipo(janela.item)}
        >
          <p>
            Remover o tipo <strong>{janela.item.nome}</strong>?
          </p>
          {palavrasDoTipo(janela.item.nome).length > 0 && (
            <p>
              {palavrasDoTipo(janela.item.nome).length === 1
                ? 'A palavra-chave ligada a ele também será removida.'
                : `As ${palavrasDoTipo(janela.item.nome).length} palavras-chave ligadas a ele também serão removidas.`}
            </p>
          )}
          <p className="texto-secundario">As demandas já registradas continuam com esse tipo, sem nenhuma alteração.</p>
        </Confirmar>
      )}
      {janela?.tipo === 'removerPalavra' && (
        <Confirmar
          titulo="Remover palavra-chave"
          rotuloConfirmar="Remover"
          perigo
          onCancelar={() => setJanela(null)}
          onConfirmar={() => removerPalavra(janela.item)}
        >
          <p>
            Remover a palavra-chave <strong>{janela.item.palavra}</strong>? Ela deixa de sugerir o tipo "
            {janela.item.tipo}".
          </p>
        </Confirmar>
      )}
    </>
  );
}
