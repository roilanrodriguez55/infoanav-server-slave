import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './layout/AppLayout';
import SignIn from './components/auth/SignInForm';
import ContentArea from './pages/Dashboard/ContentArea';
import FormANAV from './pages/Forms/FormAnav';
import FormFallas from './pages/Forms/FormFallas';
import FormMantenimientos from './pages/Forms/FormMantenimientos';
import SenalDetalle from './pages/Detalle/SenalDetalle';
import FallaDetalle from './pages/Detalle/FallaDetalle';
import MantenimientoDetalle from './pages/Detalle/MantenimientoDetalle';
import UsuariosPage from './pages/Usuarios/UsuariosPage';
import CatalogosPage from './pages/Catalogos/CatalogosPage';
import CalculosPage from './pages/Calculos/CalculosPage';
import EquipamientoPage from './pages/Equipamiento/EquipamientoPage';
import HechosPage from './pages/Hechos/HechosPage';
import DocumentacionPage from './pages/Documentacion/DocumentacionPage';
import FlotaPage from './pages/Flota/FlotaPage';
import EstadisticasPage from './pages/Estadisticas/EstadisticasPage';
import PlanMantenimientoPage from './pages/Mantenimientos/PlanMantenimientoPage';

const ProtectedRoute = () => {
  const { authState } = useAuth();

  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return authState.isAuthenticated ? <Outlet /> : <Navigate to="/signin" replace />;
};

const GuestOnlyRoute = ({ children }: { children: ReactNode }) => {
  const { authState } = useAuth();

  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (authState.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AdminRoute = () => {
  const { authState, isAdmin } = useAuth();

  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
};

const CatchAllRedirect = () => {
  const { authState } = useAuth();

  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (authState.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to="/signin" replace />;
};

function App() {
  return (
    <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Rutas públicas */}
            <Route
              path="/signin"
              element={
                <GuestOnlyRoute>
                  <SignIn />
                </GuestOnlyRoute>
              }
            />

            {/* Rutas protegidas con layout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<ContentArea />} />
                <Route path="/dashboard" element={<ContentArea />} />
                <Route path="/gestion-senales" element={<ContentArea />} />
                <Route path="/gestion-fallas" element={<ContentArea />} />
                <Route path="/gestion-mant" element={<ContentArea />} />
                <Route path="/gestion-senales/:id" element={<SenalDetalle />} />
                <Route path="/gestion-fallas/:id" element={<FallaDetalle />} />
                <Route path="/gestion-mant/:id" element={<MantenimientoDetalle />} />
                <Route path="/calculos" element={<CalculosPage />} />
                <Route path="/plan-mantenimiento" element={<PlanMantenimientoPage />} />
                <Route path="/equipamiento" element={<EquipamientoPage />} />
                <Route path="/hechos" element={<HechosPage />} />
                <Route path="/flota" element={<FlotaPage />} />
                <Route path="/estadisticas" element={<EstadisticasPage />} />
                <Route path="/documentacion" element={<DocumentacionPage />} />
                <Route element={<AdminRoute />}>
                  <Route path="/usuarios" element={<UsuariosPage />} />
                  <Route path="/catalogos" element={<CatalogosPage />} />
                </Route>
              </Route>
            </Route>

            {/* Rutas protegidas sin layout (formularios pantalla completa) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/gestion-senales/nuevo" element={<FormANAV />} />
              <Route path="/gestion-senales/editar/:id" element={<FormANAV />} />
              <Route path="/gestion-fallas/nuevo" element={<FormFallas />} />
              <Route path="/gestion-fallas/editar/:id" element={<FormFallas />} />
              <Route path="/gestion-mant/nuevo" element={<FormMantenimientos />} />
              <Route path="/gestion-mant/editar/:id" element={<FormMantenimientos />} />
            </Route>

            {/* Ruta 404 */}
            <Route path="*" element={<CatchAllRedirect />} />
          </Routes>
        </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
