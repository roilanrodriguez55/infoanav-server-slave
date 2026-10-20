import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { senalesService, type CatalogoItem, type CatalogosResponse } from '@/services/api/senalesApi';
import { useServerList } from '@/hooks/useServerList';
import { useAuth } from '@/context/AuthContext';
import { dateRangeFilters, type Filter } from '@/lib/postgrest';

// Componentes shadcn
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/common/EmptyState';
import { FilterBar, FilterField } from '@/components/common/FilterBar';
import { ListCard } from '@/components/common/ListCard';
import { Pagination } from '@/components/common/Pagination';
import { PageHeader } from '@/components/common/PageHeader';
import { PillTabs } from '@/components/common/PillTabs';
import { SortableHead } from '@/components/common/SortableHead';
import {
  Search,
  Plus,
  Edit,
  Eye,
  Trash2,
  RefreshCw,
  AlertCircle,
  Anchor
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Senal {
  id_senal: string;
  codigo_lsm: string;
  nombre: string;
  id_tipo: string;
  ubicacion: string;
  luminica: boolean;
  id_estado: string;
  created_at: string;
  fecha_retirada: string | null;
  causa_retirada: string | null;
}

interface FiltrosSenales {
  texto: string;
  id_tipo: string;
  id_estacion: string;
  id_categoria: string;
  id_estado: string;
  id_zona: string;
  id_empresa: string;
  id_complejidad: string;
  id_usuario_navegacion: string;
  id_caracteristica: string;
  id_colorluz: string;
  id_color: string;
  id_modelo: string;
  id_forma: string;
  id_material: string;
  altura: string;
  elevacion: string;
  profundidad: string;
  luminica: string;
  bajas: string;
  desde: string;
  hasta: string;
}

type Vista = 'activas' | 'ciegas' | 'luminicas' | 'bajas';

const VISTAS: { valor: Vista; etiqueta: string }[] = [
  { valor: 'activas', etiqueta: 'Activas' },
  { valor: 'ciegas', etiqueta: 'Ciegas' },
  { valor: 'luminicas', etiqueta: 'Lumínicas' },
  { valor: 'bajas', etiqueta: 'Bajas' },
];

const esVista = (valor: string | null): valor is Vista =>
  VISTAS.some((v) => v.valor === valor);

// Radix Select no admite value vacio; esta opcion equivale a sin filtro.
const TODOS = '__all__';

const FILTROS_INICIALES: FiltrosSenales = {
  texto: '',
  id_tipo: '',
  id_estacion: '',
  id_categoria: '',
  id_estado: '',
  id_zona: '',
  id_empresa: '',
  id_complejidad: '',
  id_usuario_navegacion: '',
  id_caracteristica: '',
  id_colorluz: '',
  id_color: '',
  id_modelo: '',
  id_forma: '',
  id_material: '',
  altura: '',
  elevacion: '',
  profundidad: '',
  luminica: '',
  bajas: '',
  desde: '',
  hasta: '',
};

const esId = (valor: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor);
const esNumero = (valor: string): boolean => /^-?\d+(\.\d+)?$/.test(valor);
const esFecha = (valor: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(valor);

// Parametro de URL de cada filtro. Un valor que no pasa su validacion se ignora.
const PARAMETROS: { clave: keyof FiltrosSenales; param: string; valido: (valor: string) => boolean }[] = [
  { clave: 'texto', param: 'texto', valido: () => true },
  { clave: 'id_tipo', param: 'tipo', valido: esId },
  { clave: 'id_estacion', param: 'estacion', valido: esId },
  { clave: 'id_categoria', param: 'categoria', valido: esId },
  { clave: 'id_estado', param: 'estado', valido: esId },
  { clave: 'id_zona', param: 'zona', valido: esId },
  { clave: 'id_empresa', param: 'empresa', valido: esId },
  { clave: 'id_complejidad', param: 'complejidad', valido: esId },
  { clave: 'id_usuario_navegacion', param: 'usuario_navegacion', valido: esId },
  { clave: 'id_caracteristica', param: 'caracteristica', valido: esId },
  { clave: 'id_colorluz', param: 'colorluz', valido: esId },
  { clave: 'id_color', param: 'color', valido: esId },
  { clave: 'id_modelo', param: 'modelo', valido: esId },
  { clave: 'id_forma', param: 'forma', valido: esId },
  { clave: 'id_material', param: 'material', valido: esId },
  { clave: 'altura', param: 'altura', valido: esNumero },
  { clave: 'elevacion', param: 'elevacion', valido: esNumero },
  { clave: 'profundidad', param: 'profundidad', valido: esNumero },
  { clave: 'luminica', param: 'luminica', valido: (valor) => valor === 'true' || valor === 'false' },
  { clave: 'bajas', param: 'bajas', valido: (valor) => valor === '1' },
  { clave: 'desde', param: 'desde', valido: esFecha },
  { clave: 'hasta', param: 'hasta', valido: esFecha },
];

const filtrosDesdeUrl = (params: URLSearchParams): FiltrosSenales => {
  const filtros: FiltrosSenales = { ...FILTROS_INICIALES };
  for (const { clave, param, valido } of PARAMETROS) {
    const valor = params.get(param)?.trim() ?? '';
    if (valor !== '' && valido(valor)) filtros[clave] = valor;
  }
  return filtros;
};

const COLUMNAS_LISTA =
  'id_senal,codigo_lsm,nombre,id_tipo,ubicacion,luminica,id_estado,created_at,fecha_retirada,causa_retirada';

// Las vistas Ciegas y Lumínicas fijan el filtro lumínica; la vista Bajas muestra solo bajas.
// En las demas vistas las bajas se excluyen, salvo con bajas=1 en la URL.
const toFiltros = (filtros: FiltrosSenales, vista: Vista): Filter[] => {
  const luminica =
    vista === 'ciegas' ? 'false' : vista === 'luminicas' ? 'true' : filtros.luminica;

  const retirada: Filter[] = vista === 'bajas'
    ? [{ column: 'fecha_retirada', op: 'not_is', value: null }]
    : filtros.bajas === '1'
      ? []
      : [{ column: 'fecha_retirada', op: 'is', value: null }];

  return [
    ...retirada,
    { column: 'id_tipo', op: 'eq', value: filtros.id_tipo },
    { column: 'id_estacion', op: 'eq', value: filtros.id_estacion },
    { column: 'id_categoria', op: 'eq', value: filtros.id_categoria },
    { column: 'id_estado', op: 'eq', value: filtros.id_estado },
    { column: 'id_zona', op: 'eq', value: filtros.id_zona },
    { column: 'id_empresa', op: 'eq', value: filtros.id_empresa },
    { column: 'id_complejidad', op: 'eq', value: filtros.id_complejidad },
    { column: 'id_usuario_navegacion', op: 'eq', value: filtros.id_usuario_navegacion },
    { column: 'id_caracteristica', op: 'eq', value: filtros.id_caracteristica },
    { column: 'id_colorluz', op: 'eq', value: filtros.id_colorluz },
    { column: 'id_color', op: 'eq', value: filtros.id_color },
    { column: 'id_modelo', op: 'eq', value: filtros.id_modelo },
    { column: 'id_forma', op: 'eq', value: filtros.id_forma },
    { column: 'id_material', op: 'eq', value: filtros.id_material },
    { column: 'altura', op: 'eq', value: filtros.altura },
    { column: 'elevacion', op: 'eq', value: filtros.elevacion },
    { column: 'profundidad', op: 'eq', value: filtros.profundidad },
    { column: 'luminica', op: 'eq', value: luminica },
    ...dateRangeFilters('created_at', filtros.desde, filtros.hasta),
  ];
};

const ListSenales = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin } = useAuth();
  const vistaParam = searchParams.get('vista');
  const vista: Vista = esVista(vistaParam) ? vistaParam : 'activas';

  // Los filtros se toman de la URL al abrir la pagina; despues cada cambio se refleja en ella.
  const [filtrosIniciales] = useState(() => filtrosDesdeUrl(searchParams));

  const {
    rows: senales,
    total,
    page,
    pageSize,
    setPage,
    order,
    toggleOrder,
    filters,
    setFilter: setFilterLista,
    loading,
    error,
    reload,
  } = useServerList<Senal, FiltrosSenales>({
    path: '/senales',
    select: COLUMNAS_LISTA,
    pageSize: 20,
    defaultOrder: { column: 'created_at', dir: 'desc' },
    initialFilters: filtrosIniciales,
    toFilters: (filtros) => toFiltros(filtros, vista),
    searchColumns: ['codigo_lsm', 'nombre', 'ubicacion'],
    searchKey: 'texto',
  });

  const setFilter = (clave: keyof FiltrosSenales, valor: string) => {
    setFilterLista(clave, valor);
    const parametro = PARAMETROS.find((p) => p.clave === clave)?.param;
    if (!parametro) return;
    setSearchParams((previos) => {
      const next = new URLSearchParams(previos);
      if (valor === '') next.delete(parametro);
      else next.set(parametro, valor);
      return next;
    }, { replace: true });
  };

  // Limpia los filtros y sus parametros de URL; la vista se mantiene.
  const limpiarFiltros = () => {
    PARAMETROS.forEach(({ clave }) => setFilterLista(clave, ''));
    setSearchParams((previos) => {
      const next = new URLSearchParams(previos);
      PARAMETROS.forEach(({ param }) => next.delete(param));
      return next;
    }, { replace: true });
  };

  // Selector de catalogo; vacio equivale a sin filtro.
  const selectorCatalogo = (
    etiqueta: string,
    clave: keyof FiltrosSenales,
    opciones: CatalogoItem[] | undefined,
    todos: 'Todos' | 'Todas'
  ) => (
    <FilterField label={etiqueta} className="w-full md:w-44">
      <Select
        value={filters[clave] || TODOS}
        onValueChange={(valor) => setFilter(clave, valor === TODOS ? '' : valor)}
      >
        <SelectTrigger className="w-full border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>{todos}</SelectItem>
          {opciones?.map((opcion) => (
            <SelectItem key={opcion.id} value={opcion.id}>{opcion.nombre}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FilterField>
);

// Campo numerico para valor exacto (altura, elevacion, profundidad).
const campoNumerico = (etiqueta: string, clave: 'altura' | 'elevacion' | 'profundidad') => (
    <FilterField label={etiqueta} className="w-full md:w-32">
      <Input
        type="number"
        step="any"
        value={filters[clave]}
        onChange={(e) => setFilter(clave, e.target.value)}
        placeholder="Valor exacto"
        className="w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />
    </FilterField>
);

const [catalogos, setCatalogos] = useState<CatalogosResponse | null>(null);
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [selectedSenal, setSelectedSenal] = useState<Senal | null>(null);
const [deleteLoading, setDeleteLoading] = useState(false);
const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

useEffect(() => {
    // getCatalogos ya registra el error; sin catalogos se muestran los ids.
    senalesService.getCatalogos().then(setCatalogos).catch(() => undefined);
}, []);

const tipoById = useMemo(
    () => new Map(catalogos?.tipos.map((t) => [t.id, t.nombre]) ?? []),
    [catalogos]
);
const estadoById = useMemo(
    () => new Map(catalogos?.estados.map((e) => [e.id, e.nombre]) ?? []),
    [catalogos]
);

// Cada campo con valor cuenta como filtro activo. La vista no cuenta.
const filtrosActivos = Object.values(filters).filter((valor) => valor !== '').length;

const cambiarVista = (nueva: Vista) => {
    setPage(1);
    setSearchParams((previos) => {
      const next = new URLSearchParams(previos);
      next.set('vista', nueva);
      return next;
    });
};

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
};

const confirmDelete = (senal: Senal) => {
    setSelectedSenal(senal);
    setDeleteDialogOpen(true);
};

const handleDelete = async () => {
    if (!selectedSenal) return;

    setDeleteLoading(true);
    try {
      const response = await senalesService.deleteSenal(selectedSenal.id_senal);
      setDeleteDialogOpen(false);
      setSelectedSenal(null);
      if (response.success) {
        setMensaje({ tipo: 'success', texto: 'Señal eliminada correctamente' });
        reload();
      } else {
        setMensaje({ tipo: 'error', texto: 'Error al eliminar: ' + (response.message ?? 'Error desconocido') });
      }
    } catch (error: unknown) {
      console.error('Error eliminando:', error);
      setMensaje({ tipo: 'error', texto: 'Error al conectar con el servidor' });
    } finally {
      setDeleteLoading(false);
    }
};

const handleEdit = (id: string) => {
    void navigate(`/gestion-senales/editar/${id}`);
};

const handleDetail = (id: string) => {
    void navigate(`/gestion-senales/${id}`);
};

const handleNew = () => {
    void navigate('/gestion-senales/nuevo');
};

return (
    <div className="w-full min-w-0">
      <PageHeader
        icon={<Anchor />}
        iconClassName="text-blue-600 dark:text-blue-400"
        title="Señales Marítimas"
        subtitle="Gestión de señales marítimas del sistema"
        actions={
          <>
            <Button variant="neutral" onClick={reload} className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button variant="neutral" onClick={() => navigate('/radioelectricas')} className="w-full sm:w-auto">
              Radioeléctricas
            </Button>
            <Button variant="brand" onClick={handleNew} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Señal
            </Button>
          </>
        }
      >
        {/* Vistas rápidas: cambian el criterio base de la consulta */}
        <PillTabs
          aria-label="Vista de señales"
          tabs={VISTAS.map((opcion) => ({ value: opcion.valor, label: opcion.etiqueta }))}
          value={vista}
          onChange={(valor) => {
            if (esVista(valor)) cambiarVista(valor);
          }}
        />
      </PageHeader>

      {/* Filtros: se consultan en el servidor */}
      <div className="mb-6">
        <FilterBar onReset={limpiarFiltros} activeCount={filtrosActivos}>
          <FilterField label="Buscar" className="w-full md:w-72">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-blue-400 dark:text-gray-500" />
              </div>
              <Input
                value={filters.texto}
                onChange={(e) => setFilter('texto', e.target.value)}
                placeholder="Buscar por código, nombre o ubicación"
                className="w-full pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </FilterField>

          <FilterField label="Tipo" className="w-full md:w-44">
            <Select
              value={filters.id_tipo || TODOS}
              onValueChange={(valor) => setFilter('id_tipo', valor === TODOS ? '' : valor)}
            >
              <SelectTrigger className="w-full border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos</SelectItem>
                {catalogos?.tipos.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id}>{tipo.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Estado" className="w-full md:w-44">
            <Select
              value={filters.id_estado || TODOS}
              onValueChange={(valor) => setFilter('id_estado', valor === TODOS ? '' : valor)}
            >
              <SelectTrigger className="w-full border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos</SelectItem>
                {catalogos?.estados.map((estado) => (
                  <SelectItem key={estado.id} value={estado.id}>{estado.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Zona" className="w-full md:w-44">
            <Select
              value={filters.id_zona || TODOS}
              onValueChange={(valor) => setFilter('id_zona', valor === TODOS ? '' : valor)}
            >
              <SelectTrigger className="w-full border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todas</SelectItem>
                {catalogos?.zonas.map((zona) => (
                  <SelectItem key={zona.id} value={zona.id}>{zona.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Empresa" className="w-full md:w-44">
            <Select
              value={filters.id_empresa || TODOS}
              onValueChange={(valor) => setFilter('id_empresa', valor === TODOS ? '' : valor)}
            >
              <SelectTrigger className="w-full border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todas</SelectItem>
                {catalogos?.empresas.map((empresa) => (
                  <SelectItem key={empresa.id} value={empresa.id}>{empresa.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Estación" className="w-full md:w-44">
            <Select
              value={filters.id_estacion || TODOS}
              onValueChange={(valor) => setFilter('id_estacion', valor === TODOS ? '' : valor)}
            >
              <SelectTrigger className="w-full border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todas</SelectItem>
                {catalogos?.estaciones.map((estacion) => (
                  <SelectItem key={estacion.id} value={estacion.id}>{estacion.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Categoría" className="w-full md:w-44">
            <Select
              value={filters.id_categoria || TODOS}
              onValueChange={(valor) => setFilter('id_categoria', valor === TODOS ? '' : valor)}
            >
              <SelectTrigger className="w-full border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todas</SelectItem>
                {catalogos?.categorias.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.id}>{categoria.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          {selectorCatalogo('Complejidad', 'id_complejidad', catalogos?.complejidades, 'Todas')}
          {selectorCatalogo('Usuario de navegación', 'id_usuario_navegacion', catalogos?.usuariosNavegacion, 'Todos')}
          {selectorCatalogo('Característica', 'id_caracteristica', catalogos?.caracteristicas, 'Todas')}
          {selectorCatalogo('Modelo', 'id_modelo', catalogos?.modelos, 'Todos')}
          {selectorCatalogo('Forma', 'id_forma', catalogos?.formas, 'Todas')}
          {selectorCatalogo('Material', 'id_material', catalogos?.materiales, 'Todos')}
          {selectorCatalogo('Color', 'id_color', catalogos?.colores, 'Todos')}
          {selectorCatalogo('Color de luz', 'id_colorluz', catalogos?.coloresLuz, 'Todos')}
          {campoNumerico('Altura', 'altura')}
          {campoNumerico('Elevación', 'elevacion')}
          {campoNumerico('Profundidad', 'profundidad')}

          {(vista === 'activas' || vista === 'bajas') && (
            <FilterField label="Lumínica" className="w-full md:w-36">
              <Select
                value={filters.luminica || TODOS}
                onValueChange={(valor) => setFilter('luminica', valor === TODOS ? '' : valor)}
              >
                <SelectTrigger className="w-full border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todas</SelectItem>
                  <SelectItem value="true">Sí</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
          )}

          {vista !== 'bajas' && (
            <FilterField label="Bajas" className="w-full md:w-40">
              <Select
                value={filters.bajas === '1' ? '1' : '0'}
                onValueChange={(valor) => setFilter('bajas', valor === '1' ? '1' : '')}
              >
                <SelectTrigger className="w-full border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Excluir</SelectItem>
                  <SelectItem value="1">Incluir</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
          )}

          <FilterField label="Creación desde" className="w-full md:w-40">
            <Input
              type="date"
              value={filters.desde}
              onChange={(e) => setFilter('desde', e.target.value)}
              className="w-full border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </FilterField>

          <FilterField label="Creación hasta" className="w-full md:w-40">
            <Input
              type="date"
              value={filters.hasta}
              onChange={(e) => setFilter('hasta', e.target.value)}
              className="w-full border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </FilterField>
        </FilterBar>
      </div>

      {mensaje && (
        <Alert
          className={mensaje.tipo === 'success'
            ? 'mb-6 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
            : 'mb-6 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}
      >
          <AlertDescription className={mensaje.tipo === 'success'
            ? 'text-green-700 dark:text-green-300'
            : 'text-red-700 dark:text-red-300'}>
            {mensaje.texto}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3 text-red-700 dark:text-red-300">
            {error}
            <Button variant="outline" size="sm" onClick={reload} className="dark:border-gray-600 dark:text-gray-300">
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <ListCard
        title="Listado de Señales"
        subtitle="Total de señales registradas en el sistema"
        actions={total > 0 ? (
          <span className="text-sm text-gray-500 dark:text-gray-400">({total} señales)</span>
        ) : undefined}
        footer={
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            loading={loading}
          />
        }
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando señales...</p>
            </div>
          </div>
        ) : senales.length === 0 ? (
          <EmptyState
            icon={<Anchor />}
            title={filtrosActivos > 0 ? 'No se encontraron señales' : 'No hay señales'}
            description={filtrosActivos > 0 ? 'Prueba con otros filtros' : 'Comienza agregando una nueva señal'}
            action={filtrosActivos === 0 ? (
              <Button onClick={handleNew} variant="brand">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Señal
              </Button>
            ) : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-100 dark:bg-gray-700">
                  <SortableHead column="codigo_lsm" label="Código LSM" order={order} onSort={toggleOrder} className="font-semibold" />
                  <SortableHead column="nombre" label="Nombre" order={order} onSort={toggleOrder} className="font-semibold" />
                  <TableHead className="font-semibold">Tipo</TableHead>
                  {vista === 'bajas' ? (
                    <SortableHead column="fecha_retirada" label="Fecha de retirada" order={order} onSort={toggleOrder} className="font-semibold" />
                  ) : (
                    <SortableHead column="ubicacion" label="Ubicación" order={order} onSort={toggleOrder} className="font-semibold" />
                  )}
                  <SortableHead column="luminica" label="Lumínica" order={order} onSort={toggleOrder} className="font-semibold" />
                  {vista === 'bajas' ? (
                    <TableHead className="font-semibold">Causa</TableHead>
                  ) : (
                    <TableHead className="font-semibold">Estado</TableHead>
                  )}
                  <SortableHead column="created_at" label="Fecha Creación" order={order} onSort={toggleOrder} className="font-semibold" />
                  <TableHead className="font-semibold text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {senales.map((senal) => (
                  <TableRow key={senal.id_senal} className="hover:bg-blue-50 dark:hover:bg-gray-700">
                    <TableCell className="font-mono font-medium">
                      {senal.codigo_lsm ?? 'S/N'}
                    </TableCell>
                    <TableCell>{senal.nombre ?? '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-100 dark:bg-gray-700">
                        {tipoById.get(senal.id_tipo) ?? senal.id_tipo ?? 'No especificado'}
                      </Badge>
                    </TableCell>
                    {vista === 'bajas' ? (
                      <TableCell>{formatDate(senal.fecha_retirada ?? undefined)}</TableCell>
                    ) : (
                      <TableCell>{senal.ubicacion ?? '-'}</TableCell>
                    )}
                    <TableCell>
                      {senal.luminica ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          Sí
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          No
                        </Badge>
                      )}
                    </TableCell>
                    {vista === 'bajas' ? (
                      <TableCell>{senal.causa_retirada ?? '—'}</TableCell>
                    ) : (
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-100 text-slate-800 dark:bg-gray-600 dark:text-gray-100">
                          {estadoById.get(senal.id_estado) ?? '—'}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell>{formatDate(senal.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Ver detalle de señal"
                          onClick={() => handleDetail(senal.id_senal)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {vista !== 'bajas' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Editar señal"
                            onClick={() => handleEdit(senal.id_senal)}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Eliminar señal"
                            onClick={() => confirmDelete(senal)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </ListCard>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la señal
              {selectedSenal && (
                <span className="font-semibold"> {selectedSenal.codigo_lsm ?? selectedSenal.nombre}</span>
              )}
              . Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ListSenales;
