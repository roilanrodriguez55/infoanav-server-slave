import { authHttp, refreshSession } from '@/services/config/axiosConfig'
import { clearAccessToken, setAccessToken } from '@/services/config/tokenStore'
import type { SesionResponse, UsuarioSesion } from '@/types/auth.types'
import type { AxiosError } from 'axios'

export type LoginServiceResult =
  | { success: true; data: SesionResponse }
  | { success: false; message: string }

function mensajeLogin(error: AxiosError): string {
  const status = error.response?.status
  if (status === 401) return 'Usuario o contraseña incorrectos'
  if (status === 429) return 'Demasiados intentos. Intenta de nuevo en unos minutos'
  return 'No se pudo conectar con el servidor'
}

export const authService = {
  login: (usuario: string, contrasena: string): Promise<LoginServiceResult> =>
    authHttp
      .post<SesionResponse>('/auth/login', { usuario, contrasena })
      .then((response) => {
        setAccessToken(response.data.accessToken)
        return { success: true as const, data: response.data }
      })
      .catch((error: AxiosError) => ({ success: false as const, message: mensajeLogin(error) })),

  refresh: (): Promise<SesionResponse> => refreshSession(),

  logout: (): Promise<void> =>
    authHttp
      .post('/auth/logout')
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => {
        clearAccessToken()
      }),

  me: (): Promise<UsuarioSesion> => authHttp.get<UsuarioSesion>('/auth/me').then((response) => response.data),
}
