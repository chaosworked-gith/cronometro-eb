import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import Carregando from './componentes/Carregando';
import Layout from './componentes/Layout';
import { telaInicial, telasDoPapel } from './navegacao';
import Administracao from './telas/admin/Administracao';
import MeuCronometro from './telas/cronometro/MeuCronometro';
import Demandas from './telas/demandas/Demandas';
import Semana from './telas/semana/Semana';

// O Painel carrega o Chart.js; só baixa quando alguém abre a tela
const Painel = lazy(() => import('./telas/painel/Painel'));
import Login from './telas/Login';

// Componente de cada tela do menu
const TELAS = {
  admin: Administracao,
  cronometro: MeuCronometro,
  demandas: Demandas,
  semana: Semana,
  painel: Painel,
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
          const Tela = TELAS[tela.id];
          return (
            <Route
              key={tela.id}
              path={tela.id === 'admin' ? `${tela.caminho}/*` : tela.caminho}
              element={
                <Suspense fallback={<Carregando />}>
                  <Tela />
                </Suspense>
              }
            />
          );
        })}
        <Route path="*" element={<Navigate to={telaInicial(perfil.papel)} replace />} />
      </Route>
    </Routes>
  );
}
