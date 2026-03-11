// Catálogos base
export interface CatalogoItem {
  id: string;
  nombre: string;
}

export interface TipoMantenimiento extends CatalogoItem {}

export interface Mantenimiento {
  id_tipo_mant?: string;
}

export interface CatalogoResponse {
  success: boolean;
  data: CatalogoItem[];
  message?: string;
}