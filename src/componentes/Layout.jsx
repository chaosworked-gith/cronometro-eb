import { LogOut } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import usePedidosAcesso from '../hooks/usePedidosAcesso';
import { telasDoPapel } from '../navegacao';
import Logo from './Logo';

export default function Layout() {
  const { perfil, sair } = useAuth();
  const pedidos = usePedidosAcesso(perfil.papel === 'admin');

  return (
    <div className="app">
      <header className="cabecalho">
        <div className="cabecalho-marca">
          <Logo className="cabecalho-logo" />
          <span className="cabecalho-titulo">Cronômetro de Atividades</span>
        </div>
        <div className="cabecalho-usuario">
          <div className="usuario-info">
            <strong>{perfil.nome}</strong>
            {perfil.cargo && <span>{perfil.cargo}</span>}
          </div>
          <button type="button" className="btn btn-fantasma" onClick={sair} aria-label="Sair">
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </header>

      <nav className="menu" aria-label="Menu principal">
        {telasDoPapel(perfil.papel).map(({ id, caminho, rotulo, rotuloCurto, icone: Icone }) => (
          <NavLink key={id} to={caminho} className={({ isActive }) => `menu-item${isActive ? ' ativo' : ''}`}>
            <Icone size={18} aria-hidden="true" />
            <span className="rotulo-longo">{rotulo}</span>
            <span className="rotulo-curto">{rotuloCurto}</span>
            {id === 'admin' && pedidos.length > 0 && (
              <span
                className="badge"
                aria-label={`${pedidos.length} ${pedidos.length === 1 ? 'pedido' : 'pedidos'} de acesso`}
              >
                {pedidos.length}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <main className="conteudo">
        <Outlet context={{ pedidos }} />
      </main>
    </div>
  );
}
