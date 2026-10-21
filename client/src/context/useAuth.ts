import { createContext, useContext } from 'react';
import type { UsuarioSesion } from '@/types/auth.types';

export interface AuthState {
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

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
