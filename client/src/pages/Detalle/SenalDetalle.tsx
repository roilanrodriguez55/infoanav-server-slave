import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertCircle, ArrowLeft, Ban, Loader2, Pencil, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import HistorialCambios from '@/components/common/HistorialCambios';
import { DarBajaDialog } from '@/components/senal/DarBajaDialog';
import TabHechos from '@/components/senal/TabHechos';
import TabLmf from '@/components/senal/TabLmf';
import { VinculoEquipo } from '@/components/senal/VinculoEquipo';
import TabMantenimientos from '@/components/senal/TabMantenimientos';
import TabPronostico from '@/components/senal/TabPronostico';
import TabRacon from '@/components/senal/TabRacon';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/config/axiosConfig';
import { senalesService, type CatalogoItem, type CatalogosResponse } from '@/services/api/senalesApi';

interface Senal {
  id_senal: string;
  codigo_lsm: string | null;
  nombre: string | null;
  id_tipo: string | null;
  id_categoria: string | null;
  id_modelo: string | null;
  id_estacion: string | null;
  luminica: boolean | null;
  secreta: boolean | null;
  fecha_instalacion: string | null;
  id_usuario_navegacion: string | null;
  monitoreo: string | null;
  id_zona: string | null;
  reflector_radar: boolean | null;
  repeticion: boolean | null;
  id_estado: string | null;
  id_material: string | null;
  control_distancia: boolean | null;
  id_energia: string | null;
  id_marca_tope: string | null;
  id_complejidad: string | null;
  observaciones: string | null;
  id_color: string | null;
  id_forma: string | null;
  altura: number | null;
  elevacion: number | null;
  profundidad: number | null;
  alcancegeografico: number | null;
  latitud: number | null;
  longitud: number | null;
  id_mar: string | null;
  ubicacion: string | null;
  alcanceluminico: number | null;
  intensidadluminica: number | null;
  id_colorluz: string | null;
  id_caracteristica: string | null;
  periodo: number | null;
  oscuridad: number | null;
  tiempoluz: number | null;
  potenciabombillo: number | null;
  voltagebombillo: number | null;
  consumodestellador: number | null;
  sistema_fondeo: string | null;
  fecha_retirada: string | null;
  causa_retirada: string | null;
}

interface EquipamientoSenal {
  id_equipamiento: string;
  id_tipo_equipamiento: string | null;
  nombre: string | null;
  cantidad: number | null;
  num_inventario: string | null;
  id_equipo?: string | null;
}

interface FallaResumen {
  id_falla: string;
  fecha_falla: string | null;
  fecha_restablecer: string | null;
  causa_de_falla: string | null;
}

interface SistemaFondeo {
  no_serie_flotador?: string;
  cadenas?: { diametro: string; cantidad: number }[];
  pesos_muertos?: { peso: string; cantidad: number }[];
  bridas?: { tipo: string; cantidad: number }[];
  grectos?: { tipo: string; cantidad: number; giratorio: boolean }[];
}

interface DatosDetalle {
  senal: Senal | null;
  catalogos: CatalogosResponse;
  equipamientos: EquipamientoSenal[];
  fallas: FallaResumen[];
}

type CatalogoClave = Exclude<keyof CatalogosResponse, 'tiposEquipamiento'>;

const ETIQUETAS: Record<string, string> = {
  codigo_lsm: 'Código LSM',
  nombre: 'Nombre',
  id_tipo: 'Tipo de señal',
  id_categoria: 'Categoría',
  id_modelo: 'Modelo',
  id_estacion: 'Estación',
  luminica: 'Lumínica',
  secreta: 'Secreta',
  fecha_instalacion: 'Fecha de instalación',
  id_usuario_navegacion: 'Usuario',
  monitoreo: 'Monitoreo',
  id_zona: 'Zona',
  reflector_radar: 'Reflector radar',
  repeticion: 'Repetición',
  id_estado: 'Estado de la señal',
  id_material: 'Material',
  control_distancia: 'Control a distancia',
  id_energia: 'Energía',
  id_marca_tope: 'Marca de tope',
  observaciones: 'Observaciones',
  id_color: 'Color',
  id_forma: 'Forma',
  altura: 'Altura (m)',
  elevacion: 'Elevación (m)',
  profundidad: 'Profundidad (m)',
  alcancegeografico: 'Alcance geográfico (millas)',
  latitud: 'Latitud',
  longitud: 'Longitud',
  id_mar: 'Mar',
  ubicacion: 'Ubicación',
  alcanceluminico: 'Alcance lumínico (millas)',
  intensidadluminica: 'Intensidad lumínica (cd)',
  id_colorluz: 'Color de luz',
  id_caracteristica: 'Característica',
  periodo: 'Periodo (seg)',
  oscuridad: 'Oscuridad (seg)',
  tiempoluz: 'Tiempo de luz (seg)',
  potenciabombillo: 'Potencia del bombillo (W)',
  voltagebombillo: 'Voltaje del bombillo (V)',
  consumodestellador: 'Consumo destellador (W)',
  sistema_fondeo: 'Sistema de fondeo',
};

const CATALOGO_POR_CAMPO: Record<string, CatalogoClave> = {
  id_tipo: 'tipos',
  id_categoria: 'categorias',
  id_modelo: 'modelos',
  id_estacion: 'estaciones',
  id_usuario_navegacion: 'usuariosNavegacion',
  id_zona: 'zonas',
  id_estado: 'estados',
  id_material: 'materiales',
  id_energia: 'energias',
  id_marca_tope: 'marcasTope',
  id_color: 'colores',
  id_forma: 'formas',
  id_mar: 'mares',
  id_colorluz: 'coloresLuz',
  id_caracteristica: 'caracteristicas',
};

const FORMATO_ISO_FECHA = /^\d{4}-\d{2}-\d{2}T/;

const cargarDatos = async (id: string): Promise<DatosDetalle> => {
  const [senalRes, catalogos, equipamientoRes, fallasRes] = await Promise.all([
    senalesService.getSenalById(id),
    senalesService.getCatalogos(),
    senalesService.getEquipamientos(id),
    api.get<FallaResumen[]>(
      `/fallas?id_senal=eq.${id}&deleted_at=is.null&select=id_falla,fecha_falla,fecha_restablecer,causa_de_falla&order=fecha_falla.desc&limit=10`
    ),
  ]);

  if (!senalRes.success) throw new Error(senalRes.message);
  if (!equipamientoRes.success) throw new Error(equipamientoRes.message);

  const senales = senalRes.data as Senal[] | null;
  const equipamientos = equipamientoRes.data as EquipamientoSenal[] | null;

  return {
    senal: senales?.[0] ?? null,
    catalogos,
    equipamientos: equipamientos ?? [],
    fallas: fallasRes.data,
  };
};

const nombreDe = (lista: CatalogoItem[] | undefined, id: string | null | undefined): string => {
  if (!id) return '—';
  return lista?.find((item) => item.id === id)?.nombre ?? '—';
};

const texto = (valor: string | null | undefined): string => (valor?.length ? valor : '—');

const numero = (valor: number | null | undefined): string =>
  valor === null || valor === undefined ? '—' : String(valor);

const sinoNo = (valor: boolean | null | undefined): string =>
  valor === null || valor === undefined ? '—' : valor ? 'Sí' : 'No';

const fechaLegible = (valor: string | null | undefined, conHora = false): string => {
  if (!valor) return '—';
  const date = new Date(valor);
  if (!isValid(date)) return '—';
  return format(date, conHora ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy', { locale: es });
};

const parsearFondeo = (valor: string | null): SistemaFondeo | null => {
  if (!valor) return null;
  try {
    return JSON.parse(valor) as SistemaFondeo;
  } catch {
    return null;
  }
};

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-sm font-medium text-blue-900 dark:text-gray-200">{etiqueta}</dt>
      <dd className="break-words text-sm text-gray-700 dark:text-gray-300">{valor}</dd>
    </div>
  );
}

export default function SenalDetalle() {
  const { id = '' } = useParams<{ id: string }>();
  const [datos, setDatos] = useState<DatosDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [pestana, setPestana] = useState('generales');
  const [bajaAbierta, setBajaAbierta] = useState(false);
  const [reactivarAbierto, setReactivarAbierto] = useState(false);
  const [reactivando, setReactivando] = useState(false);
  const [accionError, setAccionError] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      setCargando(true);
      setError(null);
      try {
        const resultado = await cargarDatos(id);
        if (!cancelado) setDatos(resultado);
      } catch (err: unknown) {
        if (!cancelado) setError(err instanceof Error ? err.message : 'Error al cargar la señal');
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
          <p className="text-gray-600 dark:text-gray-300">Cargando señal...</p>
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
              <Link to="/gestion-senales">
                <ArrowLeft />
                Volver
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const senal = datos?.senal ?? null;

  if (!datos || !senal) {
    return (
      <Card className="mx-auto mt-8 max-w-md">
        <CardHeader>
          <CardTitle>Señal no encontrada</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link to="/gestion-senales">
              <ArrowLeft />
              Volver
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { catalogos, equipamientos, fallas } = datos;
  const esBoya = nombreDe(catalogos.tipos, senal.id_tipo).toLowerCase() === 'boya';
  const luminica = senal.luminica ?? true;
  const fondeo = parsearFondeo(senal.sistema_fondeo);
  const dadaDeBaja = Boolean(senal.fecha_retirada);

  const reactivar = async () => {
    setReactivando(true);
    setAccionError(null);
    const respuesta = await senalesService.reactivar(senal.id_senal);
    setReactivando(false);

    if (!respuesta.success) {
      setAccionError(respuesta.message || 'Error desconocido');
      return;
    }
    setReactivarAbierto(false);
    setIntento((n) => n + 1);
  };

  const formatearValorHistorial = (campo: string, valor: unknown): string => {
    const clave = CATALOGO_POR_CAMPO[campo];
    if (clave && typeof valor === 'string') return nombreDe(catalogos[clave], valor);
    if (typeof valor === 'boolean') return sinoNo(valor);
    if (typeof valor === 'string' && FORMATO_ISO_FECHA.test(valor)) return fechaLegible(valor, true);
    return typeof valor === 'string' ? valor : JSON.stringify(valor);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-blue-900 dark:text-white">{texto(senal.nombre)}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <span>Código LSM: {texto(senal.codigo_lsm)}</span>
            <Badge variant="outline">{nombreDe(catalogos.estados, senal.id_estado)}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/gestion-senales">
              <ArrowLeft />
              Volver
            </Link>
          </Button>
          {!dadaDeBaja && (
            <Button
              variant="outline"
              onClick={() => setBajaAbierta(true)}
              className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-gray-600 dark:text-amber-300 dark:hover:bg-gray-800"
            >
              <Ban />
              Dar baja
            </Button>
          )}
          {dadaDeBaja && isAdmin && (
            <Button
              variant="outline"
              onClick={() => setReactivarAbierto(true)}
              className="border-green-300 text-green-700 hover:bg-green-50 dark:border-gray-600 dark:text-green-300 dark:hover:bg-gray-800"
            >
              <RotateCcw />
              Reactivar
            </Button>
          )}
          {!dadaDeBaja && (
            <Button asChild>
              <Link to={`/gestion-senales/editar/${senal.id_senal}`}>
                <Pencil />
                Editar
              </Link>
            </Button>
          )}
        </div>
      </div>

      {dadaDeBaja && (
        <Alert className="bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700">
          <Ban className="h-4 w-4 text-amber-700 dark:text-amber-400" />
          <AlertDescription className="text-amber-900 dark:text-amber-200">
            Retirada el {fechaLegible(senal.fecha_retirada)}
            {senal.causa_retirada ? `. Causa: ${senal.causa_retirada}` : ''}
          </AlertDescription>
        </Alert>
      )}

      {accionError && (
        <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-700 dark:text-red-300">{accionError}</AlertDescription>
        </Alert>
      )}

      <Tabs value={pestana} onValueChange={setPestana}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start bg-blue-100 dark:bg-gray-700">
          <TabsTrigger value="generales" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:text-gray-300">
            Datos Generales
          </TabsTrigger>
          <TabsTrigger value="geograficos" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:text-gray-300">
            Datos Geográficos
          </TabsTrigger>
          <TabsTrigger value="luminicos" disabled={!luminica} className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[disabled]:opacity-50 dark:text-gray-300">
            Datos Lumínicos
          </TabsTrigger>
          <TabsTrigger value="equipamiento" disabled={!luminica} className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[disabled]:opacity-50 dark:text-gray-300">
            Equipamiento
          </TabsTrigger>
          <TabsTrigger value="pronostico" disabled={!luminica} className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[disabled]:opacity-50 dark:text-gray-300">
            Pronóstico
          </TabsTrigger>
          <TabsTrigger value="fondeo" disabled={!esBoya} className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[disabled]:opacity-50 dark:text-gray-300">
            Sistema de Fondeo
          </TabsTrigger>
          <TabsTrigger value="fallas" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:text-gray-300">
            Fallas
          </TabsTrigger>
          <TabsTrigger value="mantenimientos" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:text-gray-300">
            Mantenimientos
          </TabsTrigger>
          <TabsTrigger value="radioelectrico" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:text-gray-300">
            Radioeléctrico
          </TabsTrigger>
          <TabsTrigger value="lmf" disabled={!esBoya} className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[disabled]:opacity-50 dark:text-gray-300">
            Leva, Mantenimiento y Fondeo (LMF)
          </TabsTrigger>
          <TabsTrigger value="hechos" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:text-gray-300">
            Hechos
          </TabsTrigger>
          <TabsTrigger value="historial" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:text-gray-300">
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generales" className="mt-4">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Dato etiqueta={ETIQUETAS.codigo_lsm} valor={texto(senal.codigo_lsm)} />
            <Dato etiqueta={ETIQUETAS.nombre} valor={texto(senal.nombre)} />
            <Dato etiqueta={ETIQUETAS.id_tipo} valor={nombreDe(catalogos.tipos, senal.id_tipo)} />
            <Dato etiqueta={ETIQUETAS.id_categoria} valor={nombreDe(catalogos.categorias, senal.id_categoria)} />
            <Dato etiqueta={ETIQUETAS.id_modelo} valor={nombreDe(catalogos.modelos, senal.id_modelo)} />
            <Dato etiqueta={ETIQUETAS.id_estacion} valor={nombreDe(catalogos.estaciones, senal.id_estacion)} />
            <Dato etiqueta={ETIQUETAS.luminica} valor={sinoNo(senal.luminica)} />
            <Dato etiqueta={ETIQUETAS.secreta} valor={sinoNo(senal.secreta)} />
            <Dato etiqueta={ETIQUETAS.fecha_instalacion} valor={fechaLegible(senal.fecha_instalacion)} />
            <Dato etiqueta={ETIQUETAS.id_usuario_navegacion} valor={nombreDe(catalogos.usuariosNavegacion, senal.id_usuario_navegacion)} />
            <Dato etiqueta={ETIQUETAS.monitoreo} valor={texto(senal.monitoreo)} />
            <Dato etiqueta={ETIQUETAS.id_zona} valor={nombreDe(catalogos.zonas, senal.id_zona)} />
            <Dato etiqueta={ETIQUETAS.reflector_radar} valor={sinoNo(senal.reflector_radar)} />
            <Dato etiqueta={ETIQUETAS.repeticion} valor={sinoNo(senal.repeticion)} />
            <Dato etiqueta={ETIQUETAS.id_estado} valor={nombreDe(catalogos.estados, senal.id_estado)} />
            <Dato etiqueta={ETIQUETAS.id_material} valor={nombreDe(catalogos.materiales, senal.id_material)} />
            <Dato etiqueta={ETIQUETAS.control_distancia} valor={sinoNo(senal.control_distancia)} />
            <Dato etiqueta={ETIQUETAS.id_energia} valor={nombreDe(catalogos.energias, senal.id_energia)} />
            <Dato etiqueta={ETIQUETAS.id_marca_tope} valor={nombreDe(catalogos.marcasTope, senal.id_marca_tope)} />
            <Dato etiqueta="Complejidad" valor={nombreDe(catalogos.complejidades, senal.id_complejidad)} />
            <div className="sm:col-span-2 lg:col-span-3">
              <Dato etiqueta={ETIQUETAS.observaciones} valor={texto(senal.observaciones)} />
            </div>
          </dl>
        </TabsContent>

        <TabsContent value="geograficos" className="mt-4">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Dato etiqueta={ETIQUETAS.id_color} valor={nombreDe(catalogos.colores, senal.id_color)} />
            <Dato etiqueta={ETIQUETAS.id_forma} valor={nombreDe(catalogos.formas, senal.id_forma)} />
            <Dato etiqueta={ETIQUETAS.altura} valor={numero(senal.altura)} />
            <Dato etiqueta={ETIQUETAS.elevacion} valor={numero(senal.elevacion)} />
            <Dato etiqueta={ETIQUETAS.profundidad} valor={numero(senal.profundidad)} />
            <Dato etiqueta={ETIQUETAS.alcancegeografico} valor={numero(senal.alcancegeografico)} />
            <Dato etiqueta={ETIQUETAS.latitud} valor={numero(senal.latitud)} />
            <Dato etiqueta={ETIQUETAS.longitud} valor={numero(senal.longitud)} />
            <Dato etiqueta={ETIQUETAS.id_mar} valor={nombreDe(catalogos.mares, senal.id_mar)} />
            <Dato etiqueta={ETIQUETAS.ubicacion} valor={texto(senal.ubicacion)} />
          </dl>
        </TabsContent>

        <TabsContent value="luminicos" className="mt-4">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Dato etiqueta={ETIQUETAS.alcanceluminico} valor={numero(senal.alcanceluminico)} />
            <Dato etiqueta={ETIQUETAS.intensidadluminica} valor={numero(senal.intensidadluminica)} />
            <Dato etiqueta={ETIQUETAS.id_colorluz} valor={nombreDe(catalogos.coloresLuz, senal.id_colorluz)} />
            <Dato etiqueta={ETIQUETAS.id_caracteristica} valor={nombreDe(catalogos.caracteristicas, senal.id_caracteristica)} />
            <Dato etiqueta={ETIQUETAS.periodo} valor={numero(senal.periodo)} />
            <Dato etiqueta={ETIQUETAS.oscuridad} valor={numero(senal.oscuridad)} />
            <Dato etiqueta={ETIQUETAS.tiempoluz} valor={numero(senal.tiempoluz)} />
            <Dato etiqueta={ETIQUETAS.potenciabombillo} valor={numero(senal.potenciabombillo)} />
            <Dato etiqueta={ETIQUETAS.voltagebombillo} valor={numero(senal.voltagebombillo)} />
            <Dato etiqueta={ETIQUETAS.consumodestellador} valor={numero(senal.consumodestellador)} />
          </dl>
        </TabsContent>

        <TabsContent value="equipamiento" className="mt-4">
          {equipamientos.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">—</p>
          ) : (
            <ul className="space-y-3">
              {equipamientos.map((equipo) => (
                <li key={equipo.id_equipamiento} className="rounded-lg border border-blue-100 p-3 dark:border-gray-700">
                  <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Dato
                      etiqueta="Tipo de equipamiento"
                      valor={nombreDe(catalogos.tiposEquipamiento.map((t) => ({ id: t.id_tipo_equipamiento, nombre: t.nombre })), equipo.id_tipo_equipamiento)}
                    />
                    <Dato etiqueta="Nombre" valor={texto(equipo.nombre)} />
                    <Dato etiqueta="Cantidad" valor={numero(equipo.cantidad)} />
                    <Dato etiqueta="N° inventario" valor={texto(equipo.num_inventario)} />
                  </dl>
                  <VinculoEquipo
                    idEquipamiento={equipo.id_equipamiento}
                    idTipoEquipamiento={equipo.id_tipo_equipamiento}
                    idEquipo={equipo.id_equipo ?? null}
                  />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="pronostico" className="mt-4">
          <TabPronostico key={senal.id_senal} idSenal={senal.id_senal} />
        </TabsContent>

        <TabsContent value="fondeo" className="mt-4">
          {!fondeo ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">—</p>
          ) : (
            <div className="space-y-6">
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Dato etiqueta="N° serie flotador" valor={texto(fondeo.no_serie_flotador)} />
              </dl>
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-gray-200">Cadenas</h3>
                <ul className="list-inside list-disc text-sm text-gray-700 dark:text-gray-300">
                  {(fondeo.cadenas ?? []).map((item, i) => (
                    <li key={i}>Diámetro {texto(item.diametro)} mm · Cantidad {item.cantidad}</li>
                  ))}
                </ul>
              </section>
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-gray-200">Pesos muertos</h3>
                <ul className="list-inside list-disc text-sm text-gray-700 dark:text-gray-300">
                  {(fondeo.pesos_muertos ?? []).map((item, i) => (
                    <li key={i}>Peso {texto(item.peso)} kg · Cantidad {item.cantidad}</li>
                  ))}
                </ul>
              </section>
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-gray-200">Bridas</h3>
                <ul className="list-inside list-disc text-sm text-gray-700 dark:text-gray-300">
                  {(fondeo.bridas ?? []).map((item, i) => (
                    <li key={i}>Tipo {texto(item.tipo)} · Cantidad {item.cantidad}</li>
                  ))}
                </ul>
              </section>
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-gray-200">Grectos</h3>
                <ul className="list-inside list-disc text-sm text-gray-700 dark:text-gray-300">
                  {(fondeo.grectos ?? []).map((item, i) => (
                    <li key={i}>Tipo {texto(item.tipo)} · Cantidad {item.cantidad} · Giratorio {sinoNo(item.giratorio)}</li>
                  ))}
                </ul>
              </section>
            </div>
          )}
        </TabsContent>

        <TabsContent value="fallas" className="mt-4 space-y-6">
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-gray-200">Fallas</h3>
              <div className="flex items-center gap-4">
                <Link to={`/gestion-fallas/nuevo?senal=${senal.id_senal}`} className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                  Registrar falla
                </Link>
                <Link to={`/gestion-fallas?senal=${senal.id_senal}`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                  Ver todas
                </Link>
              </div>
            </div>
            {fallas.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">—</p>
            ) : (
              <ul className="divide-y divide-blue-100 dark:divide-gray-700">
                {fallas.map((falla) => (
                  <li key={falla.id_falla}>
                    <Link to={`/gestion-fallas/${falla.id_falla}`} className="flex flex-col gap-1 py-2 hover:bg-blue-50 dark:hover:bg-gray-800">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{fechaLegible(falla.fecha_falla, true)}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Restablecer: {fechaLegible(falla.fecha_restablecer, true)} · {texto(falla.causa_de_falla)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </TabsContent>

        <TabsContent value="mantenimientos" className="mt-4">
          <TabMantenimientos idSenal={senal.id_senal} />
        </TabsContent>

        <TabsContent value="radioelectrico" className="mt-4">
          <TabRacon idSenal={senal.id_senal} />
        </TabsContent>

        <TabsContent value="lmf" className="mt-4">
          <TabLmf idSenal={senal.id_senal} />
        </TabsContent>

        <TabsContent value="hechos" className="mt-4">
          <TabHechos idSenal={senal.id_senal} />
        </TabsContent>

        <TabsContent value="historial" className="mt-4">
          <HistorialCambios
            tabla="senales"
            idRegistro={senal.id_senal}
            etiquetas={ETIQUETAS}
            formatearValor={formatearValorHistorial}
          />
        </TabsContent>
      </Tabs>

      <DarBajaDialog
        open={bajaAbierta}
        onOpenChange={setBajaAbierta}
        idSenal={senal.id_senal}
        codigoLsm={senal.codigo_lsm}
        onDadaDeBaja={() => setIntento((n) => n + 1)}
      />

      <AlertDialog open={reactivarAbierto} onOpenChange={setReactivarAbierto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reactivar la señal?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrarán la fecha y la causa de retirada de la señal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reactivando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void reactivar()}
              disabled={reactivando}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {reactivando ? 'Reactivando...' : 'Reactivar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
