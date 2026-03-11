import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authService, LoginCredentials, RegisterData } from '../services/api/authApi';

interface Usuario {
  id_usuario_sist: string;
  usuario: string;
  cargo_ocupa: string | null;
}

interface AuthState {
  isAuthenticated: boolean;
  usuario: Usuario | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextProps {
  authState: AuthState;
  login: (usuario: string, contraseña: string) => Promise<boolean>;
  register: (usuario: string, contraseña: string, cargo_ocupa?: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const initialState: AuthState = {
  isAuthenticated: false,
  usuario: null,
  token: null,
  loading: true,
  error: null
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialState);

  // Verificar sesión al cargar
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const storedUsuario = localStorage.getItem('usuario');
      
      if (token && storedUsuario) {
        try {
          const usuario = JSON.parse(storedUsuario);
          setAuthState({
            isAuthenticated: true,
            usuario,
            token,
            loading: false,
            error: null
          });
        } catch (error) {
          // Si hay error al parsear, limpiamos localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
          setAuthState({ ...initialState, loading: false });
        }
      } else {
        setAuthState({ ...initialState, loading: false });
      }
    };

    checkAuth();
  }, []);

  const login = async (usuario: string, contraseña: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await authService.login({ usuario, contraseña });
      
      if (response.success && response.data) {
        // Guardar en localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
        
        // Actualizar estado
        setAuthState({
          isAuthenticated: true,
          usuario: response.data.usuario,
          token: response.data.token,
          loading: false,
          error: null
        });
        
        return true;
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: response.message
        }));
        return false;
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Error de conexión'
      }));
      return false;
    }
  };

  // NUEVO: Método register corregido
  const register = async (usuario: string, contraseña: string, cargo_ocupa?: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await authService.register({ 
        usuario, 
        contraseña, 
        cargo_ocupa 
      });
      
      if (response.success && response.data) {
        // Guardar en localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
        
        // Actualizar estado
        setAuthState({
          isAuthenticated: true,
          usuario: response.data.usuario,
          token: response.data.token,
          loading: false,
          error: null
        });
        
        return true;
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: response.message
        }));
        return false;
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Error de conexión'
      }));
      return false;
    }
  };

  const logout = () => {
    authService.logout();
    setAuthState({
      isAuthenticated: false,
      usuario: null,
      token: null,
      loading: false,
      error: null
    });
  };

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  return (
    <AuthContext.Provider value={{ 
      authState, 
      login, 
      register, 
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