import { useState } from 'react';
import { Hourglass, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import Aviso from '../componentes/Aviso';
import Carregando from '../componentes/Carregando';
import Logo from '../componentes/Logo';
import { urlMarca } from '../lib/marca';
import { DOMINIO } from '../permissoes';

export default function Login() {
  const { status, usuario, aviso, erro, entrar, sair, solicitarAcesso } = useAuth();
  const [entrando, setEntrando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroPedido, setErroPedido] = useState('');

  async function clicarEntrar() {
    setEntrando(true);
    try {
      await entrar();
    } finally {
      setEntrando(false);
    }
  }

  async function clicarSolicitar() {
    setEnviando(true);
    setErroPedido('');
    try {
      await solicitarAcesso();
    } catch {
      setErroPedido('Não foi possível enviar o pedido. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  const botaoSair = (
    <button type="button" className="btn btn-link" onClick={sair}>
      Sair e entrar com outra conta
    </button>
  );

  let corpo;
  if (status === 'carregando') {
    corpo = <Carregando />;
  } else if (status === 'deslogado') {
    corpo = (
      <>
        {aviso && <Aviso tipo="erro">{aviso}</Aviso>}
        <button
          type="button"
          className="btn btn-primario btn-grande btn-bloco"
          onClick={clicarEntrar}
          disabled={entrando}
        >
          <LogIn size={20} />
          {entrando ? 'Entrando...' : 'Entrar com Google'}
        </button>
        <p className="login-nota">
          Entre com o seu e-mail <strong>@{DOMINIO}</strong>
        </p>
      </>
    );
  } else if (status === 'sem_cadastro') {
    const primeiroNome = usuario.displayName?.split(' ')[0];
    corpo = (
      <>
        <p className="login-texto">
          {primeiroNome ? `Olá, ${primeiroNome}! ` : ''}O e-mail <strong className="email">{usuario.email}</strong>{' '}
          ainda não tem acesso ao Cronômetro.
        </p>
        {erroPedido && <Aviso tipo="erro">{erroPedido}</Aviso>}
        <button
          type="button"
          className="btn btn-primario btn-grande btn-bloco"
          onClick={clicarSolicitar}
          disabled={enviando}
        >
          <UserPlus size={20} />
          {enviando ? 'Enviando...' : 'Solicitar acesso'}
        </button>
        {botaoSair}
      </>
    );
  } else if (status === 'pedido_enviado') {
    corpo = (
      <>
        <Aviso tipo="info" icone={Hourglass}>
          Pedido enviado. Aguarde a liberação.
        </Aviso>
        <p className="login-nota">Assim que o acesso for liberado, o Cronômetro abre nesta tela.</p>
        {botaoSair}
      </>
    );
  } else if (status === 'inativo') {
    corpo = (
      <>
        <Aviso tipo="erro">Acesso desativado. Fale com o administrador.</Aviso>
        {botaoSair}
      </>
    );
  } else if (status === 'cadastro_invalido') {
    corpo = (
      <>
        <Aviso tipo="erro">Seu cadastro está incompleto. Fale com o administrador.</Aviso>
        {botaoSair}
      </>
    );
  } else {
    corpo = (
      <>
        <Aviso tipo="erro">{erro}</Aviso>
        {botaoSair}
      </>
    );
  }

  return (
    <div className="tela-login">
      <div className="login-coluna">
        <Logo versao="vertical-branco" className="login-logo" />
        <div className="janela login-cartao">
          <span className="etiqueta etiqueta-suave">Marketing EB</span>
          <h1 className="login-titulo">Cronômetro de Atividades</h1>
          <p className="login-sub">Registre o tempo das suas demandas e acompanhe o ritmo da equipe.</p>
          <div className="login-corpo">{corpo}</div>
        </div>
      </div>

      <footer className="login-rodape">
        <img src={urlMarca('mascotes/Mascote_Ebinho.png')} alt="" className="mascote mascote-esquerda" />
        <span className="hashtag">#EnergiaBahiana</span>
        <img src={urlMarca('mascotes/Mascote_Ebinha.png')} alt="" className="mascote mascote-direita" />
      </footer>
    </div>
  );
}
