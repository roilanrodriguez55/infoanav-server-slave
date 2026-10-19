import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, AlertTriangle, CalendarClock, Plus, Search } from 'lucide-react';
import { DetailPanel } from '@/components/common/DetailPanel';
import { FilterBar, FilterField } from '@/components/common/FilterBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DIAS_AVISO_CERTIFICADO,
  ETIQUETA_CERTIFICADO,
  calcularAlertasCertificados,
  flotaService,
  type AlertaCertificado,
  type Buque,
} from '@/services/api/flotaApi';
import { Alert, AlertDescription } from '@/components/ui/alert';
import BuqueFicha from './BuqueFicha';

const formatearFecha = (fecha: string): string => {
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
};

export default function BuquesTab() {
  const [buques, setBuques] = useState<Buque[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [recargas, setRecargas] = useState(0);
  const [edicion, setEdicion] = useState<{ id: string | null } | null>(null);

  useEffect(() => {
    let activo = true;
    void flotaService.listarBuques().then((respuesta) => {
      if (!activo) return;
      if (respuesta.success) {
        setBuques(respuesta.data);
        setError(null);
      } else {
        setError(respuesta.message);
      }
      setCargando(false);
    });
    return () => {
      activo = false;
    };
  }, [recargas]);

  const alertas = useMemo(() => calcularAlertasCertificados(buques), [buques]);
  const vencidas = alertas.filter((alerta) => alerta.vencido);
  const porVencer = alertas.filter((alerta) => !alerta.vencido);

  const termino = busqueda.trim().toLowerCase();
  const buquesFiltrados = termino
    ? buques.filter((buque) =>
        buque.buque.toLowerCase().includes(termino) || (buque.nombre_buque ?? '').toLowerCase().includes(termino))
    : buques;

  const abrirAlerta = (alerta: AlertaCertificado) => setEdicion({ id: alerta.id_buque });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Buques de la flota, con su ficha técnica y certificados.
        </p>
        <Button
          onClick={() => setEdicion({ id: null })}
          className="w-full bg-gray-800 text-white shadow-md hover:bg-gray-900 sm:w-auto dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo buque
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-red-700 dark:text-red-300">
              <AlertCircle className="h-5 w-5" />
              Certificados vencidos ({vencidas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vencidas.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Ningún certificado vencido.</p>
            ) : (
              <ul className="space-y-1">
                {vencidas.map((alerta) => (
                  <li key={`${alerta.id_buque}-${alerta.certificado}`}>
                    <button
                      type="button"
                      onClick={() => abrirAlerta(alerta)}
                      className="text-left text-sm text-gray-700 hover:underline dark:text-gray-200"
                    >
                      {alerta.buque}: {ETIQUETA_CERTIFICADO[alerta.certificado]} vencido el {formatearFecha(alerta.fecha)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-amber-700 dark:text-amber-300">
              <CalendarClock className="h-5 w-5" />
              Por vencer en {DIAS_AVISO_CERTIFICADO} días ({porVencer.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {porVencer.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Ningún certificado por vencer.</p>
            ) : (
              <ul className="space-y-1">
                {porVencer.map((alerta) => (
                  <li key={`${alerta.id_buque}-${alerta.certificado}`}>
                    <button
                      type="button"
                      onClick={() => abrirAlerta(alerta)}
                      className="text-left text-sm text-gray-700 hover:underline dark:text-gray-200"
                    >
                      {alerta.buque}: {ETIQUETA_CERTIFICADO[alerta.certificado]} vence el {formatearFecha(alerta.fecha)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      <FilterBar onReset={() => setBusqueda('')} activeCount={busqueda ? 1 : 0}>
        <FilterField label="Buscar" className="w-full md:w-72">
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <Input
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar por buque o nombre"
              className="w-full pl-10 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            />
          </div>
        </FilterField>
      </FilterBar>

      <Card className="min-w-0 border-gray-200 shadow-xl dark:border-gray-700 dark:bg-gray-800">
        <CardHeader className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <CardTitle className="text-xl text-gray-800 dark:text-white">
            Listado de buques
            {buques.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">({buques.length} registros)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {cargando ? (
            <p className="py-12 text-center text-gray-600 dark:text-gray-300">Cargando buques...</p>
          ) : buquesFiltrados.length === 0 ? (
            <p className="py-12 text-center text-gray-500 dark:text-gray-400">
              {termino ? 'No se encontraron buques con esa búsqueda.' : 'No hay buques registrados.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 dark:bg-gray-700">
                    <TableHead className="font-semibold">Buque</TableHead>
                    <TableHead className="font-semibold">Nombre</TableHead>
                    <TableHead className="font-semibold">Empresa</TableHead>
                    <TableHead className="font-semibold">Especialidad</TableHead>
                    <TableHead className="font-semibold">Eslora (m)</TableHead>
                    <TableHead className="font-semibold">Tripulantes</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buquesFiltrados.map((buque) => (
                    <TableRow
                      key={buque.id_buque}
                      onClick={() => setEdicion({ id: buque.id_buque })}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <TableCell className="font-medium">{buque.buque}</TableCell>
                      <TableCell>{buque.nombre_buque ?? '-'}</TableCell>
                      <TableCell>{buque.empresa?.nombre ?? '-'}</TableCell>
                      <TableCell>{buque.especialidad ?? '-'}</TableCell>
                      <TableCell>{buque.eslora ?? '-'}</TableCell>
                      <TableCell>{buque.tripulantes ?? '-'}</TableCell>
                      <TableCell>
                        {buque.propuesto_baja ? (
                          <Badge variant="outline">Propuesto para baja</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DetailPanel
        open={edicion !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setEdicion(null);
        }}
        title={edicion?.id ? 'Ficha del buque' : 'Nuevo buque'}
      >
        {edicion && (
          <BuqueFicha
            key={edicion.id ?? 'nuevo'}
            idBuque={edicion.id}
            onTerminado={() => {
              setEdicion(null);
              setRecargas((conteo) => conteo + 1);
            }}
            onCancelar={() => setEdicion(null)}
          />
        )}
      </DetailPanel>
    </div>
  );
}
