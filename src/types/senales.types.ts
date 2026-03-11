// Catálogos base
export interface CatalogoItem {
  id: string;
  nombre: string;
}

// Interfaces para cada catálogo
export interface TipoSenal extends CatalogoItem {}
export interface Categoria extends CatalogoItem {}
export interface ModeloSenal extends CatalogoItem {}
export interface Empresa extends CatalogoItem {
  id_usuario_sist?: string;
}
export interface Estacion extends CatalogoItem {}
export interface UsuarioNavegacion extends CatalogoItem {}
export interface Zona extends CatalogoItem {}
export interface Estado extends CatalogoItem {}
export interface Material extends CatalogoItem {}
export interface Energia extends CatalogoItem {}
export interface Color extends CatalogoItem {}
export interface Forma extends CatalogoItem {}
export interface Mar extends CatalogoItem {}
export interface ColorLuz extends CatalogoItem {}
export interface MarcaTope extends CatalogoItem {}
export interface Caracteristica extends CatalogoItem {}
export interface TipoEquipamiento extends CatalogoItem {}

export interface Equipamiento {
  id_equipamiento?: string;
  id_tipo_equipamiento: string;
  nombre: string;
  cantidad: number;
  num_inventario: string;
}

export interface Senal {
  id_señal?: string;
  id_tipo?: string;
  id_categoria?: string;
  nombre: string;
  id_modelo?: string;
  id_empresa?: string;
  id_estacion?: string;
  lumínica?: boolean;
  secreta?: boolean;
  id_usuario_navegacion?: string;
  monitoreo?: string;
  id_zona?: string;
  reflector_radar?: boolean;
  repetición?: boolean;
  id_estado?: string;
  id_material?: string;
  control_distancia?: boolean;
  id_energia?: string;
  id_marca_tope?: string;
  observaciones?: string;
  id_color?: string;
  id_forma?: string;
  altura?: number;
  elevación?: number;
  profundidad?: number;
  alcancegeografico?: number;
  latitud?: number;
  longitud?: number;
  id_mar?: string;
  ubicación?: string;
  alcanceluminico?: number;
  intensidadluminica?: number;
  id_colorluz?: string;
  id_caracteristica?: string;
  periodo?: number;
  oscuridad?: number;
  tiempoluz?: number;
  potenciabombillo?: number;
  voltagebombillo?: number;
  consumodestellador?: number;
  id_equipamiento?: string;
  id_fallas?: string;
  id_mantenimientos?: string;
  equipamientos?: Equipamiento[];
}

export interface CatalogoResponse {
  success: boolean;
  data: CatalogoItem[];
  message?: string;
}