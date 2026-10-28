import { createContext, useContext, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { emailDaEB, papelValido } from '../permissoes';

const AuthContext = createContext(null);

// Quando o popup não funciona (comum no celular), tenta pelo redirecionamento.
const ERROS_PARA_REDIRECIONAR = ['auth/popup-blocked', 'auth/operation-not-supported-in-environment'];
// A pessoa fechou o popup: não é erro.
const ERROS_IGNORADOS = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'];

const AVISO_DOMINIO = 'Use seu e-mail da Elétrica Bahiana.';
const AVISO_FALHA_LOGIN = 'Não foi possível entrar. Tente de novo.';
const ERRO_CADASTRO = 'Não foi possível carregar seu cadastro. Verifique a conexão e tente de novo.';

export function AuthProvider({ children }) {
  // undefined = ainda carregando; null = não existe
  const [usuario, setUsuario] = useState(undefined);
  const [perfil, setPerfil] = useState(undefined);
  const [temPedido, setTemPedido] = useState(undefined);
  const [aviso, setAviso] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    getRedirectResult(auth).catch((e) => {
      if (!ERROS_IGNORADOS.includes(e.code)) setAviso(AVISO_FALHA_LOGIN);
    });
    return onAuthStateChanged(auth, (u) => {
      const permitido = !u || emailDaEB(u.email);
      if (!permitido) {
        setAviso(AVISO_DOMINIO);
        signOut(auth);
      }
      setUsuario(permitido ? u : null);
    });
  }, []);

  const email = usuario?.email?.toLowerCase();

  // Cadastro em tempo real: se um admin liberar ou desativar o acesso, a tela muda sozinha.
  useEffect(() => {
    setPerfil(undefined);
    setErro('');
    if (!email) return;
    return onSnapshot(
      doc(db, 'membros', email),
      (snap) => setPerfil(snap.exists() ? { ...snap.data(), email } : null),
      () => setErro(ERRO_CADASTRO),
    );
  }, [email]);

  const semCadastro = perfil === null;

  useEffect(() => {
    setTemPedido(undefined);
    if (!email || !semCadastro) return;
    return onSnapshot(
      doc(db, 'solicitacoes', email),
      (snap) => setTemPedido(snap.exists()),
      () => setErro(ERRO_CADASTRO),
    );
  }, [email, semCadastro]);

  let status;
  if (usuario === undefined) status = 'carregando';
  else if (usuario === null) status = 'deslogado';
  else if (erro) status = 'erro';
  else if (perfil === undefined) status = 'carregando';
  else if (perfil === null) {
    if (temPedido === undefined) status = 'carregando';
    else status = temPedido ? 'pedido_enviado' : 'sem_cadastro';
  } else if (perfil.ativo !== true) status = 'inativo';
  else if (!papelValido(perfil.papel)) status = 'cadastro_invalido';
  else status = 'ativo';

  async function entrar() {
    setAviso('');
    const provedor = new GoogleAuthProvider();
    provedor.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provedor);
    } catch (e) {
      if (ERROS_PARA_REDIRECIONAR.includes(e.code)) {
        try {
          await signInWithRedirect(auth, provedor);
        } catch {
          setAviso(AVISO_FALHA_LOGIN);
        }
        return;
      }
      if (!ERROS_IGNORADOS.includes(e.code)) setAviso(AVISO_FALHA_LOGIN);
    }
  }

  function sair() {
    setAviso('');
    return signOut(auth);
  }

  function solicitarAcesso() {
    const nome = usuario.displayName?.trim() || email.split('@')[0];
    return setDoc(doc(db, 'solicitacoes', email), { nome, email, criadoEm: serverTimestamp() });
  }

  const valor = { status, usuario, perfil, aviso, erro, entrar, sair, solicitarAcesso };
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
