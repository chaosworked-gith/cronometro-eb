import { useState } from 'react';
import Aviso from '../../componentes/Aviso';
import Modal from '../../componentes/Modal';
import { mensagemDeErro } from '../../lib/erros';
import { OPCOES_PUBLICO } from '../../lib/regras';
import { formatarHMS, horasParaSegundos, lerHMS } from '../../lib/tempo';
import { normalizar } from '../../lib/texto';

function useEnvio(onSalvar) {
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function salvar(dados) {
    setSalvando(true);
    setErro('');
    try {
      await onSalvar(dados);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
      setSalvando(false);
    }
  }

  return { erro, setErro, salvando, salvar };
}

function Rodape({ salvando, rotulo, onCancelar }) {
  return (
    <div className="modal-acoes">
      <button type="button" className="btn btn-secundario" onClick={onCancelar}>
        Cancelar
      </button>
      <button type="submit" className="btn btn-primario" disabled={salvando}>
        {salvando ? 'Salvando...' : rotulo}
      </button>
    </div>
  );
}

// Tempos de tipo são guardados em horas (minH, maxH) e editados como HH:MM:SS
export function FormTipo({ inicial, outrosNomes, onCancelar, onSalvar }) {
  const [nome, setNome] = useState(inicial?.nome ?? '');
  const [minimo, setMinimo] = useState(inicial ? formatarHMS(horasParaSegundos(inicial.minH)) : '');
  const [maximo, setMaximo] = useState(inicial ? formatarHMS(horasParaSegundos(inicial.maxH)) : '');
  const [publico, setPublico] = useState(inicial?.publico ?? OPCOES_PUBLICO[0]);
  const { erro, setErro, salvando, salvar } = useEnvio(onSalvar);

  function enviar(e) {
    e.preventDefault();
    const nomeLimpo = nome.trim();
    const minSeg = minimo.trim() ? lerHMS(minimo) : null;
    const maxSeg = maximo.trim() ? lerHMS(maximo) : null;
    if (!nomeLimpo) return setErro('Informe o nome do tipo.');
    if (outrosNomes.has(normalizar(nomeLimpo))) return setErro('Já existe um tipo com esse nome.');
    if (minSeg === null && minimo.trim()) return setErro('Tempo mínimo inválido. Use HH:MM:SS, por exemplo 00:30:00.');
    if (maxSeg === null && maximo.trim()) return setErro('Tempo máximo inválido. Use HH:MM:SS, por exemplo 02:00:00.');
    if (minSeg != null && maxSeg != null && minSeg > maxSeg) return setErro('O tempo mínimo não pode passar do máximo.');
    salvar({
      nome: nomeLimpo,
      minH: minSeg == null ? null : minSeg / 3600,
      maxH: maxSeg == null ? null : maxSeg / 3600,
      publico,
    });
  }

  return (
    <Modal titulo={inicial ? 'Editar tipo de atividade' : 'Adicionar tipo de atividade'} onFechar={onCancelar}>
      <form className="formulario" onSubmit={enviar} noValidate>
        <label className="campo">
          <span>Tipo de atividade</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} autoFocus maxLength={120} />
          {inicial && <small className="ajuda">Mudar o nome atualiza as palavras-chave ligadas a ele. As demandas já registradas não mudam.</small>}
        </label>
        <div className="campos-lado-a-lado">
          <label className="campo">
            <span>Tempo mínimo sem IA</span>
            <input value={minimo} onChange={(e) => setMinimo(e.target.value)} placeholder="00:30:00" />
          </label>
          <label className="campo">
            <span>Tempo máximo sem IA</span>
            <input value={maximo} onChange={(e) => setMaximo(e.target.value)} placeholder="02:00:00" />
          </label>
        </div>
        <label className="campo">
          <span>Público padrão</span>
          <select value={publico} onChange={(e) => setPublico(e.target.value)}>
            {OPCOES_PUBLICO.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        <Rodape salvando={salvando} rotulo={inicial ? 'Salvar' : 'Adicionar'} onCancelar={onCancelar} />
      </form>
    </Modal>
  );
}

export function FormPalavra({ inicial, outrasPalavras, tipos, onCancelar, onSalvar }) {
  const [palavra, setPalavra] = useState(inicial?.palavra ?? '');
  const [tipo, setTipo] = useState(inicial?.tipo ?? tipos[0]?.nome ?? '');
  const { erro, setErro, salvando, salvar } = useEnvio(onSalvar);
  const tipoForaDaLista = tipo && !tipos.some((t) => t.nome === tipo);

  function enviar(e) {
    e.preventDefault();
    const palavraLimpa = palavra.trim();
    if (!palavraLimpa) return setErro('Informe a palavra-chave.');
    if (outrasPalavras.has(normalizar(palavraLimpa))) return setErro('Essa palavra-chave já existe.');
    if (!tipo) return setErro('Escolha o tipo de atividade.');
    salvar({ palavra: palavraLimpa, tipo });
  }

  return (
    <Modal titulo={inicial ? 'Editar palavra-chave' : 'Adicionar palavra-chave'} onFechar={onCancelar}>
      <form className="formulario" onSubmit={enviar} noValidate>
        <label className="campo">
          <span>Palavra-chave</span>
          <input value={palavra} onChange={(e) => setPalavra(e.target.value)} autoFocus maxLength={60} />
          <small className="ajuda">Quando o nome da demanda tiver essa palavra (sem diferenciar maiúsculas e acentos), o tipo abaixo é sugerido.</small>
        </label>
        <label className="campo">
          <span>Tipo de atividade</span>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {tipoForaDaLista && <option value={tipo}>{tipo} (não cadastrado)</option>}
            {tipos.map((t) => (
              <option key={t.id} value={t.nome}>
                {t.nome}
              </option>
            ))}
          </select>
        </label>
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        <Rodape salvando={salvando} rotulo={inicial ? 'Salvar' : 'Adicionar'} onCancelar={onCancelar} />
      </form>
    </Modal>
  );
}
