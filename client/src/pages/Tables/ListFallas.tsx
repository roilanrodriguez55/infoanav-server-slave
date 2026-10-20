import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fallasService } from '@/services/api/fallasApi';
import { senalesService } from '@/services/api/senalesApi';
import { useServerList } from '@/hooks/useServerList';
import { dateRangeFilters, type Filter } from '@/lib/postgrest';

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
import { DatePickerField } from '@/components/common/DatePickerField';
import { ListCard } from '@/components/common/ListCard';
import { Pagination } from '@/components/common/Pagination';
import { PageHeader } from '@/components/common/PageHeader';
import { SortableHead } from '@/components/common/SortableHead';
import {
  Search,
  Plus,
  Edit,
  Eye,
  Trash2,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  User
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { etiquetaSenal } from '@/lib/utils';

interface FallaFila {
  id_falla: string;
  fecha_falla: string;
  fecha_restablecer: string | null;
  id_tipo_falla: string | null;
  id_origen_falla: string | null;
  id_senal: string;
  causa_de_falla: string | null;
  reporto: string | null;
  observaciones: string | null;
  senales: { codigo_lsm: string; nombre: string } | null;
}

interface TipoFalla {
  id_tipo_falla: string;
  nombre: string;
}

interface OrigenFalla {
  id_origen_falla: string;
  nombre: string;
}

interface SenalOpcion {
  id_senal: string;
  codigo_lsm: string;
  nombre: string;
}

interface FiltrosFallas {
  texto: string;
  id_senal: string;
  id_tipo_falla: string;
  id_origen_falla: string;
  estado: string;
  desde: string;
  hasta: string;
}

// Radix Select no admite value vacio; esta opcion equivale a sin filtro.
const TODOS = '__all__';

const FILTROS_INICIALES: FiltrosFallas = {
  texto: '',
  id_senal: '',
  id_tipo_falla: '',
  id_origen_falla: '',
  estado: '',
  desde: '',
  hasta: '',
};

const SELECT_FALLAS = 'id_falla,fecha_falla,fecha_restablecer,id_tipo_falla,id_origen_falla,id_senal,causa_de_falla,reporto,observaciones,senales(codigo_lsm,nombre)';

// Abierta: fecha_restablecer nula. Restablecida: fecha_restablecer con valor.
const filtroEstado = (estado: string): Filter[] => {
  if (estado === 'abiertas') return [{ column: 'fecha_restablecer', op: 'is', value: null }];
  if (estado === 'restablecidas') return [{ column: 'fecha_restablecer', op: 'not_is', value: null }];
  return [];
};

const toFiltros = (filtros: FiltrosFallas): Filter[] => [
  { column: 'id_senal', op: 'eq', value: filtros.id_senal },
  { column: 'id_tipo_falla', op: 'eq', value: filtros.id_tipo_falla },
  { column: 'id_origen_falla', op: 'eq', value: filtros.id_origen_falla },
  ...filtroEstado(filtros.estado),
  ...dateRangeFilters('fecha_falla', filtros.desde, filtros.hasta),
];

const ListFallas = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    rows: fallas,
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
  } = useServerList<FallaFila, FiltrosFallas>({
    path: '/fallas',
    select: SELECT_FALLAS,
    pageSize: 20,
    defaultOrder: { column: 'fecha_falla', dir: 'desc' },
    initialFilters: FILTROS_INICIALES,
    toFilters: toFiltros,
    searchColumns: ['causa_de_falla', 'reporto', 'observaciones'],
    searchKey: 'texto',
  });

  const [senales, setSenales] = useState<SenalOpcion[]>([]);
  const [tiposFalla, setTiposFalla] = useState<TipoFalla[]>([]);
  const [origenesFalla, setOrigenesFalla] = useState<OrigenFalla[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFalla, setSelectedFalla] = useState<FallaFila | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // Enlaces desde la ficha de señal: ?senal=<id> preselecciona el filtro de señal.
  useEffect(() => {
    const senal = searchParams.get('senal');
    if (senal) setFilter('id_senal', senal);
  }, [searchParams, setFilter]);

  useEffect(() => {
    // Los catalogos solo llenan las opciones de los filtros; si fallan, los selects quedan en "Todos".
    void senalesService.getSenales().then((res) => {
      if (res.success && Array.isArray(res.data)) setSenales(res.data as SenalOpcion[]);
    });
    void fallasService.getTiposFalla().then((res) => {
      if (res.success && Array.isArray(res.data)) setTiposFalla(res.data as TipoFalla[]);
    });
    void fallasService.getOrigenesFalla().then((res) => {
      if (res.success && Array.isArray(res.data)) setOrigenesFalla(res.data as OrigenFalla[]);
    });
  }, []);

  const tipoById = useMemo(
    () => new Map(tiposFalla.map((t) => [t.id_tipo_falla, t.nombre])),
    [tiposFalla]
  );

  // Cada campo con valor cuenta como filtro activo (solo sobre los 7 campos de filtro).
  const filtrosActivos = Object.values(filters).filter((valor) => valor !== '').length;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES');
  };

  const getSenalNombre = (falla: FallaFila) => {
    if (!falla.senales) return falla.id_senal;
    return etiquetaSenal(falla.senales.codigo_lsm, falla.senales.nombre);
  };

  const confirmDelete = (falla: FallaFila) => {
    setSelectedFalla(falla);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedFalla) return;

    setDeleteLoading(true);
    try {
      const response = await fallasService.delete(selectedFalla.id_falla);
      setDeleteDialogOpen(false);
      setSelectedFalla(null);
      if (response.success) {
        setMensaje({ tipo: 'success', texto: 'Falla eliminada correctamente' });
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

  const handleDetail = (id: string) => {
    void navigate(`/gestion-fallas/${id}`);
  };

  const handleEdit = (id: string) => {
    void navigate(`/gestion-fallas/editar/${id}`);
  };

  const handleNew = () => {
    void navigate('/gestion-fallas/nuevo');
  };

  return (
    <div className="w-full min-w-0">
      <PageHeader
        icon={<AlertTriangle />}
        title="Gestión de Fallas"
        subtitle="Administre las fallas registradas en el sistema"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => setFilter('estado', 'abiertas')}
              className="w-full sm:w-auto border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Fuera de servicio actualmente
            </Button>
            <Button variant="neutral" onClick={reload} className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button variant="brand" onClick={handleNew} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Falla
            </Button>
          </>
        }
      />

      {/* Filtros: se consultan en el servidor */}
      <div className="mb-6">
        <FilterBar onReset={resetFilters} activeCount={filtrosActivos}>
          <FilterField label="Buscar" className="w-full md:w-72">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-icon" />
              </div>
              <Input
                value={filters.texto}
                onChange={(e) => setFilter('texto', e.target.value)}
                placeholder="Buscar por causa, quién reportó u observaciones"
                className="w-full pl-10 border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </FilterField>

          <FilterField label="Señal" className="w-full md:w-64">
            <Select
              value={filters.id_senal || TODOS}
              onValueChange={(valor) => setFilter('id_senal', valor === TODOS ? '' : valor)}
            >
              <SelectTrigger className="w-full dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todas</SelectItem>
                {senales.map((senal) => (
                  <SelectItem key={senal.id_senal} value={senal.id_senal}>
                    {etiquetaSenal(senal.codigo_lsm, senal.nombre)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Tipo de falla" className="w-full md:w-44">
            <Select
              value={filters.id_tipo_falla || TODOS}
              onValueChange={(valor) => setFilter('id_tipo_falla', valor === TODOS ? '' : valor)}
            >
              <SelectTrigger className="w-full dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos</SelectItem>
                {tiposFalla.map((tipo) => (
                  <SelectItem key={tipo.id_tipo_falla} value={tipo.id_tipo_falla}>{tipo.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Origen" className="w-full md:w-44">
            <Select
              value={filters.id_origen_falla || TODOS}
              onValueChange={(valor) => setFilter('id_origen_falla', valor === TODOS ? '' : valor)}
            >
              <SelectTrigger className="w-full dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos</SelectItem>
                {origenesFalla.map((origen) => (
                  <SelectItem key={origen.id_origen_falla} value={origen.id_origen_falla}>{origen.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Estado" className="w-full md:w-44">
            <Select
              value={filters.estado || TODOS}
              onValueChange={(valor) => setFilter('estado', valor === TODOS ? '' : valor)}
            >
              <SelectTrigger className="w-full dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todas</SelectItem>
                <SelectItem value="abiertas">Abiertas</SelectItem>
                <SelectItem value="restablecidas">Restablecidas</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Fecha desde" className="w-full md:w-40">
            <DatePickerField
              value={filters.desde}
              onChange={(valor) => setFilter('desde', valor)}
              aria-label="Fecha desde"
              className="w-full dark:text-white"
            />
          </FilterField>

          <FilterField label="Fecha hasta" className="w-full md:w-40">
            <DatePickerField
              value={filters.hasta}
              onChange={(valor) => setFilter('hasta', valor)}
              aria-label="Fecha hasta"
              className="w-full dark:text-white"
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
        title="Listado de Fallas"
        subtitle="Total de fallas registradas en el sistema"
        actions={total > 0 ? (
          <span className="text-sm text-gray-500 dark:text-gray-400">({total} registros)</span>
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Cargando fallas...</p>
            </div>
          </div>
        ) : fallas.length === 0 ? (
          <EmptyState
            icon={<AlertTriangle />}
            title={filtrosActivos > 0 ? 'No se encontraron fallas' : 'No hay fallas'}
            description={filtrosActivos > 0 ? 'Prueba con otros filtros' : 'Comienza agregando una nueva falla'}
            action={filtrosActivos === 0 ? (
              <Button onClick={handleNew} variant="brand">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Falla
              </Button>
            ) : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-700">
                  <TableHead className="font-semibold">Señal</TableHead>
                  <SortableHead column="fecha_falla" label="Fecha" order={order} onSort={toggleOrder} className="font-semibold" />
                  <TableHead className="font-semibold">Tipo</TableHead>
                  <SortableHead column="causa_de_falla" label="Causa" order={order} onSort={toggleOrder} className="font-semibold" />
                  <SortableHead column="reporto" label="Reportó" order={order} onSort={toggleOrder} className="font-semibold" />
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="font-semibold text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fallas.map((falla) => (
                  <TableRow key={falla.id_falla} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <TableCell className="max-w-56 truncate" title={getSenalNombre(falla)}>
                      {getSenalNombre(falla)}
                    </TableCell>
                    <TableCell>{formatDate(falla.fecha_falla)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-gray-100 dark:bg-gray-700">
                        {falla.id_tipo_falla
                          ? tipoById.get(falla.id_tipo_falla) ?? falla.id_tipo_falla
                          : 'No especificado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {falla.causa_de_falla ?? '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-icon" />
                        <span>{falla.reporto ?? '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {falla.fecha_restablecer ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          Restablecida
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                          Abierta
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Ver detalle de falla"
                          onClick={() => handleDetail(falla.id_falla)}
                          className="text-icon hover:text-icon-strong"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Editar falla"
                          onClick={() => handleEdit(falla.id_falla)}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Eliminar falla"
                          onClick={() => confirmDelete(falla)}
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
      </ListCard>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la falla
              {selectedFalla && (
                <span className="font-semibold"> del {formatDate(selectedFalla.fecha_falla)}</span>
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

export default ListFallas;
