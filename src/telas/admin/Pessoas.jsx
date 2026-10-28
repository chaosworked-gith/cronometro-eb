import { useMemo, useState } from 'react';
import { deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Inbox, Pencil, Power, UserCheck, UserPlus, Users, UserX } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import Aviso from '../../componentes/Aviso';
import Carregando from '../../componentes/Carregando';
import Confirmar from '../../componentes/Confirmar';
import EtiquetaPapel from '../../componentes/EtiquetaPapel';
import { db } from '../../firebase';
import useAviso from '../../hooks/useAviso';
import useColecao from '../../hooks/useColecao';
import { formatarDataHora } from '../../lib/datas';
import { mensagemDeErro } from '../../lib/erros';
import FormMembro, { AVISO_PROPRIO_ADMIN } from './FormMembro';

function ordenarMembros(a, b) {
  if (a.ativo !== b.ativo) return a.ativo ? -1 : 1;
  return (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR');
}

// Membros nunca são apagados: só ativados ou desativados.
// Desativar não mexe nas demandas da pessoa.
export default function Pessoas() {
  const { perfil } = useAuth();
  const { pedidos } = useOutletContext();
  const { itens, erro: erroLista } = useColecao('membros', ordenarMembros);
  const membros = useMemo(() => itens?.map((m) => ({ ...m, email: m.id })) ?? null, [itens]);
  const [janela, setJanela] = useState(null);
  const [aviso, setAviso] = useAviso();

  const emailsCadastrados = useMemo(() => new Set((membros ?? []).map((m) => m.email)), [membros]);
  const totalAtivos = (membros ?? []).filter((m) => m.ativo).length;

  function fechar() {
    setJanela(null);
  }

  function concluir(texto) {
    setJanela(null);
    setAviso({ tipo: 'sucesso', texto });
  }

  async function adicionar(dados) {
    const lote = writeBatch(db);
    lote.set(doc(db, 'membros', dados.email), {
      nome: dados.nome,
      cargo: dados.cargo,
      papel: dados.papel,
      ativo: true,
    });
    if (pedidos.some((p) => p.email === dados.email)) lote.delete(doc(db, 'solicitacoes', dados.email));
    await lote.commit();
    concluir(`Cadastro de ${dados.nome} criado.`);
  }

  async function editar(membro, dados) {
    await updateDoc(doc(db, 'membros', membro.email), { cargo: dados.cargo, papel: dados.papel });
    concluir(`Cadastro de ${membro.nome} atualizado.`);
  }

  async function aprovar(pedido, dados) {
    const lote = writeBatch(db);
    lote.set(doc(db, 'membros', pedido.email), {
      nome: dados.nome,
      cargo: dados.cargo,
      papel: dados.papel,
      ativo: true,
    });
    lote.delete(doc(db, 'solicitacoes', pedido.email));
    await lote.commit();
    concluir(`Acesso de ${dados.nome} liberado.`);
  }

  async function recusar(pedido) {
    await deleteDoc(doc(db, 'solicitacoes', pedido.email));
    concluir(`Pedido de ${pedido.nome} recusado.`);
  }

  async function definirAtivo(membro, ativo) {
    await updateDoc(doc(db, 'membros', membro.email), { ativo });
    concluir(`Acesso de ${membro.nome} ${ativo ? 'ativado' : 'desativado'}.`);
  }

  function clicarSituacao(membro) {
    if (membro.email === perfil.email) {
      setAviso({ tipo: 'info', texto: AVISO_PROPRIO_ADMIN });
      return;
    }
    if (membro.ativo) {
      setJanela({ tipo: 'desativar', membro });
      return;
    }
    definirAtivo(membro, true).catch((e) => setAviso({ tipo: 'erro', texto: mensagemDeErro(e) }));
  }

  return (
    <>

      {aviso && (
        <Aviso tipo={aviso.tipo} onFechar={() => setAviso(null)}>
          {aviso.texto}
        </Aviso>
      )}

      <div className={`cartao secao${pedidos.length > 0 ? ' secao-destaque' : ''}`}>
        <div className="secao-topo">
          <h2>
            <Inbox size={20} aria-hidden="true" />
            Pedidos de acesso
          </h2>
          {pedidos.length > 0 && <span className="badge">{pedidos.length}</span>}
        </div>
        {pedidos.length === 0 ? (
          <p className="vazio">Nenhum pedido de acesso no momento.</p>
        ) : (
          <ul className="lista-pedidos">
            {pedidos.map((p) => (
              <li key={p.email} className="pedido">
                <div className="pedido-info">
                  <strong>{p.nome}</strong>
                  <span className="email">{p.email}</span>
                  {p.criadoEm && <span className="texto-secundario">Pedido em {formatarDataHora(p.criadoEm)}</span>}
                </div>
                <div className="pedido-acoes">
                  <button type="button" className="btn btn-primario" onClick={() => setJanela({ tipo: 'aprovar', pedido: p })}>
                    <UserCheck size={18} />
                    Aprovar
                  </button>
                  <button type="button" className="btn btn-perigo" onClick={() => setJanela({ tipo: 'recusar', pedido: p })}>
                    <UserX size={18} />
                    Recusar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="cartao secao">
        <div className="secao-topo">
          <h2>
            <Users size={20} aria-hidden="true" />
            Membros
          </h2>
          {membros && (
            <span className="texto-secundario secao-contagem">
              {totalAtivos} de {membros.length} com acesso ativo
            </span>
          )}
          <button type="button" className="btn btn-primario btn-pequeno" onClick={() => setJanela({ tipo: 'adicionar' })}>
            <UserPlus size={16} />
            Adicionar membro
          </button>
        </div>

        {erroLista ? (
          <Aviso tipo="erro">Não foi possível carregar a lista de membros. Verifique a conexão.</Aviso>
        ) : membros === null ? (
          <Carregando />
        ) : (
          <div className="tabela-moldura">
            <table className="tabela tabela-responsiva">
              <thead>
                <tr>
                  <th>Nome e e-mail</th>
                  <th>Cargo</th>
                  <th>Papel</th>
                  <th>Situação</th>
                  <th>
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {membros.map((m) => {
                  const proprio = m.email === perfil.email;
                  return (
                    <tr key={m.email} className={m.ativo ? '' : 'linha-inativa'}>
                      <td className="celula-pessoa">
                        <div>
                          <strong>{m.nome}</strong>
                          {proprio && <span className="etiqueta etiqueta-suave">Você</span>}
                        </div>
                        <span className="pessoa-email">{m.email}</span>
                      </td>
                      <td data-rotulo="Cargo">{m.cargo || <span className="texto-secundario">Sem cargo</span>}</td>
                      <td data-rotulo="Papel">
                        <EtiquetaPapel papel={m.papel} />
                      </td>
                      <td data-rotulo="Situação">
                        <span className={`pilula ${m.ativo ? 'pilula-ativo' : 'pilula-inativo'}`}>
                          {m.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="celula-acoes">
                        <button
                          type="button"
                          className="btn btn-secundario btn-pequeno"
                          onClick={() => setJanela({ tipo: 'editar', membro: m })}
                        >
                          <Pencil size={16} />
                          Editar
                        </button>
                        <button
                          type="button"
                          className={`btn btn-pequeno ${m.ativo ? 'btn-perigo' : 'btn-secundario'}`}
                          onClick={() => clicarSituacao(m)}
                        >
                          <Power size={16} />
                          {m.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {janela?.tipo === 'adicionar' && (
        <FormMembro modo="adicionar" emailsCadastrados={emailsCadastrados} onCancelar={fechar} onSalvar={adicionar} />
      )}
      {janela?.tipo === 'editar' && (
        <FormMembro
          modo="editar"
          inicial={janela.membro}
          proprio={janela.membro.email === perfil.email}
          onCancelar={fechar}
          onSalvar={(dados) => editar(janela.membro, dados)}
        />
      )}
      {janela?.tipo === 'aprovar' && (
        <FormMembro
          modo="aprovar"
          inicial={{ nome: janela.pedido.nome, email: janela.pedido.email }}
          onCancelar={fechar}
          onSalvar={(dados) => aprovar(janela.pedido, dados)}
        />
      )}
      {janela?.tipo === 'recusar' && (
        <Confirmar
          titulo="Recusar pedido"
          rotuloConfirmar="Recusar pedido"
          perigo
          onCancelar={fechar}
          onConfirmar={() => recusar(janela.pedido)}
        >
          <p>
            Recusar o pedido de <strong>{janela.pedido.nome}</strong> (
            <span className="email">{janela.pedido.email}</span>)? O pedido sai da lista e a pessoa pode pedir de novo
            depois.
          </p>
        </Confirmar>
      )}
      {janela?.tipo === 'desativar' && (
        <Confirmar
          titulo="Desativar acesso"
          rotuloConfirmar="Desativar"
          perigo
          onCancelar={fechar}
          onConfirmar={() => definirAtivo(janela.membro, false)}
        >
          <p>
            Desativar o acesso de <strong>{janela.membro.nome}</strong>? A pessoa não vai mais conseguir entrar no
            Cronômetro.
          </p>
          <p className="texto-secundario">
            As demandas já registradas continuam guardadas, sem nenhuma alteração. Dá para ativar de novo quando quiser.
          </p>
        </Confirmar>
      )}
    </>
  );
}
