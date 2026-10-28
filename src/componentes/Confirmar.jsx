import { useState } from 'react';
import { mensagemDeErro } from '../lib/erros';
import Aviso from './Aviso';
import Modal from './Modal';

export default function Confirmar({ titulo, rotuloConfirmar, perigo = false, onCancelar, onConfirmar, children }) {
  const [executando, setExecutando] = useState(false);
  const [erro, setErro] = useState('');

  async function confirmar() {
    setExecutando(true);
    setErro('');
    try {
      await onConfirmar();
    } catch (e) {
      setErro(mensagemDeErro(e));
      setExecutando(false);
    }
  }

  return (
    <Modal titulo={titulo} onFechar={onCancelar}>
      <div className="modal-corpo">{children}</div>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <div className="modal-acoes">
        <button type="button" className="btn btn-secundario" onClick={onCancelar}>
          Cancelar
        </button>
        <button
          type="button"
          className={`btn ${perigo ? 'btn-perigo-cheio' : 'btn-primario'}`}
          onClick={confirmar}
          disabled={executando}
        >
          {executando ? 'Salvando...' : rotuloConfirmar}
        </button>
      </div>
    </Modal>
  );
}
