import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { senalesService, type CatalogosResponse } from '@/services/api/senalesApi';
import { useServerList } from '@/hooks/useServerList';
import { dateRangeFilters, type Filter } from '@/lib/postgrest';

// Componentes shadcn
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
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
import { FilterBar, FilterField } from '@/components/common/FilterBar';
import { Pagination } from '@/components/common/Pagination';
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
}

interface FiltrosSenales {
  texto: string;
  id_tipo: string;
  id_estado: string;
  id_zona: string;
  id_empresa: string;
  luminica: string;
  desde: string;
  hasta: string;
}

// Radix Select no admite value vacio; esta opcion equivale a sin filtro.
const TODOS = '__all__';

const FILTROS_INICIALES: FiltrosSenales = {
  texto: '',
  id_tipo: '',
  id_estado: '',
  id_zona: '',
  id_empresa: '',
  luminica: '',
  desde: '',
  hasta: '',
};

const COLUMNAS_LISTA = 'id_senal,codigo_lsm,nombre,id_tipo,ubicacion,luminica,id_estado,created_at';

const toFiltros = (filtros: FiltrosSenales): Filter[] => [
  { column: 'id_tipo', op: 'eq', value: filtros.id_tipo },
  { column: 'id_estado', op: 'eq', value: filtros.id_estado },
  { column: 'id_zona', op: 'eq', value: filtros.id_zona },
  { column: 'id_empresa', op: 'eq', value: filtros.id_empresa },
  { column: 'luminica', op: 'eq', value: filtros.luminica },
  ...dateRangeFilters('created_at', filtros.desde, filtros.hasta),
];

const ListSenales = () => {
  const navigate = useNavigate();

  const {
    rows: senales,
    total,
    page,
    pageSize,
    setPage,
    order,
    toggleOrder,
    filters,
    setFilter,
    resetFilters,
    loading,
    error,
    reload,
  } = useServerList<Senal, FiltrosSenales>({
    path: '/senales',
    select: COLUMNAS_LISTA,
    pageSize: 20,
    defaultOrder: { column: 'created_at', dir: 'desc' },
    initialFilters: FILTROS_INICIALES,
    toFilters: toFiltros,
    searchColumns: ['codigo_lsm', 'nombre', 'ubicacion'],
    searchKey: 'texto',
  });

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

  // Cada campo con valor cuenta como filtro activo (solo sobre los 8 campos de filtro).
  const filtrosActivos = Object.values(filters).filter((valor) => valor !== '').length;

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
    <div>
      {/* Header con título y acciones */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Anchor className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Señales Marítimas
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gestión de señales marítimas del sistema
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={reload}
            className="w-full sm:w-auto border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button
            onClick={handleNew}
            className="w-full sm:w-auto bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Señal
          </Button>
        </div>
      </div>

      {/* Filtros: se consultan en el servidor */}
      <div className="mb-6">
        <FilterBar onReset={resetFilters} activeCount={filtrosActivos}>
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

      <Card className="shadow-xl border-blue-200 dark:border-gray-700 dark:bg-gray-800">
        <CardHeader className="bg-white border-b border-blue-200 dark:bg-gray-800 dark:border-gray-700">
          <CardTitle className="text-xl text-gray-800 dark:text-white">
            Listado de Señales
            {total > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({total} señales)
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Total de señales registradas en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando señales...</p>
              </div>
            </div>
          ) : senales.length === 0 ? (
            <div className="text-center py-12">
              <Anchor className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {filtrosActivos > 0 ? 'No se encontraron señales' : 'No hay señales'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {filtrosActivos > 0 ? 'Prueba con otros filtros' : 'Comienza agregando una nueva señal'}
              </p>
              {filtrosActivos === 0 && (
                <Button onClick={handleNew} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Señal
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-100 dark:bg-gray-700">
                    <SortableHead column="codigo_lsm" label="Código LSM" order={order} onSort={toggleOrder} className="font-semibold" />
                    <SortableHead column="nombre" label="Nombre" order={order} onSort={toggleOrder} className="font-semibold" />
                    <TableHead className="font-semibold">Tipo</TableHead>
                    <SortableHead column="ubicacion" label="Ubicación" order={order} onSort={toggleOrder} className="font-semibold" />
                    <SortableHead column="luminica" label="Lumínica" order={order} onSort={toggleOrder} className="font-semibold" />
                    <TableHead className="font-semibold">Estado</TableHead>
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
                      <TableCell>{senal.ubicacion ?? '-'}</TableCell>
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
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-100 text-slate-800 dark:bg-gray-600 dark:text-gray-100">
                          {estadoById.get(senal.id_estado) ?? '—'}
                        </Badge>
                      </TableCell>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Editar señal"
                            onClick={() => handleEdit(senal.id_senal)}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Eliminar señal"
                            onClick={() => confirmDelete(senal)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t border-gray-200 bg-transparent dark:border-gray-700 dark:bg-transparent px-6">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            loading={loading}
          />
        </CardFooter>
      </Card>

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
              onClick={handleDelete}
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
