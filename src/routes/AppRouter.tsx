import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SignInForm from "../components/auth/SignInForm";
import SignUpForm from "../components/auth/SignUpForm";
import NotFound from "../pages/OtherPage/NotFound";
import AppLayout from "../layout/AppLayout";
import { JSX } from "react";

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { authState } = useAuth();
  return authState.isAuthenticated ? children : <Navigate to="/signin" />;
};

const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { authState } = useAuth();
  return !authState.isAuthenticated ? children : <Navigate to="/login" />;
};

export default function AppRouter() {
  const { authState } = useAuth();

  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route 
        path="/signin" 
        element={
          <PublicRoute>
            <SignInForm />
          </PublicRoute>
        } 
      />
      
      <Route 
        path="/signup" 
        element={
          <PublicRoute>
            <SignUpForm />
          </PublicRoute>
        } 
      />
      
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <AppLayout />
          </PublicRoute>
        } 
      />

      {/* Ruta por defecto */}
      <Route 
        path="/" 
        element={
          authState.isAuthenticated ? 
            <Navigate to="/" /> : 
            <Navigate to="/signin" />
        } 
      />

      {/* Ruta 404 */}
      <Route path="*" element={ <NotFound /> } />
    </Routes>
  );
}