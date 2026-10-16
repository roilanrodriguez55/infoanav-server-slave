import axios, { type AxiosError, type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import type { SesionResponse } from '@/types/auth.types'
import { clearAccessToken, getAccessToken, setAccessToken } from '@/services/config/tokenStore'

const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? '/api').replace(/\/+$/, '')

const JSON_HEADERS = { 'Content-Type': 'application/json' }

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

interface SessionHandlers {
  onRefreshed: (data: SesionResponse) => void
  onAuthFailure: () => void
}

let sessionHandlers: SessionHandlers | null = null
let refreshPromise: Promise<SesionResponse> | null = null

export function setSessionHandlers(handlers: SessionHandlers): void {
  sessionHandlers = handlers
}

// Refresh compartido: las peticiones concurrentes con 401 esperan la misma promesa.
// Usa axios plano (sin interceptores) para no entrar en bucle.
export function refreshSession(): Promise<SesionResponse> {
  refreshPromise ??= axios
    .post<SesionResponse>(`${API_URL}/auth/refresh`, null, { withCredentials: true })
    .then((response) => {
      setAccessToken(response.data.accessToken)
      sessionHandlers?.onRefreshed(response.data)
      return response.data
    })
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

export async function refreshAccessToken(): Promise<string> {
  const data = await refreshSession()
  return data.accessToken
}

function handleAuthFailure(): void {
  clearAccessToken()
  if (sessionHandlers) {
    sessionHandlers.onAuthFailure()
  } else {
    window.location.assign('/signin')
  }
}

function isAuthEndpoint(url: string | undefined): boolean {
  return url !== undefined && (url.includes('/auth/login') || url.includes('/auth/refresh'))
}

export function attachAuthInterceptors(instance: AxiosInstance): void {
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const config = error.config as RetriableConfig | undefined
      if (error.response?.status !== 401 || !config || isAuthEndpoint(config.url) || config._retry) {
        return Promise.reject(error)
      }
      config._retry = true
      try {
        const token = await refreshAccessToken()
        config.headers.Authorization = `Bearer ${token}`
        return await instance(config)
      } catch {
        handleAuthFailure()
        return Promise.reject(error)
      }
    }
  )
}

export const authHttp = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: JSON_HEADERS,
})

const api = axios.create({
  baseURL: `${API_URL}/data`,
  withCredentials: true,
  headers: JSON_HEADERS,
})

attachAuthInterceptors(api)
attachAuthInterceptors(authHttp)

export default api
