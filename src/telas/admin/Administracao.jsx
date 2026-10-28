import { FileSpreadsheet, FlaskConical, Tags, Users } from 'lucide-react';
import { Navigate, NavLink, Route, Routes, useOutletContext } from 'react-router-dom';
import Importacao from './Importacao';
import Pessoas from './Pessoas';
import Tabelas from './Tabelas';
import TestarClassificacao from './TestarClassificacao';

// Caminhos completos: dentro de uma rota com "*", links relativos partem do endereço atual
const ABAS = [
  { caminho: '/administracao', rotulo: 'Pessoas', icone: Users },
  { caminho: '/administracao/tabelas', rotulo: 'Tipos e palavras-chave', icone: Tags },
  { caminho: '/administracao/importar', rotulo: 'Importar planilha', icone: FileSpreadsheet },
  { caminho: '/administracao/classificacao', rotulo: 'Testar classificação', icone: FlaskConical },
];

export default function Administracao() {
  const { pedidos } = useOutletContext();

  return (
    <section className="pagina">
      <div>
        <h1 className="titulo-pagina">Administração</h1>
        <p className="subtitulo">Pessoas e acessos, tabelas de referência, importação do histórico e teste da classificação.</p>
      </div>

      <nav className="abas" aria-label="Seções da administração">
        {ABAS.map(({ caminho, rotulo, icone: Icone }) => (
          <NavLink key={caminho} to={caminho} end className={({ isActive }) => `aba${isActive ? ' ativa' : ''}`}>
            <Icone size={16} aria-hidden="true" />
            {rotulo}
            {caminho === '/administracao' && pedidos.length > 0 && <span className="badge">{pedidos.length}</span>}
          </NavLink>
        ))}
      </nav>

      <Routes>
        <Route index element={<Pessoas />} />
        <Route path="tabelas" element={<Tabelas />} />
        <Route path="importar" element={<Importacao />} />
        <Route path="classificacao" element={<TestarClassificacao />} />
        <Route path="*" element={<Navigate to="/administracao" replace />} />
      </Routes>
    </section>
  );
}
