import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertCircle, ArrowLeft, Loader2, Pencil, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerField } from '@/components/common/DatePickerField';
import HistorialCambios from '@/components/common/HistorialCambios';
import { aIntervaloPostgres, aValorDatetimeLocal, diferenciaMs } from '@/lib/intervalos';
import { aTimestampLocal } from '@/lib/planMantenimiento';
import { esVacio } from '@/lib/utils';
import { fallasService, type FallaResponse } from '@/services/api/fallasApi';
import { senalesService, type CatalogoItem } from '@/services/api/senalesApi';

interface Falla {
  id_falla: string;
  id_senal: string | null;
  fecha_falla: string | null;
  fecha_restablecer: string | null;
  fecha_pronost_restablecer: string | null;
  id_tipo_falla: string | null;
  causa_de_falla: string | null;
  medidas: string | null;
  reporto: string | null;
  rescatada: boolean | null;
  observaciones: string | null;
  duracion_de_falla: string | null;
  diferencia_tiempo: string | null;
  id_origen_falla: string | null;
  transmite: string | null;
  anar: string | null;
  rg: string | null;
}

interface SenalResumen {
  id_senal: string;
  codigo_lsm: string | null;
  nombre: string | null;
}

interface DatosDetalle {
  falla: Falla;
  senal: SenalResumen | null;
  tiposFalla: CatalogoItem[];
  origenesFalla: CatalogoItem[];
}

const ETIQUETAS: Record<string, string> = {
  id_senal: 'Señal',
  fecha_falla: 'Fecha de falla',
  id_tipo_falla: 'Tipo de falla',
  causa_de_falla: 'Causa de falla',
  fecha_restablecer: 'Fecha de restablecimiento',
  fecha_pronost_restablecer: 'Fecha pronóstico de restablecimiento',
  id_origen_falla: 'Origen de falla',
  rescatada: 'Falla rescatada',
  medidas: 'Medidas tomadas',
  observaciones: 'Observaciones',
  reporto: 'Reportó',
  transmite: 'Transmite',
  anar: 'ANAR',
  rg: 'RG',
  duracion_de_falla: 'Duración de falla',
  diferencia_tiempo: 'Diferencia de tiempo',
};

const FORMATO_ISO_FECHA = /^\d{4}-\d{2}-\d{2}T/;

const cargarSenal = async (idSenal: string | null): Promise<SenalResumen | null> => {
  if (!idSenal) return null;
  const respuesta = await senalesService.getSenalById(idSenal);
  if (!respuesta.success) throw new Error(respuesta.message);
  return (respuesta.data as SenalResumen[] | null)?.[0] ?? null;
};

const aCatalogo = (
  respuesta: FallaResponse,
  campoId: 'id_tipo_falla' | 'id_origen_falla'
): CatalogoItem[] => {
  if (!respuesta.success) throw new Error(respuesta.message);
  const items = (respuesta.data as Record<string, string>[] | null) ?? [];
  return items.map((item) => ({ id: item[campoId], nombre: item.nombre }));
};

const cargarDatos = async (id: string): Promise<DatosDetalle | null> => {
  const fallaRes = await fallasService.getById(id);
  if (!fallaRes.success) throw new Error(fallaRes.message);

  const falla = (fallaRes.data as Falla[] | null)?.[0] ?? null;
  if (!falla) return null;

  const [senal, tiposRes, origenesRes] = await Promise.all([
    cargarSenal(falla.id_senal),
    fallasService.getTiposFalla(),
    fallasService.getOrigenesFalla(),
  ]);

  return {
    falla,
    senal,
    tiposFalla: aCatalogo(tiposRes, 'id_tipo_falla'),
    origenesFalla: aCatalogo(origenesRes, 'id_origen_falla'),
  };
};

const nombreDe = (lista: CatalogoItem[] | undefined, id: string | null | undefined): string => {
  if (!id) return '—';
  return lista?.find((item) => item.id === id)?.nombre ?? '—';
};

const texto = (valor: string | null | undefined): string => (valor?.length ? valor : '—');

const sinoNo = (valor: boolean | null | undefined): string =>
  valor === null || valor === undefined ? '—' : valor ? 'Sí' : 'No';

const fechaLegible = (valor: string | null | undefined, conHora = false): string => {
  if (!valor) return '—';
  const date = new Date(valor);
  if (!isValid(date)) return '—';
  return format(date, conHora ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy', { locale: es });
};

const etiquetaSenal = (senal: SenalResumen): string => `${texto(senal.codigo_lsm)} - ${texto(senal.nombre)}`;

const aNulo = (valor: string): string | null => (esVacio(valor) ? null : valor);

function Dato({ etiqueta, valor }: { etiqueta: string; valor: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-sm font-medium text-blue-900 dark:text-gray-200">{etiqueta}</dt>
      <dd className="break-words text-sm text-gray-700 dark:text-gray-300">{valor}</dd>
    </div>
  );
}

export default function FallaDetalle() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [datos, setDatos] = useState<DatosDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [pestana, setPestana] = useState('basicos');
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [fechaRestablecer, setFechaRestablecer] = useState('');
  const [medidas, setMedidas] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [registrarMantenimiento, setRegistrarMantenimiento] = useState(false);
  const [guardandoRestablecer, setGuardandoRestablecer] = useState(false);
  const [errorRestablecer, setErrorRestablecer] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      setCargando(true);
      setError(null);
      try {
        const resultado = await cargarDatos(id);
        if (!cancelado) setDatos(resultado);
      } catch (err: unknown) {
        if (!cancelado) setError(err instanceof Error ? err.message : 'Error al cargar la falla');
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    void cargar();
    return () => {
      cancelado = true;
    };
  }, [id, intento]);

  if (cargando) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-icon" />
          <p className="text-gray-600 dark:text-gray-300">Cargando falla...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto mt-8 max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            Error
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-gray-700 dark:text-gray-300">{error}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIntento((n) => n + 1)}>
              Reintentar
            </Button>
            <Button variant="outline" asChild>
              <Link to="/gestion-fallas">
                <ArrowLeft />
                Volver
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!datos) {
    return (
      <Card className="mx-auto mt-8 max-w-md">
        <CardHeader>
          <CardTitle>Falla no encontrada</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link to="/gestion-fallas">
              <ArrowLeft />
              Volver
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { falla, senal, tiposFalla, origenesFalla } = datos;
  const abierta = !falla.fecha_restablecer;

  const abrirRestablecer = () => {
    setFechaRestablecer(aValorDatetimeLocal(new Date()));
    setMedidas(falla.medidas ?? '');
    setObservaciones(falla.observaciones ?? '');
    setRegistrarMantenimiento(false);
    setErrorRestablecer(null);
    setDialogoAbierto(true);
  };

  const guardarRestablecer = async () => {
    if (!fechaRestablecer) {
      setErrorRestablecer('Indique la fecha de restablecimiento');
      return;
    }

    const iso = aTimestampLocal(fechaRestablecer) ?? fechaRestablecer;
    const duracion = diferenciaMs(falla.fecha_falla, iso);
    if (duracion !== null && duracion < 0) {
      setErrorRestablecer('La fecha de restablecimiento no puede ser anterior a la fecha de falla');
      return;
    }
    const diferencia = diferenciaMs(falla.fecha_pronost_restablecer, iso);

    setGuardandoRestablecer(true);
    setErrorRestablecer(null);
    const respuesta = await fallasService.restablecer(falla.id_falla, {
      fecha_restablecer: iso,
      medidas: aNulo(medidas),
      observaciones: aNulo(observaciones),
      duracion_de_falla: duracion === null ? null : aIntervaloPostgres(duracion),
      diferencia_tiempo: diferencia === null ? null : aIntervaloPostgres(diferencia),
    });
    setGuardandoRestablecer(false);

    if (!respuesta.success) {
      setErrorRestablecer(respuesta.message || 'Error al restablecer la falla');
      return;
    }

    setDialogoAbierto(false);
    if (registrarMantenimiento) {
      const params = new URLSearchParams({ senal: falla.id_senal ?? '', falla: falla.id_falla, fin: iso });
      void navigate(`/gestion-mant/nuevo?${params.toString()}`);
    } else {
      setIntento((n) => n + 1);
    }
  };

  const enlaceSenal: ReactNode = senal ? (
    <Link to={`/gestion-senales/${senal.id_senal}`} className="text-blue-600 hover:underline dark:text-blue-400">
      {etiquetaSenal(senal)}
    </Link>
  ) : (
    '—'
  );

  const formatearValorHistorial = (campo: string, valor: unknown): string => {
    if (campo === 'id_tipo_falla' && typeof valor === 'string') return nombreDe(tiposFalla, valor);
    if (campo === 'id_origen_falla' && typeof valor === 'string') return nombreDe(origenesFalla, valor);
    if (campo === 'id_senal' && typeof valor === 'string') return senal?.id_senal === valor ? etiquetaSenal(senal) : valor;
    if (typeof valor === 'boolean') return sinoNo(valor);
    if (typeof valor === 'string' && FORMATO_ISO_FECHA.test(valor)) return fechaLegible(valor, true);
    return typeof valor === 'string' ? valor : JSON.stringify(valor);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-blue-900 dark:text-white">
            Falla del {fechaLegible(falla.fecha_falla, true)}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <span>Tipo: {nombreDe(tiposFalla, falla.id_tipo_falla)}</span>
            <Badge
              variant="outline"
              className={abierta ? 'border-red-300 text-red-700 dark:text-red-400' : 'border-green-300 text-green-700 dark:text-green-400'}
            >
              {abierta ? 'Abierta' : 'Restablecida'}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/gestion-fallas">
              <ArrowLeft />
              Volver
            </Link>
          </Button>
          {abierta && (
            <Button onClick={abrirRestablecer}>
              <RotateCcw />
              Restablecer
            </Button>
          )}
          <Button asChild>
            <Link to={`/gestion-fallas/editar/${falla.id_falla}`}>
              <Pencil />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={pestana} onValueChange={setPestana}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start bg-blue-100 dark:bg-gray-700">
          <TabsTrigger value="basicos" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:text-gray-300">
            Datos Básicos
          </TabsTrigger>
          <TabsTrigger value="detalles" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:text-gray-300">
            Detalles
          </TabsTrigger>
          <TabsTrigger value="responsables" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:text-gray-300">
            Responsables
          </TabsTrigger>
          <TabsTrigger value="tiempos" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:text-gray-300">
            Tiempos
          </TabsTrigger>
          <TabsTrigger value="historial" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:text-gray-300">
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basicos" className="mt-4">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Dato etiqueta={ETIQUETAS.id_senal} valor={enlaceSenal} />
            <Dato etiqueta={ETIQUETAS.fecha_falla} valor={fechaLegible(falla.fecha_falla, true)} />
            <Dato etiqueta={ETIQUETAS.id_tipo_falla} valor={nombreDe(tiposFalla, falla.id_tipo_falla)} />
            <div className="sm:col-span-2 lg:col-span-3">
              <Dato etiqueta={ETIQUETAS.causa_de_falla} valor={texto(falla.causa_de_falla)} />
            </div>
          </dl>
        </TabsContent>

        <TabsContent value="detalles" className="mt-4">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Dato etiqueta={ETIQUETAS.fecha_restablecer} valor={fechaLegible(falla.fecha_restablecer, true)} />
            <Dato etiqueta={ETIQUETAS.fecha_pronost_restablecer} valor={fechaLegible(falla.fecha_pronost_restablecer, true)} />
            <Dato etiqueta={ETIQUETAS.id_origen_falla} valor={nombreDe(origenesFalla, falla.id_origen_falla)} />
            <Dato etiqueta={ETIQUETAS.rescatada} valor={sinoNo(falla.rescatada)} />
            <div className="sm:col-span-2 lg:col-span-3">
              <Dato etiqueta={ETIQUETAS.medidas} valor={texto(falla.medidas)} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Dato etiqueta={ETIQUETAS.observaciones} valor={texto(falla.observaciones)} />
            </div>
          </dl>
        </TabsContent>

        <TabsContent value="responsables" className="mt-4">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Dato etiqueta={ETIQUETAS.reporto} valor={texto(falla.reporto)} />
            <Dato etiqueta={ETIQUETAS.transmite} valor={texto(falla.transmite)} />
            <Dato etiqueta={ETIQUETAS.anar} valor={texto(falla.anar)} />
            <Dato etiqueta={ETIQUETAS.rg} valor={texto(falla.rg)} />
          </dl>
        </TabsContent>

        <TabsContent value="tiempos" className="mt-4">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Dato etiqueta={ETIQUETAS.duracion_de_falla} valor={texto(falla.duracion_de_falla)} />
            <Dato etiqueta={ETIQUETAS.diferencia_tiempo} valor={texto(falla.diferencia_tiempo)} />
          </dl>
        </TabsContent>

        <TabsContent value="historial" className="mt-4">
          <HistorialCambios
            tabla="fallas"
            idRegistro={falla.id_falla}
            etiquetas={ETIQUETAS}
            formatearValor={formatearValorHistorial}
          />
        </TabsContent>
      </Tabs>

      <Dialog
        open={dialogoAbierto}
        onOpenChange={(abrir) => {
          if (!guardandoRestablecer) setDialogoAbierto(abrir);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Restablecer falla</DialogTitle>
            <DialogDescription>Registre el restablecimiento de la señal.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fecha-restablecer">Fecha de restablecimiento</Label>
              <DatePickerField
                id="fecha-restablecer"
                withTime
                value={fechaRestablecer}
                onChange={setFechaRestablecer}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medidas-restablecer">Medidas tomadas</Label>
              <Textarea
                id="medidas-restablecer"
                value={medidas}
                onChange={(e) => setMedidas(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones-restablecer">Observaciones</Label>
              <Textarea
                id="observaciones-restablecer"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="registrar-mantenimiento"
                checked={registrarMantenimiento}
                onCheckedChange={(marcado) => setRegistrarMantenimiento(marcado === true)}
              />
              <Label htmlFor="registrar-mantenimiento" className="cursor-pointer">
                Registrar mantenimiento de este restablecimiento
              </Label>
            </div>

            {errorRestablecer && (
              <p className="flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="mr-1 h-4 w-4" />
                {errorRestablecer}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoAbierto(false)} disabled={guardandoRestablecer}>
              Cancelar
            </Button>
            <Button onClick={() => void guardarRestablecer()} disabled={guardandoRestablecer}>
              {guardandoRestablecer ? (
                <>
                  <Loader2 className="animate-spin" />
                  Guardando...
                </>
              ) : (
                'Restablecer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
