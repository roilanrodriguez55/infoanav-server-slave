import { isAxiosError } from 'axios'
import api from '@/services/config/axiosConfig'
import type { CatalogoDef } from '@/config/catalogos'

export interface RegistroCatalogo {
  id: string
  nombre: string
}

type FilaCatalogo = Record<string, unknown>

const MENSAJE_GENERICO = 'No se pudo completar la operación. Intenta de nuevo'

function aRegistro(def: CatalogoDef, fila: FilaCatalogo): RegistroCatalogo {
  return { id: String(fila[def.pk]), nombre: String(fila.nombre) }
}

function aError(error: unknown): Error {
  if (isAxiosError<{ message?: unknown }>(error)) {
    const message = error.response?.data?.message
    if (typeof message === 'string') return new Error(message)
  }
  return new Error(MENSAJE_GENERICO)
}

export const catalogosAdminService = {
  list: async (def: CatalogoDef): Promise<RegistroCatalogo[]> => {
    try {
      const response = await api.get<FilaCatalogo[]>(`/${def.tabla}`, {
        params: {
          deleted_at: 'is.null',
          select: `${def.pk},nombre`,
          order: 'nombre.asc',
        },
      })
      return response.data.map((fila) => aRegistro(def, fila))
    } catch (error) {
      throw aError(error)
    }
  },

  create: async (def: CatalogoDef, nombre: string): Promise<RegistroCatalogo> => {
    try {
      const response = await api.post<FilaCatalogo[]>(`/${def.tabla}`, { nombre }, {
        headers: { Prefer: 'return=representation' },
      })
      return aRegistro(def, response.data[0])
    } catch (error) {
      throw aError(error)
    }
  },

  update: async (def: CatalogoDef, id: string, nombre: string): Promise<void> => {
    try {
      await api.patch(`/${def.tabla}`, { nombre }, {
        params: { [def.pk]: `eq.${id}` },
      })
    } catch (error) {
      throw aError(error)
    }
  },

  remove: async (def: CatalogoDef, id: string): Promise<void> => {
    try {
      await api.delete(`/${def.tabla}`, {
        params: { [def.pk]: `eq.${id}` },
      })
    } catch (error) {
      throw aError(error)
    }
  },
}
