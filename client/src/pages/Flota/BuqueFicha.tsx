import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CommandSelect } from '@/components/ui/CommandSelect';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ESQUEMA_BUQUE,
  ESQUEMA_MAQUINA,
  ESQUEMA_PLANTA,
  aCampos,
  aTextos,
  flotaService,
  textosVacios,
  type CampoBuque,
  type CampoMaquina,
  type CampoPlanta,
  type Texto,
} from '@/services/api/flotaApi';
import type { CatalogoItem } from '@/services/api/senalesApi';
import { esVacio } from '@/lib/utils';
import { CampoFlota } from './CampoFlota';
import { FilasRepetibles, type FilaEditable } from './FilasRepetibles';

interface BuqueFichaProps {
  idBuque: string | null;
  onTerminado: () => void;
  onCancelar: () => void;
}

type TextoBuque = Texto<CampoBuque>;

const ETIQUETAS_BUQUE: Record<CampoBuque, string> = {
  buque: 'Buque',
  proyecto: 'Proyecto',
  id_empresa: 'Empresa',
  nombre_buque: 'Nombre',
  numero_inventario: 'Número de inventario',
  ano_construccion: 'Año de construcción',
  material_casco: 'Material del casco',
  basificacion: 'Basificación',
  especialidad: 'Especialidad',
  autonomia: 'Autonomía',
  valor_inicial: 'Valor inicial',
  vida_economica: 'Vida económica',
  lista: 'Lista',
  tarifa_mn: 'Tarifa MN',
  tarifa_mlc: 'Tarifa MLC',
  horas_trabajo: 'Horas de trabajo',
  desplazamiento: 'Desplazamiento',
  velocidad: 'Velocidad',
  folio: 'Folio',
  color: 'Color',
  tripulantes: 'Tripulantes',
  no_tripulantes: 'No tripulantes',
  propuesto_baja: 'Propuesto para baja',
  area_navegacion: 'Área de navegación',
  numeral: 'Numeral',
  puerto_matricula: 'Puerto de matrícula',
  registro: 'Registro',
  arqueo_bruto: 'Arqueo bruto',
  arqueo_neto: 'Arqueo neto',
  eslora: 'Eslora (m)',
  manga: 'Manga (m)',
  calado: 'Calado (m)',
  puntal: 'Puntal (m)',
  franco_borda: 'Franco bordo (m)',
  capacidad_combustible: 'Combustible (L)',
  capacidad_aceite: 'Aceite (L)',
  capacidad_agua: 'Agua (L)',
  area_bodega: 'Área de bodega (m²)',
  tipo_propela: 'Tipo de hélice',
  cantidad_propelas: 'Cantidad de hélices',
  cantidad_motores: 'Cantidad de motores',
  izaje_principal_mecanismo: 'Mecanismo (principal)',
  izaje_principal_largo_brazo: 'Largo de brazo (principal)',
  izaje_principal_capacidad: 'Capacidad (principal)',
  izaje_auxiliar_mecanismo: 'Mecanismo (auxiliar)',
  izaje_auxiliar_largo_brazo: 'Largo de brazo (auxiliar)',
  izaje_auxiliar_capacidad: 'Capacidad (auxiliar)',
  cert_navegabilidad_inspeccion: 'Inspección',
  cert_navegabilidad_expedicion: 'Expedición',
  cert_navegabilidad_vence: 'Vence',
  cert_linea_carga_inspeccion: 'Inspección',
  cert_linea_carga_expedicion: 'Expedición',
  cert_linea_carga_vence: 'Vence',
  cert_clase_inspeccion: 'Inspección',
  cert_clase_expedicion: 'Expedición',
  cert_clase_vence: 'Vence',
  notacion_clase: 'Notación de clase',
  visado: 'Visado',
  fecha_visado: 'Fecha de visado',
  vigencia_visado: 'Vigencia del visado',
  lugar_visado: 'Lugar del visado',
  condicionamientos: 'Condicionamientos',
  equipo_hf: 'Equipo HF',
  equipo_vhf: 'Equipo VHF',
  chalecos: 'Chalecos',
  aros: 'Aros salvavidas',
  embarcacion_salvamento: 'Embarcación de salvamento',
  capacidad_embarcacion_salvamento: 'Capacidad de la embarcación',
  extintores_agua: 'Extintores de agua',
  extintores_co2: 'Extintores de CO2',
  extintores_espuma: 'Extintores de espuma',
  extintores_polvo: 'Extintores de polvo',
};

const ETIQUETAS_MAQUINA: Record<CampoMaquina, string> = {
  tipo: 'Tipo',
  ano: 'Año',
  serie: 'Serie',
  ncc: 'NCC',
  ncl: 'NCL',
  potencia: 'Potencia (kW)',
  rpm: 'RPM',
};

const ETIQUETAS_PLANTA: Record<CampoPlanta, string> = {
  tipo: 'Tipo',
  ano: 'Año',
  serie: 'Serie',
  voltaje: 'Voltaje (V)',
  ncc: 'NCC',
  ncl: 'NCL',
};

const GRILLA = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';

const nuevaClave = (): string => `nueva-${Date.now()}-${Math.random().toString(36).slice(2)}`;

// Quita una fila: si ya existe en la base, su id pasa a la lista de eliminadas.
const quitarFila = <K extends string>(filas: FilaEditable<K>[], clave: string) => {
  const id = filas.find((fila) => fila.clave === clave)?.id ?? null;
  return { filas: filas.filter((fila) => fila.clave !== clave), id };
};

const cambiarFila = <K extends string>(filas: FilaEditable<K>[], clave: string, campo: K, valor: string) =>
  filas.map((fila) => (fila.clave === clave ? { ...fila, texto: { ...fila.texto, [campo]: valor } } : fila));

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-400">{titulo}</h3>
      {children}
    </section>
  );
}

export default function BuqueFicha({ idBuque, onTerminado, onCancelar }: BuqueFichaProps) {
  const [idActual, setIdActual] = useState<string | null>(idBuque);
  const [cargando, setCargando] = useState(idBuque !== null);
  const [texto, setTexto] = useState<TextoBuque>(() => textosVacios(ESQUEMA_BUQUE));
  const [maquinas, setMaquinas] = useState<FilaEditable<CampoMaquina>[]>([]);
  const [plantas, setPlantas] = useState<FilaEditable<CampoPlanta>[]>([]);
  const [eliminadasMaquinas, setEliminadasMaquinas] = useState<string[]>([]);
  const [eliminadasPlantas, setEliminadasPlantas] = useState<string[]>([]);
  const [empresas, setEmpresas] = useState<CatalogoItem[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void flotaService.getCatalogos().then((catalogos) => setEmpresas(catalogos.empresas)).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!idBuque) return;
    let activo = true;
    void flotaService.cargarFichaBuque(idBuque).then((respuesta) => {
      if (!activo) return;
      if (respuesta.success && respuesta.data.buque) {
        const { buque, maquinas: filasMaquinas, plantas: filasPlantas } = respuesta.data;
        setTexto(aTextos(ESQUEMA_BUQUE, buque));
        setMaquinas(filasMaquinas.map((fila) => ({
          clave: fila.id_buque_maquina,
          id: fila.id_buque_maquina,
          texto: aTextos(ESQUEMA_MAQUINA, fila),
        })));
        setPlantas(filasPlantas.map((fila) => ({
          clave: fila.id_buque_planta,
          id: fila.id_buque_planta,
          texto: aTextos(ESQUEMA_PLANTA, fila),
        })));
      } else {
        setError(respuesta.success ? 'No se encontró el buque.' : respuesta.message);
      }
      setCargando(false);
    });
    return () => {
      activo = false;
    };
  }, [idBuque]);

  const cambiarBuque = (campo: CampoBuque, valor: string) => {
    setTexto((previo) => ({ ...previo, [campo]: valor }));
  };

  const campo = (clave: CampoBuque) => (
    <CampoFlota
      key={clave}
      id={clave}
      etiqueta={ETIQUETAS_BUQUE[clave]}
      valor={texto[clave]}
      tipo={ESQUEMA_BUQUE[clave]}
      onCambiar={(valor) => cambiarBuque(clave, valor)}
    />
  );

  const guardar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (esVacio(texto.buque)) {
      setError('El buque es obligatorio.');
      return;
    }

    setGuardando(true);
    setError(null);

    const campos = aCampos(ESQUEMA_BUQUE, texto);
    const resBuque = idActual
      ? await flotaService.actualizarBuque(idActual, campos)
      : await flotaService.crearBuque(campos);
    if (!resBuque.success) {
      setError(resBuque.message);
      setGuardando(false);
      return;
    }

    const id = resBuque.data;
    setIdActual(id);

    const resMaquinas = await flotaService.guardarMaquinas(
      id,
      maquinas.map((fila) => ({ id: fila.id, campos: aCampos(ESQUEMA_MAQUINA, fila.texto) })),
      eliminadasMaquinas
    );
    const resPlantas = await flotaService.guardarPlantas(
      id,
      plantas.map((fila) => ({ id: fila.id, campos: aCampos(ESQUEMA_PLANTA, fila.texto) })),
      eliminadasPlantas
    );

    setGuardando(false);
    const fallo = [resMaquinas, resPlantas].find((resultado) => !resultado.success);
    if (fallo) {
      setError(`El buque se guardó, pero no se guardaron todas las máquinas o plantas: ${fallo.message}`);
      return;
    }
    onTerminado();
  };

  if (cargando) {
    return <p className="py-12 text-center text-gray-600 dark:text-gray-300">Cargando buque...</p>;
  }

  return (
    <form onSubmit={guardar} className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general">
        <TabsList className="flex h-auto w-full flex-wrap justify-start bg-blue-100 dark:bg-gray-700">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="propulsion">Propulsión</TabsTrigger>
          <TabsTrigger value="plantas">Plantas</TabsTrigger>
          <TabsTrigger value="izaje">Medios de izaje</TabsTrigger>
          <TabsTrigger value="certificados">Certificados</TabsTrigger>
          <TabsTrigger value="salvamento">Salvamento y C/I</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4 space-y-6">
          <div className={GRILLA}>
            {campo('buque')}
            {campo('nombre_buque')}
            <CommandSelect
              value={texto.id_empresa}
              onValueChange={(valor) => cambiarBuque('id_empresa', valor)}
              placeholder="Seleccionar empresa"
              searchPlaceholder="Buscar empresa..."
              emptyMessage="No se encontraron empresas"
              items={empresas}
              label="Empresa"
              pendiente={esVacio(texto.id_empresa)}
            />
            {campo('proyecto')}
            {campo('numero_inventario')}
            {campo('ano_construccion')}
            {campo('material_casco')}
            {campo('basificacion')}
            {campo('especialidad')}
            {campo('lista')}
            {campo('folio')}
            {campo('color')}
            {campo('numeral')}
            {campo('area_navegacion')}
            {campo('puerto_matricula')}
            {campo('registro')}
            {campo('arqueo_bruto')}
            {campo('arqueo_neto')}
            {campo('autonomia')}
            {campo('valor_inicial')}
            {campo('vida_economica')}
            {campo('tarifa_mn')}
            {campo('tarifa_mlc')}
            {campo('horas_trabajo')}
            {campo('desplazamiento')}
            {campo('velocidad')}
            {campo('tripulantes')}
            {campo('no_tripulantes')}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="propuesto_baja"
              checked={texto.propuesto_baja === 'true'}
              onCheckedChange={(valor) => cambiarBuque('propuesto_baja', valor === true ? 'true' : 'false')}
            />
            <label htmlFor="propuesto_baja" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {ETIQUETAS_BUQUE.propuesto_baja}
            </label>
          </div>
          <Seccion titulo="Dimensiones">
            <div className={GRILLA}>
              {campo('eslora')}
              {campo('manga')}
              {campo('calado')}
              {campo('puntal')}
              {campo('franco_borda')}
            </div>
          </Seccion>
          <Seccion titulo="Capacidades">
            <div className={GRILLA}>
              {campo('capacidad_combustible')}
              {campo('capacidad_aceite')}
              {campo('capacidad_agua')}
              {campo('area_bodega')}
            </div>
          </Seccion>
        </TabsContent>

        <TabsContent value="propulsion" className="mt-4 space-y-6">
          <div className={GRILLA}>
            {campo('tipo_propela')}
            {campo('cantidad_propelas')}
            {campo('cantidad_motores')}
          </div>
          <Seccion titulo="Máquinas">
            <FilasRepetibles
              idPrefijo="maquina"
              esquema={ESQUEMA_MAQUINA}
              etiquetas={ETIQUETAS_MAQUINA}
              filas={maquinas}
              onCambiar={(clave, campoFila, valor) =>
                setMaquinas((previas) => cambiarFila(previas, clave, campoFila, valor))}
              onAgregar={() => setMaquinas((previas) => [...previas, { clave: nuevaClave(), texto: textosVacios(ESQUEMA_MAQUINA) }])}
              onQuitar={(clave) => {
                const resultado = quitarFila(maquinas, clave);
                setMaquinas(resultado.filas);
                const eliminada = resultado.id;
                if (eliminada) setEliminadasMaquinas((previas) => [...previas, eliminada]);
              }}
            />
          </Seccion>
        </TabsContent>

        <TabsContent value="plantas" className="mt-4">
          <FilasRepetibles
            idPrefijo="planta"
            esquema={ESQUEMA_PLANTA}
            etiquetas={ETIQUETAS_PLANTA}
            filas={plantas}
            onCambiar={(clave, campoFila, valor) =>
              setPlantas((previas) => cambiarFila(previas, clave, campoFila, valor))}
            onAgregar={() => setPlantas((previas) => [...previas, { clave: nuevaClave(), texto: textosVacios(ESQUEMA_PLANTA) }])}
            onQuitar={(clave) => {
              const resultado = quitarFila(plantas, clave);
              setPlantas(resultado.filas);
              const eliminada = resultado.id;
              if (eliminada) setEliminadasPlantas((previas) => [...previas, eliminada]);
            }}
          />
        </TabsContent>

        <TabsContent value="izaje" className="mt-4 space-y-6">
          <Seccion titulo="Izaje principal">
            <div className={GRILLA}>
              {campo('izaje_principal_mecanismo')}
              {campo('izaje_principal_largo_brazo')}
              {campo('izaje_principal_capacidad')}
            </div>
          </Seccion>
          <Seccion titulo="Izaje auxiliar">
            <div className={GRILLA}>
              {campo('izaje_auxiliar_mecanismo')}
              {campo('izaje_auxiliar_largo_brazo')}
              {campo('izaje_auxiliar_capacidad')}
            </div>
          </Seccion>
        </TabsContent>

        <TabsContent value="certificados" className="mt-4 space-y-6">
          <Seccion titulo="Navegabilidad">
            <div className={GRILLA}>
              {campo('cert_navegabilidad_inspeccion')}
              {campo('cert_navegabilidad_expedicion')}
              {campo('cert_navegabilidad_vence')}
            </div>
          </Seccion>
          <Seccion titulo="Línea de carga">
            <div className={GRILLA}>
              {campo('cert_linea_carga_inspeccion')}
              {campo('cert_linea_carga_expedicion')}
              {campo('cert_linea_carga_vence')}
            </div>
          </Seccion>
          <Seccion titulo="Clase">
            <div className={GRILLA}>
              {campo('cert_clase_inspeccion')}
              {campo('cert_clase_expedicion')}
              {campo('cert_clase_vence')}
              {campo('notacion_clase')}
            </div>
          </Seccion>
          <Seccion titulo="Visado">
            <div className={GRILLA}>
              {campo('visado')}
              {campo('fecha_visado')}
              {campo('vigencia_visado')}
              {campo('lugar_visado')}
              {campo('condicionamientos')}
            </div>
          </Seccion>
        </TabsContent>

        <TabsContent value="salvamento" className="mt-4 space-y-6">
          <div className={GRILLA}>
            {campo('equipo_hf')}
            {campo('equipo_vhf')}
            {campo('chalecos')}
            {campo('aros')}
            {campo('embarcacion_salvamento')}
            {campo('capacidad_embarcacion_salvamento')}
            {campo('extintores_agua')}
            {campo('extintores_co2')}
            {campo('extintores_espuma')}
            {campo('extintores_polvo')}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Button>
        <Button type="submit" variant="brand" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}
