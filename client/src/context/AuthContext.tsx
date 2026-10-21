import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '@/services/api/authApi';
import { setSessionHandlers } from '@/services/config/axiosConfig';
import { AuthContext } from './useAuth';
import type { AuthState, LoginResult } from './useAuth';
import type { SesionResponse } from '@/types/auth.types';

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

  // Para el alta del primer administrador: el token ya lo guarda authService.setup
  const establecerSesion = (sesion: SesionResponse) => {
    setAuthState({ isAuthenticated: true, usuario: sesion.usuario, loading: false, error: null });
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
      establecerSesion,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
};
