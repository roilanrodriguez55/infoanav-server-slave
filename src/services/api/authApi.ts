import api from '../config/axiosConfig';

export interface LoginCredentials {
  usuario: string;
  contraseña: string;
}

export interface RegisterData {
  usuario: string;
  contraseña: string;
  cargo_ocupa?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    usuario: {
      id_usuario_sist: string;
      usuario: string;
      cargo_ocupa: string | null;
    };
    token: string;
  };
}

export const authService = {
  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al conectar con el servidor'
      };
    }
  },

  // REGISTER - Este es el que faltaba
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al registrar usuario'
      };
    }
  },

  // Logout
  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  },

  // Verificar token (opcional)
  verifyToken: async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      const response = await api.get('/auth/verify');
      return response.data.success;
    } catch (error) {
      return false;
    }
  }
};