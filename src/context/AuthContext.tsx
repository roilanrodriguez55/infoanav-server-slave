import React, { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '@/services/api/authApi';
import { setSessionHandlers } from '@/services/config/axiosConfig';
import type { UsuarioSesion } from '@/types/auth.types';

interface AuthState {
  isAuthenticated: boolean;
  usuario: UsuarioSesion | null;
  loading: boolean;
  error: string | null;
}

export type LoginResult =
  | { ok: true }
  | { ok: false; message: string };

interface AuthContextProps {
  authState: AuthState;
  isAdmin: boolean;
  login: (usuario: string, contrasena: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const initialState: AuthState = {
  isAuthenticated: false,
  usuario: null,
  loading: true,
  error: null
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialState);

  // Refresh al arrancar: restaura la sesion con la cookie httpOnly si existe
  useEffect(() => {
    setSessionHandlers({
      onRefreshed: (data) => {
        setAuthState(prev => ({ ...prev, isAuthenticated: true, usuario: data.usuario }));
      },
      onAuthFailure: () => {
        setAuthState({ ...initialState, loading: false });
        window.location.assign('/signin');
      }
    });

    authService.refresh()
      .then((data) => {
        setAuthState({ isAuthenticated: true, usuario: data.usuario, loading: false, error: null });
      })
      .catch(() => {
        setAuthState({ ...initialState, loading: false });
      });
  }, []);

  const login = async (usuario: string, contrasena: string): Promise<LoginResult> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    const response = await authService.login(usuario, contrasena);

    if (response.success) {
      setAuthState({
        isAuthenticated: true,
        usuario: response.data.usuario,
        loading: false,
        error: null
      });
      return { ok: true };
    }
    setAuthState(prev => ({ ...prev, loading: false, error: response.message }));
    return { ok: false, message: response.message };
  };

  const logout = async (): Promise<void> => {
    await authService.logout();
    setAuthState({ ...initialState, loading: false });
  };

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  return (
    <AuthContext.Provider value={{
      authState,
      isAdmin: authState.usuario?.rol === 'administrador',
      login,
      logout,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
