import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServerList } from '@/hooks/useServerList';
import { dateRangeFilters, type Filter } from '@/lib/postgrest';
import { DatePickerField } from '@/components/common/DatePickerField';
import { FilterBar, FilterField } from '@/components/common/FilterBar';
import { Pagination } from '@/components/common/Pagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Check, Edit, Trash2 } from 'lucide-react';
import type { PlanMantenimiento } from '@/services/api/planMantApi';
import { etiquetaSenal } from '@/lib/utils';
import {
  aTextoLocal,
  CLASE_ESTADO_PLAN,
  ETIQUETA_ESTADO_PLAN,
  estadoPlan,
  fechaHoraLegible,
  inicioDelDia,
  type SenalOpcion,
  type TipoOpcion,
} from '@/lib/planMantenimiento';

interface FiltrosPlan {
  estado: string;
  id_senal: string;
  id_tipo_mant: string;
  desde: string;
  hasta: string;
}

interface ListaPlanProps {
  senales: SenalOpcion[];
  tipos: TipoOpcion[];
  version: number;
  onEditar: (plan: PlanMantenimiento) => void;
  onEliminar: (plan: PlanMantenimiento) => void;
}

// Radix Select no admite value vacio; esta opcion equivale a sin filtro.
const TODOS = '__all__';

const ESTADOS_FILTRO = [
  { valor: 'abiertos', etiqueta: 'Pendientes y vencidos' },
  { valor: 'pendientes', etiqueta: 'Pendientes' },
  { valor: 'vencidos', etiqueta: 'Vencidos' },
  { valor: 'cumplidos', etiqueta: 'Cumplidos' },
  { valor: 'todos', etiqueta: 'Todos' },
];

const FILTROS_INICIALES: FiltrosPlan = {
  estado: 'abiertos',
  id_senal: '',
  id_tipo_mant: '',
  desde: '',
  hasta: '',
};

// El estado se deriva: cumplido si fecha_cumplida tiene valor; vencido si no y fecha_plan es anterior a hoy.
const toFiltros = (filtros: FiltrosPlan): Filter[] => {
  const hoy = aTextoLocal(inicioDelDia());
  const resultado: Filter[] = [
    { column: 'id_senal', op: 'eq', value: filtros.id_senal },
    { column: 'id_tipo_mant', op: 'eq', value: filtros.id_tipo_mant },
    ...dateRangeFilters('fecha_plan', filtros.desde, filtros.hasta),
  ];

  switch (filtros.estado) {
    case 'abiertos':
      resultado.push({ column: 'fecha_cumplida', op: 'is', value: 'null' });
      break;
    case 'pendientes':
      resultado.push({ column: 'fecha_cumplida', op: 'is', value: 'null' }, { column: 'fecha_plan', op: 'gte', value: hoy });
      break;
    case 'vencidos':
      resultado.push({ column: 'fecha_cumplida', op: 'is', value: 'null' }, { column: 'fecha_plan', op: 'lt', value: hoy });
      break;
    case 'cumplidos':
      resultado.push({ column: 'fecha_cumplida', op: 'not_is', value: null });
      break;
    default:
      break;
  }

  return resultado;
};

export function ListaPlan({ senales, tipos, version, onEditar, onEliminar }: ListaPlanProps) {
  const navigate = useNavigate();

  const {
    rows,
    total,
    page,
    pageSize,
    setPage,
    filters,
    setFilter,
    resetFilters,
    loading,
    error,
    reload,
  } = useServerList<PlanMantenimiento, FiltrosPlan>({
    path: '/plan_mantenimiento',
    pageSize: 20,
    defaultOrder: { column: 'fecha_plan', dir: 'asc' },
    initialFilters: FILTROS_INICIALES,
    toFilters: toFiltros,
  });

  // Recarga cuando la pagina padre guarda o elimina un plan (no en el montaje)
  const versionMontaje = useRef(version);
  useEffect(() => {
    if (version !== versionMontaje.current) reload();
  }, [version, reload]);

  // El estado no cuenta como filtro activo: siempre tiene un valor.
  const filtrosActivos = Object.entries(filters).filter(([clave, valor]) => clave !== 'estado' && valor !== '').length;

  const senalPorId = new Map(senales.map((senal) => [senal.id_senal, senal]));
  const tipoPorId = new Map(tipos.map((tipo) => [tipo.id_tipo_mant, tipo.nombre]));

  const cumplir = (plan: PlanMantenimiento) => {
    void navigate(`/gestion-mant/nuevo?senal=${plan.id_senal}&plan=${plan.id_plan_mantenimiento}`);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <FilterBar onReset={resetFilters} activeCount={filtrosActivos}>
          <FilterField label="Estado" className="w-full md:w-52">
            <Select value={filters.estado} onValueChange={(valor) => setFilter('estado', valor)}>
              <SelectTrigger className="w-full dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_FILTRO.map((estado) => (
                  <SelectItem key={estado.valor} value={estado.valor}>{estado.etiqueta}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                {tipos.map((tipo) => (
                  <SelectItem key={tipo.id_tipo_mant} value={tipo.id_tipo_mant}>{tipo.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Fecha desde" className="w-full md:w-40">
            <DatePickerField
              value={filters.desde}
              onChange={(valor) => setFilter('desde', valor)}
              aria-label="Fecha desde"
              className="w-full"
            />
          </FilterField>

          <FilterField label="Fecha hasta" className="w-full md:w-40">
            <DatePickerField
              value={filters.hasta}
              onChange={(valor) => setFilter('hasta', valor)}
              aria-label="Fecha hasta"
              className="w-full"
            />
          </FilterField>
        </FilterBar>
      </div>

      {error && (
        <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3 text-red-700 dark:text-red-300">
            {error}
            <Button variant="outline" size="sm" onClick={reload} className="dark:border-gray-600 dark:text-gray-300">
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-600 dark:text-gray-300">Cargando planes...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {filtrosActivos > 0 || filters.estado !== 'abiertos'
                ? 'No hay planes con esos filtros'
                : 'No hay planes pendientes ni vencidos'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-700">
                  <TableHead className="font-semibold">Señal</TableHead>
                  <TableHead className="font-semibold">Tipo</TableHead>
                  <TableHead className="font-semibold">Fecha plan</TableHead>
                  <TableHead className="font-semibold">Trabajo y medios</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="font-semibold text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((plan) => {
                  const senal = senalPorId.get(plan.id_senal);
                  const estado = estadoPlan(plan);
                  return (
                    <TableRow key={plan.id_plan_mantenimiento} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <TableCell>
                        <div className="font-medium">{senal?.codigo_lsm ?? '—'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{senal?.nombre ?? ''}</div>
                      </TableCell>
                      <TableCell>{plan.id_tipo_mant ? tipoPorId.get(plan.id_tipo_mant) ?? '—' : '—'}</TableCell>
                      <TableCell>{fechaHoraLegible(plan.fecha_plan)}</TableCell>
                      <TableCell className="max-w-xs truncate" title={plan.trabajo_medios ?? undefined}>
                        {plan.trabajo_medios ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge className={CLASE_ESTADO_PLAN[estado]}>{ETIQUETA_ESTADO_PLAN[estado]}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          {estado !== 'cumplido' && (
                            <Button variant="outline" onClick={() => cumplir(plan)}>
                              <Check />
                              Cumplir
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Editar plan"
                            onClick={() => onEditar(plan)}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Eliminar plan"
                            onClick={() => onEliminar(plan)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        <div className="border-t border-gray-200 px-6 dark:border-gray-700">
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} loading={loading} />
        </div>
      </div>
    </div>
  );
}
