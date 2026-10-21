export type Rol = 'administrador' | 'usuario'

export interface UsuarioSesion {
  id: string
  usuario: string
  rol: Rol
  cargo_ocupa: string | null
  id_empresa: string | null
}

export interface SesionResponse {
  accessToken: string
  usuario: UsuarioSesion
}

export interface EmpresaSetup {
  id_empresa: string
  nombre: string
}

export interface EstadoSetup {
  necesitaAdministrador: boolean
  empresas: EmpresaSetup[]
}

export interface DatosSetup {
  usuario: string
  contrasena: string
  id_empresa?: string | null
}

export interface RespuestaSetup extends SesionResponse {
  codigoRecuperacion: string
}

export interface DatosRecuperacion {
  usuario: string
  codigo: string
  nuevaContrasena: string
}

export interface RespuestaRecuperacion {
  codigoRecuperacion: string
}
