import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mantenimientosService } from '@/services/api/mantenApi';
import { senalesService } from '@/services/api/senalesApi';
import { useServerList } from '@/hooks/useServerList';
import { dateRangeFilters, type Filter } from '@/lib/postgrest';
import { textoTiempoEmpleado } from '@/lib/planMantenimiento';

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
  Wrench,
  User
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { etiquetaSenal } from '@/lib/utils';

interface MantenimientoFila {
  id_mantenimiento: string;
  ident_mantenimiento: string | null;
  id_tipo_mant: string | null;
  id_estado_senal: string | null;
  id_senal: string;
  fecha_inicio: string | null;
  tiempo_empleado: string | number | null;
  trabajo_realizado: string | null;
  informa: string | null;
  aseguro: string | null;
  costo_mn: number | null;
}

interface TipoMantenimiento {
  id_tipo_mant: string;
  nombre: string;
}

interface EstadoSenal {
  id_estado_senal: string;
  nombre: string;
}

interface SenalOpcion {
  id_senal: string;
  codigo_lsm: string;
  nombre: string;
}

interface FiltrosMant {
  texto: string;
  id_senal: string;
  id_tipo_mant: string;
  id_estado_senal: string;
  desde: string;
  hasta: string;
}

// Radix Select no admite value vacio; esta opcion equivale a sin filtro.
const TODOS = '__all__';

const FILTROS_INICIALES: FiltrosMant = {
  texto: '',
  id_senal: '',
  id_tipo_mant: '',
  id_estado_senal: '',
  desde: '',
  hasta: '',
};

const SELECT_MANTENIMIENTOS = 'id_mantenimiento,ident_mantenimiento,id_tipo_mant,id_estado_senal,id_senal,fecha_inicio,tiempo_empleado,trabajo_realizado,informa,aseguro,costo_mn';

const toFiltros = (filtros: FiltrosMant): Filter[] => [
  { column: 'id_senal', op: 'eq', value: filtros.id_senal },
  { column: 'id_tipo_mant', op: 'eq', value: filtros.id_tipo_mant },
  { column: 'id_estado_senal', op: 'eq', value: filtros.id_estado_senal },
  ...dateRangeFilters('fecha_inicio', filtros.desde, filtros.hasta),
];

const ListMantenimientos = () => {
  const navigate = useNavigate();

  const {
    rows: mantenimientos,
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
  } = useServerList<MantenimientoFila, FiltrosMant>({
    path: '/mantenimientos',
    select: SELECT_MANTENIMIENTOS,
    pageSize: 20,
    defaultOrder: { column: 'fecha_inicio', dir: 'desc' },
    initialFilters: FILTROS_INICIALES,
    toFilters: toFiltros,
    searchColumns: ['ident_mantenimiento', 'trabajo_realizado', 'informa', 'aseguro'],
    searchKey: 'texto',
  });

  const [senales, setSenales] = useState<SenalOpcion[]>([]);
  const [tiposMantenimiento, setTiposMantenimiento] = useState<TipoMantenimiento[]>([]);
  const [estadosSenal, setEstadosSenal] = useState<EstadoSenal[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMantenimiento, setSelectedMantenimiento] = useState<MantenimientoFila | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    // Los catalogos solo llenan las opciones de los filtros; si fallan, los selects quedan en "Todos".
    void senalesService.getSenales().then((res) => {
      if (res.success && Array.isArray(res.data)) setSenales(res.data as SenalOpcion[]);
    });
    void mantenimientosService.getTiposMantenimiento().then((res) => {
      if (res.success && Array.isArray(res.data)) setTiposMantenimiento(res.data as TipoMantenimiento[]);
    });
    void mantenimientosService.getEstadosSenal().then((res) => {
      if (res.success && Array.isArray(res.data)) setEstadosSenal(res.data as EstadoSenal[]);
    });
  }, []);

  const tipoById = useMemo(
    () => new Map(tiposMantenimiento.map((t) => [t.id_tipo_mant, t.nombre])),
    [tiposMantenimiento]
  );

  // Cada campo con valor cuenta como filtro activo (solo sobre los 6 campos de filtro).
  const filtrosActivos = Object.values(filters).filter((valor) => valor !== '').length;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES');
  };

  const formatCurrency = (value?: number | null) => {
    if (value === null || value === undefined) return '$0.00';
    return `$${value.toFixed(2)}`;
  };

  const getTipoNombre = (id?: string | null) => {
    if (!id) return 'No especificado';
    return tipoById.get(id) ?? id;
  };

  const confirmDelete = (mantenimiento: MantenimientoFila) => {
    setSelectedMantenimiento(mantenimiento);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedMantenimiento) return;

    setDeleteLoading(true);
    try {
      const response = await mantenimientosService.delete(selectedMantenimiento.id_mantenimiento);
      setDeleteDialogOpen(false);
      setSelectedMantenimiento(null);
      if (response.success) {
        setMensaje({ tipo: 'success', texto: 'Mantenimiento eliminado correctamente' });
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
    void navigate(`/gestion-mant/${id}`);
  };

  const handleEdit = (id: string) => {
    void navigate(`/gestion-mant/editar/${id}`);
  };

  const handleNew = () => {
    void navigate('/gestion-mant/nuevo');
  };

  return (
    <div className="w-full min-w-0">
      <PageHeader
        icon={<Wrench />}
        title="Gestión de Mantenimientos"
        subtitle="Administre los mantenimientos de las señales marítimas"
        actions={
          <>
            <Button variant="neutral" onClick={reload} className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button variant="brand" onClick={handleNew} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Mantenimiento
            </Button>
          </>
        }
      >
        {/* Conmutador entre mantenimientos realizados y plan */}
        <PillTabs
          tabs={[
            { value: 'realizados', label: 'Realizados' },
            { value: 'plan', label: 'Plan' },
          ]}
          value="realizados"
          onChange={(valor) => {
            if (valor === 'plan') void navigate('/plan-mantenimiento');
          }}
        />
      </PageHeader>

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
                placeholder="Buscar por identificador, trabajo realizado o responsable"
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

          <FilterField label="Tipo de mantenimiento" className="w-full md:w-52">
            <Select
              value={filters.id_tipo_mant || TODOS}
              onValueChange={(valor) => setFilter('id_tipo_mant', valor === TODOS ? '' : valor)}
            >
              <SelectTrigger className="w-full dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos</SelectItem>
                {tiposMantenimiento.map((tipo) => (
                  <SelectItem key={tipo.id_tipo_mant} value={tipo.id_tipo_mant}>{tipo.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Estado de la señal" className="w-full md:w-48">
            <Select
              value={filters.id_estado_senal || TODOS}
              onValueChange={(valor) => setFilter('id_estado_senal', valor === TODOS ? '' : valor)}
            >
              <SelectTrigger className="w-full dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos</SelectItem>
                {estadosSenal.map((estado) => (
                  <SelectItem key={estado.id_estado_senal} value={estado.id_estado_senal}>{estado.nombre}</SelectItem>
                ))}
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
        title="Listado de Mantenimientos"
        subtitle="Total de mantenimientos registrados en el sistema"
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
              <p className="mt-4 text-gray-600 dark:text-gray-300">Cargando mantenimientos...</p>
            </div>
          </div>
        ) : mantenimientos.length === 0 ? (
          <EmptyState
            icon={<Wrench />}
            title={filtrosActivos > 0 ? 'No se encontraron mantenimientos' : 'No hay mantenimientos'}
            description={filtrosActivos > 0 ? 'Prueba con otros filtros' : 'Comienza agregando un nuevo mantenimiento'}
            action={filtrosActivos === 0 ? (
              <Button onClick={handleNew} variant="brand">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Mantenimiento
              </Button>
            ) : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-700">
                  <SortableHead column="ident_mantenimiento" label="ID" order={order} onSort={toggleOrder} className="font-semibold" />
                  <TableHead className="font-semibold">Tipo</TableHead>
                  <SortableHead column="fecha_inicio" label="Fecha Inicio" order={order} onSort={toggleOrder} className="font-semibold" />
                  <TableHead className="font-semibold">Tiempo</TableHead>
                  <SortableHead column="trabajo_realizado" label="Trabajo Realizado" order={order} onSort={toggleOrder} className="font-semibold" />
                  <TableHead className="font-semibold">Responsable</TableHead>
                  <SortableHead column="costo_mn" label="Costo MN" order={order} onSort={toggleOrder} className="font-semibold" />
                  <TableHead className="font-semibold text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mantenimientos.map((mant) => (
                  <TableRow key={mant.id_mantenimiento} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <TableCell className="font-medium">
                      {mant.ident_mantenimiento ?? 'S/N'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-gray-100 dark:bg-gray-700">
                        {getTipoNombre(mant.id_tipo_mant)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(mant.fecha_inicio)}
                    </TableCell>
                    <TableCell>
                      {mant.tiempo_empleado !== null ? (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {textoTiempoEmpleado(mant.tiempo_empleado)}
                        </Badge>
                      ) : (
                        <Badge variant="outline">-</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {mant.trabajo_realizado ?? '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-icon" />
                        <span>{mant.informa ?? mant.aseguro ?? '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(mant.costo_mn)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Ver detalle de mantenimiento"
                          onClick={() => handleDetail(mant.id_mantenimiento)}
                          className="text-icon hover:text-icon-strong"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Editar mantenimiento"
                          onClick={() => handleEdit(mant.id_mantenimiento)}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Eliminar mantenimiento"
                          onClick={() => confirmDelete(mant)}
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
              Esta acción eliminará permanentemente el mantenimiento
              {selectedMantenimiento && (
                <span className="font-semibold"> {selectedMantenimiento.ident_mantenimiento ?? 'S/N'}</span>
              )}
              . Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { void handleDelete(); }}
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

export default ListMantenimientos;
