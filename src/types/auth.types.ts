export type Rol = 'administrador' | 'usuario'

export interface UsuarioSesion {
  id: string
  usuario: string
  rol: Rol
  cargo_ocupa: string | null
}

export interface SesionResponse {
  accessToken: string
  usuario: UsuarioSesion
}
