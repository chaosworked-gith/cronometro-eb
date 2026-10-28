import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import Layout from './componentes/Layout';
import { telaInicial, telasDoPapel } from './navegacao';
import Administracao from './telas/admin/Administracao';
import MeuCronometro from './telas/cronometro/MeuCronometro';
import Demandas from './telas/demandas/Demandas';
import EmBreve from './telas/EmBreve';
import Login from './telas/Login';

// Telas já construídas; as outras aparecem como "em breve"
const TELAS_PRONTAS = {
  admin: Administracao,
  cronometro: MeuCronometro,
  demandas: Demandas,
};

// HashRouter porque o GitHub Pages não reescreve rotas (recarregar daria 404).
export default function App() {
  const { status } = useAuth();
  if (status !== 'ativo') return <Login />;
  return (
    <HashRouter>
      <Rotas />
    </HashRouter>
  );
}

function Rotas() {
  const { perfil } = useAuth();
  return (
    <Routes>
      <Route element={<Layout />}>
        {telasDoPapel(perfil.papel).map((tela) => {
          const Tela = TELAS_PRONTAS[tela.id];
          return (
            <Route
              key={tela.id}
              path={tela.id === 'admin' ? `${tela.caminho}/*` : tela.caminho}
              element={Tela ? <Tela /> : <EmBreve tela={tela} />}
            />
          );
        })}
        <Route path="*" element={<Navigate to={telaInicial(perfil.papel)} replace />} />
      </Route>
    </Routes>
  );
}
