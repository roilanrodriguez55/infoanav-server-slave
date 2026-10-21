import { authHttp, refreshSession } from '@/services/config/axiosConfig'
import { clearAccessToken, setAccessToken } from '@/services/config/tokenStore'
import type {
  DatosRecuperacion,
  DatosSetup,
  EstadoSetup,
  RespuestaRecuperacion,
  RespuestaSetup,
  SesionResponse,
  UsuarioSesion,
} from '@/types/auth.types'
import type { AxiosError } from 'axios'

interface ErrorServidor {
  error?: unknown
}

export type ResultadoAuth<T> =
  | { success: true; data: T }
  | { success: false; message: string; status?: number }

export type LoginServiceResult = ResultadoAuth<SesionResponse>

// El servidor responde { error: string } cuando tiene un mensaje concreto para el cliente.
// 'Datos invalidos' es el mensaje generico de validacion (400): se usa el mapeado local en su lugar.
function mensajeDelServidor(error: AxiosError<ErrorServidor>): string | undefined {
  const mensaje = error.response?.data?.error
  return typeof mensaje === 'string' && mensaje !== '' && mensaje !== 'Datos invalidos' ? mensaje : undefined
}

function mensajeLogin(error: AxiosError): string {
  const status = error.response?.status
  if (status === 401) return 'Usuario o contraseña incorrectos'
  if (status === 429) return 'Demasiados intentos. Intenta de nuevo en unos minutos'
  return 'No se pudo conectar con el servidor'
}

function mensajeSetup(error: AxiosError<ErrorServidor>): string {
  const mensaje = mensajeDelServidor(error)
  if (mensaje) return mensaje
  const status = error.response?.status
  if (status === 400) return 'Revisa los datos ingresados'
  if (status === 409) return 'Ya existe un administrador. Inicia sesión'
  if (status === 429) return 'Demasiados intentos. Intenta de nuevo en unos minutos'
  return 'No se pudo conectar con el servidor'
}

function mensajeRecuperacion(error: AxiosError<ErrorServidor>): string {
  const mensaje = mensajeDelServidor(error)
  if (mensaje) return mensaje
  const status = error.response?.status
  if (status === 400) return 'Revisa los datos ingresados'
  if (status === 401) return 'Usuario o código incorrectos'
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

  setupStatus: (): Promise<EstadoSetup> =>
    authHttp.get<EstadoSetup>('/auth/setup-status').then((response) => response.data),

  setup: (datos: DatosSetup): Promise<ResultadoAuth<RespuestaSetup>> =>
    authHttp
      .post<RespuestaSetup>('/auth/setup', datos)
      .then((response) => {
        setAccessToken(response.data.accessToken)
        return { success: true as const, data: response.data }
      })
      .catch((error: AxiosError<ErrorServidor>) => ({
        success: false as const,
        message: mensajeSetup(error),
        status: error.response?.status,
      })),

  resetPassword: (datos: DatosRecuperacion): Promise<ResultadoAuth<RespuestaRecuperacion>> =>
    authHttp
      .post<RespuestaRecuperacion>('/auth/reset-password', {
        usuario: datos.usuario,
        codigo: datos.codigo,
        nuevaContrasena: datos.nuevaContrasena,
      })
      .then((response) => ({ success: true as const, data: response.data }))
      .catch((error: AxiosError<ErrorServidor>) => ({
        success: false as const,
        message: mensajeRecuperacion(error),
        status: error.response?.status,
      })),
}
