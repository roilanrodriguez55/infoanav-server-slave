import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, Plus } from 'lucide-react';
import { DetailPanel } from '@/components/common/DetailPanel';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CommandSelect } from '@/components/ui/CommandSelect';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ESQUEMA_ALISTAMIENTO,
  aCampos,
  flotaService,
  textosVacios,
  type AlistamientoRegistro,
  type CampoAlistamiento,
  type Texto,
} from '@/services/api/flotaApi';
import type { CatalogoItem } from '@/services/api/senalesApi';
import { CAMPO_PENDIENTE, cn, esVacio } from '@/lib/utils';
import { CampoFlota } from './CampoFlota';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const ETIQUETAS: Record<CampoAlistamiento, string> = {
  id_buque: 'Buque',
  ano: 'Año',
  mes: 'Mes',
  id_tipo_alistamiento: 'Tipo de alistamiento',
  descripcion: 'Descripción',
  observaciones: 'Observaciones',
  fecha_fs: 'Fecha de F/S',
  fecha_alistamiento: 'Fecha de alistamiento',
  dias_mision_mes: 'Días de misión del mes',
  dias_fs_mes: 'Días F/S del mes',
};

const porcentaje = (valor: number | null): string => (valor === null ? '-' : `${valor}%`);

const numeroOGuion = (valor: number | null): string => (valor === null ? '-' : String(valor));

const anoActual = (): number => new Date().getFullYear();

const FORMULARIO_VACIO = (ano: number): Texto<CampoAlistamiento> => ({
  ...textosVacios(ESQUEMA_ALISTAMIENTO),
  ano: String(ano),
  mes: '',
});

interface RegistrarMesProps {
  anoInicial: number;
  onTerminado: () => void;
  onCancelar: () => void;
}

function RegistrarMes({ anoInicial, onTerminado, onCancelar }: RegistrarMesProps) {
  const [texto, setTexto] = useState<Texto<CampoAlistamiento>>(() => FORMULARIO_VACIO(anoInicial));
  const [buques, setBuques] = useState<CatalogoItem[]>([]);
  const [tipos, setTipos] = useState<CatalogoItem[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void flotaService.getBuquesCatalogo().then(setBuques).catch(() => undefined);
    void flotaService.getCatalogos().then((catalogos) => setTipos(catalogos.tiposAlistamiento)).catch(() => undefined);
  }, []);

  const cambiar = (campo: CampoAlistamiento, valor: string) => {
    setTexto((previo) => ({ ...previo, [campo]: valor }));
  };

  const campo = (clave: CampoAlistamiento) => (
    <CampoFlota
      id={clave}
      etiqueta={ETIQUETAS[clave]}
      valor={texto[clave]}
      tipo={ESQUEMA_ALISTAMIENTO[clave]}
      onCambiar={(valor) => cambiar(clave, valor)}
    />
  );

  const guardar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (esVacio(texto.id_buque) || esVacio(texto.ano) || esVacio(texto.mes)) {
      setError('El buque, el año y el mes son obligatorios.');
      return;
    }

    setGuardando(true);
    setError(null);
    const respuesta = await flotaService.registrarMes(aCampos(ESQUEMA_ALISTAMIENTO, texto));
    setGuardando(false);

    if (!respuesta.success) {
      setError(respuesta.message);
      return;
    }
    onTerminado();
  };

  return (
    <form onSubmit={guardar} className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CommandSelect
          value={texto.id_buque}
          onValueChange={(valor) => cambiar('id_buque', valor)}
          placeholder="Seleccionar buque"
          searchPlaceholder="Buscar buque..."
          emptyMessage="No se encontraron buques"
          items={buques}
          label="Buque"
          required
          pendiente={esVacio(texto.id_buque)}
        />
        <CommandSelect
          value={texto.id_tipo_alistamiento}
          onValueChange={(valor) => cambiar('id_tipo_alistamiento', valor)}
          placeholder="Seleccionar tipo"
          searchPlaceholder="Buscar tipo..."
          emptyMessage="No se encontraron tipos"
          items={tipos}
          label="Tipo de alistamiento"
          pendiente={esVacio(texto.id_tipo_alistamiento)}
        />
        {campo('ano')}
        <div className="space-y-2">
          <Label htmlFor="mes" className="text-sm font-medium text-gray-700 dark:text-gray-300">Mes</Label>
          <Select value={texto.mes || undefined} onValueChange={(valor) => cambiar('mes', valor)}>
            <SelectTrigger id="mes" className={cn('w-full dark:border-gray-600 dark:bg-gray-800 dark:text-white', esVacio(texto.mes) && CAMPO_PENDIENTE)}>
              <SelectValue placeholder="Seleccionar mes" />
            </SelectTrigger>
            <SelectContent>
              {MESES.map((nombre, indice) => (
                <SelectItem key={nombre} value={String(indice + 1)}>{nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {campo('dias_mision_mes')}
        {campo('dias_fs_mes')}
        {campo('fecha_fs')}
        {campo('fecha_alistamiento')}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="descripcion" className="text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</Label>
          <Input
            id="descripcion"
            value={texto.descripcion}
            onChange={(evento) => cambiar('descripcion', evento.target.value)}
            className={cn('dark:border-gray-600 dark:bg-gray-800 dark:text-white', esVacio(texto.descripcion) && CAMPO_PENDIENTE)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="observaciones" className="text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones</Label>
          <Input
            id="observaciones"
            value={texto.observaciones}
            onChange={(evento) => cambiar('observaciones', evento.target.value)}
            className={cn('dark:border-gray-600 dark:bg-gray-800 dark:text-white', esVacio(texto.observaciones) && CAMPO_PENDIENTE)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Button>
        <Button type="submit" disabled={guardando} className="bg-gray-800 text-white hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600">
          {guardando ? 'Guardando...' : 'Registrar mes'}
        </Button>
      </div>
    </form>
  );
}

export default function AlistamientoTab() {
  const [ano, setAno] = useState<number>(anoActual());
  const [recargas, setRecargas] = useState(0);
  const [carga, setCarga] = useState<{ clave: string; filas: AlistamientoRegistro[]; error: string | null } | null>(null);
  const [registrando, setRegistrando] = useState(false);
  const [tipos, setTipos] = useState<CatalogoItem[]>([]);

  useEffect(() => {
    void flotaService.getCatalogos().then((catalogos) => setTipos(catalogos.tiposAlistamiento)).catch(() => undefined);
  }, []);

  // La carga se identifica por año y recargas: mientras no coincida con la actual, se muestra "Cargando".
  const clave = `${ano}-${recargas}`;

  useEffect(() => {
    let activo = true;
    void flotaService.listarAlistamiento(ano).then((respuesta) => {
      if (!activo) return;
      setCarga({
        clave,
        filas: respuesta.success ? respuesta.data : [],
        error: respuesta.success ? null : respuesta.message,
      });
    });
    return () => {
      activo = false;
    };
  }, [ano, clave]);

  const actual = carga?.clave === clave ? carga : null;
  const cargando = actual === null;
  const filas = actual?.filas ?? [];
  const error = actual?.error ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="w-full md:w-40">
          <Label htmlFor="ano-alistamiento" className="text-sm font-medium text-gray-700 dark:text-gray-300">Año</Label>
          <Input
            id="ano-alistamiento"
            type="number"
            value={ano}
            onChange={(evento) => {
              const valor = Number(evento.target.value);
              if (Number.isInteger(valor) && valor > 0) setAno(valor);
            }}
            className="mt-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <Button
          onClick={() => setRegistrando(true)}
          className="w-full bg-gray-800 text-white shadow-md hover:bg-gray-900 sm:w-auto dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Registrar mes
        </Button>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      <Card className="min-w-0 border-gray-200 shadow-xl dark:border-gray-700 dark:bg-gray-800">
        <CardHeader className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <CardTitle className="text-xl text-gray-800 dark:text-white">
            Alistamiento de {ano}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {cargando ? (
            <p className="py-12 text-center text-gray-600 dark:text-gray-300">Cargando alistamiento...</p>
          ) : filas.length === 0 ? (
            <p className="py-12 text-center text-gray-500 dark:text-gray-400">No hay meses registrados en {ano}.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 dark:bg-gray-700">
                    <TableHead className="font-semibold">Buque</TableHead>
                    <TableHead className="font-semibold">Mes</TableHead>
                    <TableHead className="font-semibold">Tipo</TableHead>
                    <TableHead className="font-semibold">Días misión</TableHead>
                    <TableHead className="font-semibold">Días F/S</TableHead>
                    <TableHead className="font-semibold">% mes</TableHead>
                    <TableHead className="font-semibold">Días misión acum.</TableHead>
                    <TableHead className="font-semibold">Días F/S acum.</TableHead>
                    <TableHead className="font-semibold">% acumulado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filas.map((fila) => (
                    <TableRow key={fila.id_alistamiento} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <TableCell className="font-medium">{fila.buque}</TableCell>
                      <TableCell>{MESES[fila.mes - 1] ?? fila.mes}</TableCell>
                      <TableCell>{tipos.find((tipo) => tipo.id === fila.id_tipo_alistamiento)?.nombre ?? '-'}</TableCell>
                      <TableCell>{numeroOGuion(fila.dias_mision_mes)}</TableCell>
                      <TableCell>{numeroOGuion(fila.dias_fs_mes)}</TableCell>
                      <TableCell>{porcentaje(fila.pct_alistamiento_mes)}</TableCell>
                      <TableCell>{numeroOGuion(fila.dias_mision_acum)}</TableCell>
                      <TableCell>{numeroOGuion(fila.dias_fs_acum)}</TableCell>
                      <TableCell>{porcentaje(fila.pct_alistamiento_acum)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DetailPanel
        open={registrando}
        onOpenChange={setRegistrando}
        title="Registrar mes de alistamiento"
      >
        {registrando && (
          <RegistrarMes
            anoInicial={ano}
            onTerminado={() => {
              setRegistrando(false);
              setRecargas((conteo) => conteo + 1);
            }}
            onCancelar={() => setRegistrando(false)}
          />
        )}
      </DetailPanel>
    </div>
  );
}
