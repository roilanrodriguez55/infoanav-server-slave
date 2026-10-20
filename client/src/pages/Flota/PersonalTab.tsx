import { useState, type MouseEvent } from 'react';
import { Plus, Search, Users } from 'lucide-react';
import { useServerList } from '@/hooks/useServerList';
import { DetailPanel } from '@/components/common/DetailPanel';
import { EmptyState } from '@/components/common/EmptyState';
import { FilterBar, FilterField } from '@/components/common/FilterBar';
import { ListCard } from '@/components/common/ListCard';
import { Pagination } from '@/components/common/Pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';
import { PERSONAL_PATH, flotaService, type PersonaRegistro } from '@/services/api/flotaApi';
import type { Filter } from '@/lib/postgrest';
import { cn } from '@/lib/utils';
import { fechaLocal } from '@/services/api/documentacionApi';
import PersonaForm from './PersonaForm';

type Estado = 'activos' | 'bajas';

interface FiltrosPersonal {
  texto: string;
  letra: string;
  estado: Estado;
}

type PersonaFila = PersonaRegistro & {
  nombre: string | null;
  primer_apellido: string | null;
  segundo_apellido: string | null;
  cargo: string | null;
  telefono: string | null;
  carne_identidad: string | null;
  fecha_baja: string | null;
  empresa: { nombre: string } | null;
};

const FILTROS_INICIALES: FiltrosPersonal = { texto: '', letra: '', estado: 'activos' };

const LETRAS = Array.from({ length: 26 }, (_, indice) => String.fromCharCode(65 + indice));

const siguienteLetra = (letra: string): string => String.fromCharCode(letra.charCodeAt(0) + 1);

// Letra inicial del primer apellido: rango [letra, siguiente letra). La Z no tiene limite superior.
const toFiltros = (filtros: FiltrosPersonal): Filter[] => [
  { column: 'fecha_baja', op: filtros.estado === 'activos' ? 'is' : 'not_is', value: null },
  ...(filtros.letra
    ? [
        { column: 'primer_apellido', op: 'gte' as const, value: filtros.letra },
        ...(filtros.letra === 'Z'
          ? []
          : [{ column: 'primer_apellido', op: 'lt' as const, value: siguienteLetra(filtros.letra) }]),
      ]
    : []),
];

const formatearFecha = (fecha: string): string => {
  const [anio, mes, dia] = fecha.slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
};

const nombreCompleto = (persona: PersonaFila): string =>
  [persona.primer_apellido, persona.segundo_apellido, persona.nombre].filter((parte) => parte).join(' ');

export default function PersonalTab() {
  const { isAdmin } = useAuth();
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
  } = useServerList<PersonaFila, FiltrosPersonal>({
    path: PERSONAL_PATH,
    select: '*,empresa:empresas(nombre)',
    pageSize: 20,
    defaultOrder: { column: 'primer_apellido', dir: 'asc' },
    initialFilters: FILTROS_INICIALES,
    toFilters: toFiltros,
    searchColumns: ['nombre', 'primer_apellido', 'segundo_apellido'],
    searchKey: 'texto',
  });

  const [edicion, setEdicion] = useState<{ persona: PersonaFila | null } | null>(null);
  const [bajaPara, setBajaPara] = useState<PersonaFila | null>(null);
  const [fechaBaja, setFechaBaja] = useState('');
  const [causaBaja, setCausaBaja] = useState('');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [guardandoBaja, setGuardandoBaja] = useState(false);

  const abrirBaja = (persona: PersonaFila, evento: MouseEvent) => {
    evento.stopPropagation();
    setBajaPara(persona);
    setFechaBaja(fechaLocal());
    setCausaBaja('');
  };

  const confirmarBaja = async () => {
    if (!bajaPara || !fechaBaja) return;
    setGuardandoBaja(true);
    const respuesta = await flotaService.darBaja(bajaPara.id_persona, fechaBaja, causaBaja.trim() || null);
    setGuardandoBaja(false);
    setMensaje(respuesta.success ? 'Baja registrada.' : respuesta.message);
    setBajaPara(null);
    if (respuesta.success) reload();
  };

  const reactivar = async (persona: PersonaFila, evento: MouseEvent) => {
    evento.stopPropagation();
    const respuesta = await flotaService.reactivar(persona.id_persona);
    setMensaje(respuesta.success ? 'Persona reactivada.' : respuesta.message);
    if (respuesta.success) reload();
  };

  const aviso = error ?? mensaje;
  const filtrosActivos = [filters.texto, filters.letra].filter((valor) => valor !== '').length;
  const estadoActual = filters.estado;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={estadoActual === 'activos' ? 'default' : 'outline'}
          onClick={() => setFilter('estado', 'activos')}
        >
          Activos
        </Button>
        <Button
          variant={estadoActual === 'bajas' ? 'default' : 'outline'}
          onClick={() => setFilter('estado', 'bajas')}
        >
          Bajas
        </Button>
      </div>

      <div className="flex flex-wrap gap-1" role="group" aria-label="Filtro por primer apellido">
        <Button
          size="sm"
          variant={filters.letra === '' ? 'default' : 'outline'}
          onClick={() => setFilter('letra', '')}
        >
          Todos
        </Button>
        {LETRAS.map((letra) => (
          <Button
            key={letra}
            size="sm"
            variant={filters.letra === letra ? 'default' : 'outline'}
            className="min-w-8 px-2"
            onClick={() => setFilter('letra', letra)}
          >
            {letra}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">Personal de la flota: datos generales, cargo y fecha de baja.</p>
        <Button variant="brand" onClick={() => setEdicion({ persona: null })} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nueva persona
        </Button>
      </div>

      <FilterBar onReset={resetFilters} activeCount={filtrosActivos}>
        <FilterField label="Buscar" className="w-full md:w-72">
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-icon" />
            </div>
            <Input
              value={filters.texto}
              onChange={(evento) => setFilter('texto', evento.target.value)}
              placeholder="Buscar por nombre o apellido"
              className="w-full pl-10 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            />
          </div>
        </FilterField>
      </FilterBar>

      {aviso && (
        <p className={cn('text-sm', error ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300')}>
          {aviso}
        </p>
      )}

      <ListCard
        title={estadoActual === 'activos' ? 'Personal activo' : 'Personal dado de baja'}
        actions={<span className="text-sm text-gray-500 dark:text-gray-400">({total} registros)</span>}
        footer={<Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} loading={loading} />}
      >
        {loading ? (
          <p className="py-12 text-center text-gray-600 dark:text-gray-300">Cargando personal...</p>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title={filtrosActivos > 0 ? 'No se encontró personal con esos filtros' : 'No hay personal registrado'}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-700">
                  <TableHead className="font-semibold">Nombre completo</TableHead>
                  <TableHead className="font-semibold">Cargo</TableHead>
                  <TableHead className="font-semibold">Empresa</TableHead>
                  <TableHead className="font-semibold">Teléfono</TableHead>
                  <TableHead className="font-semibold">Carné de identidad</TableHead>
                  <TableHead className="font-semibold">{estadoActual === 'activos' ? 'Estado' : 'Fecha de baja'}</TableHead>
                  <TableHead className="font-semibold text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((persona) => (
                  <TableRow
                    key={persona.id_persona}
                    onClick={() => setEdicion({ persona })}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <TableCell className="font-medium">{nombreCompleto(persona)}</TableCell>
                    <TableCell>{persona.cargo ?? '-'}</TableCell>
                    <TableCell>{persona.empresa?.nombre ?? '-'}</TableCell>
                    <TableCell>{persona.telefono ?? '-'}</TableCell>
                    <TableCell>{persona.carne_identidad ?? '-'}</TableCell>
                    <TableCell>
                      {persona.fecha_baja ? formatearFecha(persona.fecha_baja) : <Badge variant="outline">Activo</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      {persona.fecha_baja ? (
                        isAdmin && (
                          <Button size="sm" variant="outline" onClick={(evento) => void reactivar(persona, evento)}>
                            Reactivar
                          </Button>
                        )
                      ) : (
                        <Button size="sm" variant="outline" onClick={(evento) => abrirBaja(persona, evento)}>
                          Dar baja
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </ListCard>

      <DetailPanel
        open={edicion !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setEdicion(null);
        }}
        title={edicion?.persona ? 'Editar persona' : 'Nueva persona'}
      >
        {edicion && (
          <PersonaForm
            key={edicion.persona?.id_persona ?? 'nueva'}
            persona={edicion.persona}
            onTerminado={() => {
              setEdicion(null);
              reload();
            }}
            onCancelar={() => setEdicion(null)}
          />
        )}
      </DetailPanel>

      <Dialog open={bajaPara !== null} onOpenChange={(abierto) => { if (!abierto) setBajaPara(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dar baja</DialogTitle>
            <DialogDescription>{bajaPara ? nombreCompleto(bajaPara) : ''}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="fecha-baja" className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de baja</label>
              <Input
                id="fecha-baja"
                type="date"
                value={fechaBaja}
                onChange={(evento) => setFechaBaja(evento.target.value)}
                className={cn('dark:border-gray-600 dark:bg-gray-800 dark:text-white', !fechaBaja && 'border-orange-400 bg-orange-50 dark:bg-orange-950/30')}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="causa-baja" className="text-sm font-medium text-gray-700 dark:text-gray-300">Causa de baja</label>
              <Input
                id="causa-baja"
                value={causaBaja}
                onChange={(evento) => setCausaBaja(evento.target.value)}
                className={cn('dark:border-gray-600 dark:bg-gray-800 dark:text-white', !causaBaja.trim() && 'border-orange-400 bg-orange-50 dark:bg-orange-950/30')}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setBajaPara(null)} disabled={guardandoBaja}>
                Cancelar
              </Button>
              <Button onClick={() => void confirmarBaja()} disabled={!fechaBaja || guardandoBaja}>
                {guardandoBaja ? 'Guardando...' : 'Confirmar baja'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
