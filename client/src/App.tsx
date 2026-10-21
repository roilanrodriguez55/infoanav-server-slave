import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import AppLayout from './layout/AppLayout';
import SignIn from './components/auth/SignInForm';
import ContentArea from './pages/Dashboard/ContentArea';

const FormANAV = lazy(() => import('./pages/Forms/FormAnav'));
const FormFallas = lazy(() => import('./pages/Forms/FormFallas'));
const FormMantenimientos = lazy(() => import('./pages/Forms/FormMantenimientos'));
const SenalDetalle = lazy(() => import('./pages/Detalle/SenalDetalle'));
const FallaDetalle = lazy(() => import('./pages/Detalle/FallaDetalle'));
const MantenimientoDetalle = lazy(() => import('./pages/Detalle/MantenimientoDetalle'));
const UsuariosPage = lazy(() => import('./pages/Usuarios/UsuariosPage'));
const CatalogosPage = lazy(() => import('./pages/Catalogos/CatalogosPage'));
const CalculosPage = lazy(() => import('./pages/Calculos/CalculosPage'));
const EquipamientoPage = lazy(() => import('./pages/Equipamiento/EquipamientoPage'));
const HechosPage = lazy(() => import('./pages/Hechos/HechosPage'));
const DocumentacionPage = lazy(() => import('./pages/Documentacion/DocumentacionPage'));
const FlotaPage = lazy(() => import('./pages/Flota/FlotaPage'));
const EstadisticasPage = lazy(() => import('./pages/Estadisticas/EstadisticasPage'));
const PlanMantenimientoPage = lazy(() => import('./pages/Mantenimientos/PlanMantenimientoPage'));

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
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>}>
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
          </Suspense>
        </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
