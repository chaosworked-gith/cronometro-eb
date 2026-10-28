import { useState } from 'react';
import Aviso from '../../componentes/Aviso';
import Modal from '../../componentes/Modal';
import { mensagemDeErro } from '../../lib/erros';
import { DESCRICAO_PAPEL, DOMINIO, PAPEIS, ROTULO_PAPEL, emailDaEB } from '../../permissoes';

export const AVISO_PROPRIO_ADMIN =
  'Você não pode tirar o seu próprio acesso de admin nem desativar o seu cadastro. Peça para outro admin fazer essa alteração.';

const TITULOS = { adicionar: 'Adicionar membro', editar: 'Editar membro', aprovar: 'Aprovar acesso' };
const BOTOES = { adicionar: 'Adicionar', editar: 'Salvar', aprovar: 'Aprovar acesso' };

// modo: "adicionar" (cadastro novo), "editar" (cargo e papel) ou "aprovar" (pedido de acesso)
export default function FormMembro({ modo, inicial = {}, proprio = false, emailsCadastrados, onCancelar, onSalvar }) {
  const [nome, setNome] = useState(inicial.nome ?? '');
  const [email, setEmail] = useState(inicial.email ?? '');
  const [cargo, setCargo] = useState(inicial.cargo ?? '');
  const [papel, setPapel] = useState(inicial.papel ?? 'equipe');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    const dados = { nome: nome.trim(), email: email.trim().toLowerCase(), cargo: cargo.trim(), papel };

    if (!dados.nome) return setErro('Informe o nome.');
    if (modo === 'adicionar') {
      if (!/^[^\s@]+@[^\s@]+$/.test(dados.email) || !emailDaEB(dados.email)) {
        return setErro(`Use um e-mail @${DOMINIO}.`);
      }
      if (emailsCadastrados.has(dados.email)) return setErro('Esse e-mail já está cadastrado.');
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

  return (
    <Modal titulo={TITULOS[modo]} onFechar={onCancelar}>
      <form className="formulario" onSubmit={enviar} noValidate>
        {modo === 'editar' ? (
          <div className="modal-pessoa">
            <strong>{inicial.nome}</strong>
            <span className="email">{inicial.email}</span>
          </div>
        ) : (
          <label className="campo">
            <span>Nome</span>
            <input value={nome} onChange={(e) => setNome(e.target.value)} autoFocus maxLength={60} />
          </label>
        )}

        {modo === 'adicionar' && (
          <label className="campo">
            <span>E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={`nome@${DOMINIO}`}
              autoComplete="off"
            />
          </label>
        )}
        {modo === 'aprovar' && (
          <div className="campo">
            <span>E-mail</span>
            <span className="email campo-fixo">{inicial.email}</span>
          </div>
        )}

        <label className="campo">
          <span>Cargo</span>
          <input
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            placeholder="Ex.: Designer"
            maxLength={60}
            autoFocus={modo === 'editar'}
          />
          <small className="ajuda">Só informativo. Não muda o que a pessoa pode fazer.</small>
        </label>

        <label className="campo">
          <span>Papel</span>
          <select value={papel} onChange={(e) => setPapel(e.target.value)} disabled={proprio}>
            {PAPEIS.map((p) => (
              <option key={p} value={p}>
                {ROTULO_PAPEL[p]}
              </option>
            ))}
          </select>
          <small className="ajuda">{DESCRICAO_PAPEL[papel]}</small>
        </label>

        {proprio && <Aviso tipo="info">{AVISO_PROPRIO_ADMIN}</Aviso>}
        {erro && <Aviso tipo="erro">{erro}</Aviso>}

        <div className="modal-acoes">
          <button type="button" className="btn btn-secundario" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primario" disabled={salvando}>
            {salvando ? 'Salvando...' : BOTOES[modo]}
          </button>
        </div>
      </form>
    </Modal>
  );
}
