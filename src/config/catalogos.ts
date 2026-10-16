export interface CatalogoDef {
  tabla: string
  pk: string
  etiqueta: string
}

export const CATALOGOS: CatalogoDef[] = [
  { tabla: 'caracteristicas', pk: 'id_caracteristica', etiqueta: 'Características' },
  { tabla: 'categorias', pk: 'id_categoria', etiqueta: 'Categorías' },
  { tabla: 'colores', pk: 'id_color', etiqueta: 'Colores' },
  { tabla: 'colores_luz', pk: 'id_colorluz', etiqueta: 'Colores de luz' },
  { tabla: 'empresas', pk: 'id_empresa', etiqueta: 'Empresas' },
  { tabla: 'energias', pk: 'id_energia', etiqueta: 'Energías' },
  { tabla: 'estaciones', pk: 'id_estacion', etiqueta: 'Estaciones' },
  { tabla: 'estados', pk: 'id_estado', etiqueta: 'Estados de señal (operativos)' },
  { tabla: 'estados_senal', pk: 'id_estado_senal', etiqueta: 'Estados de señal (mantenimiento)' },
  { tabla: 'formas', pk: 'id_forma', etiqueta: 'Formas' },
  { tabla: 'marcas_tope', pk: 'id_marca_tope', etiqueta: 'Marcas de tope' },
  { tabla: 'mares', pk: 'id_mar', etiqueta: 'Mares' },
  { tabla: 'materiales', pk: 'id_material', etiqueta: 'Materiales' },
  { tabla: 'modelos_senal', pk: 'id_modelo', etiqueta: 'Modelos de señal' },
  { tabla: 'origenes_falla', pk: 'id_origen_falla', etiqueta: 'Orígenes de falla' },
  { tabla: 'tipos_equipamiento', pk: 'id_tipo_equipamiento', etiqueta: 'Tipos de equipamiento' },
  { tabla: 'tipos_falla', pk: 'id_tipo_falla', etiqueta: 'Tipos de falla' },
  { tabla: 'tipos_mantenimiento', pk: 'id_tipo_mant', etiqueta: 'Tipos de mantenimiento' },
  { tabla: 'tipos_senal', pk: 'id_tipo', etiqueta: 'Tipos de señal' },
  { tabla: 'usuarios_navegacion', pk: 'id_usuario_navegacion', etiqueta: 'Usuarios de navegación' },
  { tabla: 'zonas', pk: 'id_zona', etiqueta: 'Zonas' },
]
