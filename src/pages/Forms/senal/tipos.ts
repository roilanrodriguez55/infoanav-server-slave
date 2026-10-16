import type { ChangeEvent } from 'react';
import type { TipoEquipamiento } from '@/services/api/senalesApi';

export interface CatalogoItem {
  id: string;
  nombre: string;
}

export interface EquipamientoItem {
  id?: string;
  id_tipo_equipamiento: string;
  nombre: string;
  cantidad: number;
  num_inventario: string;
}

export interface CadenaItem {
  diametro: string;
  cantidad: number;
}

export interface PesoMuertoItem {
  peso: string;
  cantidad: number;
}

export interface BridaItem {
  tipo: string;
  cantidad: number;
}

export interface GrectoItem {
  tipo: string;
  cantidad: number;
  giratorio: boolean;
}

export interface SistemaFondeo {
  no_serie_flotador?: string;
  cadenas: CadenaItem[];
  pesos_muertos: PesoMuertoItem[];
  bridas: BridaItem[];
  grectos: GrectoItem[];
}

export interface FormDataState {
  codigo_lsm: string;
  id_tipo: string;
  id_categoria: string;
  nombre: string;
  id_modelo: string;
  id_estacion: string;
  luminica: boolean;
  secreta: boolean;
  fecha_instalacion: string;
  id_usuario_navegacion: string;
  monitoreo: string;
  id_zona: string;
  reflector_radar: boolean;
  repeticion: boolean;
  id_estado: string;
  id_material: string;
  control_distancia: boolean;
  id_energia: string;
  id_marca_tope: string;
  id_complejidad: string;
  observaciones: string;
  id_color: string;
  id_forma: string;
  altura: string;
  elevacion: string;
  profundidad: string;
  alcancegeografico: string;
  latitud: string;
  longitud: string;
  id_mar: string;
  ubicacion: string;
  alcanceluminico: string;
  intensidadluminica: string;
  id_colorluz: string;
  id_caracteristica: string;
  periodo: string;
  oscuridad: string;
  tiempoluz: string;
  potenciabombillo: string;
  voltagebombillo: string;
  consumodestellador: string;
  id_equipamiento: string;

  sistema_fondeo: string;
}

export const FORM_DATA_VACIO: FormDataState = {
  codigo_lsm: '',
  id_tipo: '',
  id_categoria: '',
  nombre: '',
  id_modelo: '',
  id_estacion: '',
  luminica: true,
  secreta: false,
  fecha_instalacion: '',
  id_usuario_navegacion: '',
  monitoreo: '',
  id_zona: '',
  reflector_radar: false,
  repeticion: false,
  id_estado: '',
  id_material: '',
  control_distancia: false,
  id_energia: '',
  id_marca_tope: '',
  id_complejidad: '',
  observaciones: '',
  id_color: '',
  id_forma: '',
  altura: '',
  elevacion: '',
  profundidad: '',
  alcancegeografico: '',
  latitud: '',
  longitud: '',
  id_mar: '',
  ubicacion: '',
  alcanceluminico: '',
  intensidadluminica: '',
  id_colorluz: '',
  id_caracteristica: '',
  periodo: '',
  oscuridad: '',
  tiempoluz: '',
  potenciabombillo: '',
  voltagebombillo: '',
  consumodestellador: '',
  id_equipamiento: '',
  sistema_fondeo: ''
};

export interface CatalogosSenal {
  tipos: CatalogoItem[];
  categorias: CatalogoItem[];
  modelos: CatalogoItem[];
  estaciones: CatalogoItem[];
  usuarios: CatalogoItem[];
  zonas: CatalogoItem[];
  estados: CatalogoItem[];
  materiales: CatalogoItem[];
  energias: CatalogoItem[];
  marcasTope: CatalogoItem[];
  complejidades: CatalogoItem[];
  colores: CatalogoItem[];
  formas: CatalogoItem[];
  mares: CatalogoItem[];
  coloresLuz: CatalogoItem[];
  caracteristicas: CatalogoItem[];
  tiposEquipamiento: TipoEquipamiento[];
}

export type InputChangeHandler = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
export type CheckboxChangeHandler = (name: string, checked: boolean) => void;
export type SelectChangeHandler = (name: string, value: string) => void;

export interface FondeoControl {
  noSerieFlotador: string;
  setNoSerieFlotador: (valor: string) => void;
  cadenas: CadenaItem[];
  agregarCadena: () => void;
  eliminarCadena: (index: number) => void;
  actualizarCadena: (index: number, campo: string, valor: string | number) => void;
  pesosMuertos: PesoMuertoItem[];
  agregarPesoMuerto: () => void;
  eliminarPesoMuerto: (index: number) => void;
  actualizarPesoMuerto: (index: number, campo: string, valor: string | number) => void;
  bridas: BridaItem[];
  agregarBrida: () => void;
  eliminarBrida: (index: number) => void;
  actualizarBrida: (index: number, campo: string, valor: string | number) => void;
  grectos: GrectoItem[];
  agregarGrecto: () => void;
  eliminarGrecto: (index: number) => void;
  actualizarGrecto: (index: number, campo: string, valor: string | number | boolean) => void;
  cargar: (fondeo: SistemaFondeo) => void;
  reiniciar: () => void;
}
