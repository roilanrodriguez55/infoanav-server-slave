import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertCircle, ArrowLeft, Loader2, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HistorialCambios from '@/components/common/HistorialCambios';
import { mantenimientosService, type MantenimientoResponse } from '@/services/api/mantenApi';
import { flotaService } from '@/services/api/flotaApi';
import { senalesService, type CatalogoItem } from '@/services/api/senalesApi';
import { textoTiempoEmpleado } from '@/lib/planMantenimiento';

interface Mantenimiento {
  id_mantenimiento: string;
  id_senal: string | null;
  id_tipo_mant: string | null;
  ident_mantenimiento: string | null;
  fecha_inicio: string | null;
  fecha_finalizacion: string | null;
  tiempo_empleado: string | number | null;
  aseguro: string | null;
  id_estado_senal: string | null;
  id_buque: string | null;
  vehiculo: string | null;
  trabajo_realizado: string | null;
  costo_mn: string | number | null;
  costo_mlc: string | number | null;
  diesel_lit: string | number | null;
  gasolina_lit: string | number | null;
  informa: string | null;
  transmite: string | null;
  rg: string | null;
  orden: string | null;
  introdujo: string | null;
  tipoFallaCausa?: string | null;
}

interface SenalResumen {
  id_senal: string;
  codigo_lsm: string | null;
  nombre: string | null;
}

interface DatosDetalle {
  mantenimiento: Mantenimiento;
  senal: SenalResumen | null;
  tiposMantenimiento: CatalogoItem[];
  estadosSenal: CatalogoItem[];
  buques: CatalogoItem[];
}

const ETIQUETAS: Record<string, string> = {
  id_senal: 'Señal',
  id_tipo_mant: 'Tipo de mantenimiento',
  ident_mantenimiento: 'Identificador del mantenimiento',
  id_estado_senal: 'Estado de la señal',
  id_buque: 'Buque',
  vehiculo: 'Vehículo',
  tipoFallaCausa: 'Tipo de falla y causa',
  trabajo_realizado: 'Descripción del trabajo',
  fecha_inicio: 'Fecha de inicio',
  fecha_finalizacion: 'Fecha de finalización',
  tiempo_empleado: 'Tiempo empleado (horas)',
  aseguro: 'Aseguró',
  costo_mn: 'Costo MN',
  costo_mlc: 'Costo MLC',
  diesel_lit: 'Diesel (L)',
  gasolina_lit: 'Gasolina (L)',
  informa: 'Informa',
  transmite: 'Transmite',
  rg: 'RG',
  orden: 'Orden',
  introdujo: 'Introdujo',
};

const FORMATO_ISO_FECHA = /^\d{4}-\d{2}-\d{2}T/;
const CAMPOS_COSTO = new Set(['costo_mn', 'costo_mlc']);

const cargarSenal = async (idSenal: string | null): Promise<SenalResumen | null> => {
  if (!idSenal) return null;
  const respuesta = await senalesService.getSenalById(idSenal);
  if (!respuesta.success) throw new Error(respuesta.message);
  return (respuesta.data as SenalResumen[] | null)?.[0] ?? null;
};

const aCatalogo = (
  respuesta: MantenimientoResponse,
  campoId: 'id_tipo_mant' | 'id_estado_senal'
): CatalogoItem[] => {
  if (!respuesta.success) throw new Error(respuesta.message);
  const items = (respuesta.data as Record<string, string>[] | null) ?? [];
  return items.map((item) => ({ id: item[campoId], nombre: item.nombre }));
};

const cargarDatos = async (id: string): Promise<DatosDetalle | null> => {
  const mantRes = await mantenimientosService.getById(id);
  if (!mantRes.success) throw new Error(mantRes.message);

  const mantenimiento = (mantRes.data as Mantenimiento[] | null)?.[0] ?? null;
  if (!mantenimiento) return null;

  const [senal, tiposRes, estadosRes, buques] = await Promise.all([
    cargarSenal(mantenimiento.id_senal),
    mantenimientosService.getTiposMantenimiento(),
    mantenimientosService.getEstadosSenal(),
    flotaService.getBuquesCatalogo().catch(() => [] as CatalogoItem[]),
  ]);

  return {
    mantenimiento,
    senal,
    tiposMantenimiento: aCatalogo(tiposRes, 'id_tipo_mant'),
    estadosSenal: aCatalogo(estadosRes, 'id_estado_senal'),
    buques,
  };
};

const nombreDe = (lista: CatalogoItem[] | undefined, id: string | null | undefined): string => {
  if (!id) return '—';
  return lista?.find((item) => item.id === id)?.nombre ?? '—';
};

const texto = (valor: string | null | undefined): string => (valor?.length ? valor : '—');

const moneda = (valor: unknown): string =>
  `$ ${(Number(valor) || 0).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const litros = (valor: unknown): string => (Number(valor) || 0).toLocaleString('es', { maximumFractionDigits: 1 });

const fechaLegible = (valor: string | null | undefined, conHora = false): string => {
  if (!valor) return '—';
  const date = new Date(valor);
  if (!isValid(date)) return '—';
  return format(date, conHora ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy', { locale: es });
};

const etiquetaSenal = (senal: SenalResumen): string => `${texto(senal.codigo_lsm)} - ${texto(senal.nombre)}`;

function Dato({ etiqueta, valor }: { etiqueta: string; valor: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-sm font-medium text-blue-900 dark:text-gray-200">{etiqueta}</dt>
      <dd className="break-words text-sm text-gray-700 dark:text-gray-300">{valor}</dd>
    </div>
  );
}

export default function MantenimientoDetalle() {
  const { id = '' } = useParams<{ id: string }>();
  const [datos, setDatos] = useState<DatosDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [pestana, setPestana] = useState('general');

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      setCargando(true);
      setError(null);
      try {
        const resultado = await cargarDatos(id);
        if (!cancelado) setDatos(resultado);
      } catch (err: unknown) {
        if (!cancelado) setError(err instanceof Error ? err.message : 'Error al cargar el mantenimiento');
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
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-gray-600 dark:text-gray-300">Cargando mantenimiento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto mt-8 max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
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
              <Link to="/gestion-mant">
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
          <CardTitle>Mantenimiento no encontrado</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link to="/gestion-mant">
              <ArrowLeft />
              Volver
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { mantenimiento, senal, tiposMantenimiento, estadosSenal, buques } = datos;

  const buqueNombre = mantenimiento.id_buque ? nombreDe(buques, mantenimiento.id_buque) : '';
  const medioUtilizado = mantenimiento.id_buque
    ? `Buque: ${buqueNombre}`
    : mantenimiento.vehiculo
      ? `Vehículo: ${mantenimiento.vehiculo}`
      : null;

  const enlaceSenal: ReactNode = senal ? (
    <Link to={`/gestion-senales/${senal.id_senal}`} className="text-blue-600 hover:underline dark:text-blue-400">
      {etiquetaSenal(senal)}
    </Link>
  ) : (
    '—'
  );

  const formatearValorHistorial = (campo: string, valor: unknown): string => {
    if (campo === 'id_tipo_mant' && typeof valor === 'string') return nombreDe(tiposMantenimiento, valor);
    if (campo === 'id_estado_senal' && typeof valor === 'string') return nombreDe(estadosSenal, valor);
    if (campo === 'id_senal' && typeof valor === 'string') return senal?.id_senal === valor ? etiquetaSenal(senal) : valor;
    if (CAMPOS_COSTO.has(campo)) return moneda(valor);
    if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
    if (typeof valor === 'string' && FORMATO_ISO_FECHA.test(valor)) return fechaLegible(valor, true);
    return typeof valor === 'string' ? valor : JSON.stringify(valor);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-blue-900 dark:text-white">
            Mantenimiento {texto(mantenimiento.ident_mantenimiento)}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <span>Tipo: {nombreDe(tiposMantenimiento, mantenimiento.id_tipo_mant)}</span>
            <Badge variant="outline">{nombreDe(estadosSenal, mantenimiento.id_estado_senal)}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/gestion-mant">
              <ArrowLeft />
              Volver
            </Link>
          </Button>
          <Button asChild>
            <Link to={`/gestion-mant/editar/${mantenimiento.id_mantenimiento}`}>
              <Pencil />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={pestana} onValueChange={setPestana}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start bg-blue-100 dark:bg-gray-700">
          <TabsTrigger value="general" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:text-gray-300">
            Información General
          </TabsTrigger>
          <TabsTrigger value="fechas" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:text-gray-300">
            Fechas y Tiempos
          </TabsTrigger>
          <TabsTrigger value="costos" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:text-gray-300">
            Costos
          </TabsTrigger>
          <TabsTrigger value="responsables" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:text-gray-300">
            Responsables
          </TabsTrigger>
          <TabsTrigger value="historial" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:text-gray-300">
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Dato etiqueta={ETIQUETAS.id_senal} valor={enlaceSenal} />
            <Dato etiqueta={ETIQUETAS.id_tipo_mant} valor={nombreDe(tiposMantenimiento, mantenimiento.id_tipo_mant)} />
            <Dato etiqueta={ETIQUETAS.ident_mantenimiento} valor={texto(mantenimiento.ident_mantenimiento)} />
            <Dato etiqueta={ETIQUETAS.id_estado_senal} valor={nombreDe(estadosSenal, mantenimiento.id_estado_senal)} />
            {medioUtilizado && <Dato etiqueta="Medio utilizado" valor={medioUtilizado} />}
            <div className="sm:col-span-2 lg:col-span-3">
              <Dato etiqueta={ETIQUETAS.tipoFallaCausa} valor={texto(mantenimiento.tipoFallaCausa)} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Dato etiqueta={ETIQUETAS.trabajo_realizado} valor={texto(mantenimiento.trabajo_realizado)} />
            </div>
          </dl>
        </TabsContent>

        <TabsContent value="fechas" className="mt-4">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Dato etiqueta={ETIQUETAS.fecha_inicio} valor={fechaLegible(mantenimiento.fecha_inicio, true)} />
            <Dato etiqueta={ETIQUETAS.fecha_finalizacion} valor={fechaLegible(mantenimiento.fecha_finalizacion, true)} />
            <Dato etiqueta={ETIQUETAS.tiempo_empleado} valor={textoTiempoEmpleado(mantenimiento.tiempo_empleado)} />
            <Dato etiqueta={ETIQUETAS.aseguro} valor={texto(mantenimiento.aseguro)} />
          </dl>
        </TabsContent>

        <TabsContent value="costos" className="mt-4">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Dato etiqueta={ETIQUETAS.costo_mn} valor={moneda(mantenimiento.costo_mn)} />
            <Dato etiqueta={ETIQUETAS.costo_mlc} valor={moneda(mantenimiento.costo_mlc)} />
            <Dato etiqueta={ETIQUETAS.diesel_lit} valor={litros(mantenimiento.diesel_lit)} />
            <Dato etiqueta={ETIQUETAS.gasolina_lit} valor={litros(mantenimiento.gasolina_lit)} />
          </dl>
        </TabsContent>

        <TabsContent value="responsables" className="mt-4">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Dato etiqueta={ETIQUETAS.informa} valor={texto(mantenimiento.informa)} />
            <Dato etiqueta={ETIQUETAS.transmite} valor={texto(mantenimiento.transmite)} />
            <Dato etiqueta={ETIQUETAS.rg} valor={texto(mantenimiento.rg)} />
            <Dato etiqueta={ETIQUETAS.orden} valor={texto(mantenimiento.orden)} />
            <Dato etiqueta={ETIQUETAS.introdujo} valor={texto(mantenimiento.introdujo)} />
          </dl>
        </TabsContent>

        <TabsContent value="historial" className="mt-4">
          <HistorialCambios
            tabla="mantenimientos"
            idRegistro={mantenimiento.id_mantenimiento}
            etiquetas={ETIQUETAS}
            formatearValor={formatearValorHistorial}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
