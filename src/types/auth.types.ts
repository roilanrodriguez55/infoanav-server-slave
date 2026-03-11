export interface UsuarioSistema {
  id_usuario_sist: string
  usuario: string
  cargo_ocupa: string | null
}

export interface LoginCredentials {
  usuario: string
  contraseña: string
}

export interface RegisterData {
  usuario: string
  contraseña: string
  cargo_ocupa?: string
}

export interface AuthResponse {
  success: boolean
  message: string
  data?: {
    usuario: UsuarioSistema
    token: string
  }
}

export interface AuthState {
  isAuthenticated: boolean
  usuario: UsuarioSistema | null
  token: string | null
  loading: boolean
  error: string | null
}