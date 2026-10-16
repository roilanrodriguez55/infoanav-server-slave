import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import PageMeta from '@/components/common/PageMeta';
import { ExportarTabla, type CeldaExport, type ColumnaExport } from '@/components/common/ExportarTabla';
import { FilterBar, FilterField } from '@/components/common/FilterBar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { estadisticasService, type SenalEstadistica } from '@/services/api/estadisticasApi';

// Radix Select no admite value vacio; esta opcion equivale a sin filtro.
const TODOS = '__all__';

// Los doce criterios por identificador. La clave es el nombre del parametro de /gestion-senales.
const CRITERIOS = [
  { clave: 'empresa', etiqueta: 'Empresa', campoId: 'id_empresa', campoNombre: 'empresa' },
  { clave: 'estacion', etiqueta: 'Estación', campoId: 'id_estacion', campoNombre: 'estacion' },
  { clave: 'tipo', etiqueta: 'Tipo', campoId: 'id_tipo', campoNombre: 'tipo' },
  { clave: 'categoria', etiqueta: 'Categoría', campoId: 'id_categoria', campoNombre: 'categoria' },
  { clave: 'complejidad', etiqueta: 'Complejidad', campoId: 'id_complejidad', campoNombre: 'complejidad' },
  { clave: 'usuario_navegacion', etiqueta: 'Usuario de navegación', campoId: 'id_usuario_navegacion', campoNombre: 'usuario_navegacion' },
  { clave: 'caracteristica', etiqueta: 'Característica', campoId: 'id_caracteristica', campoNombre: 'caracteristica' },
  { clave: 'colorluz', etiqueta: 'Color de luz', campoId: 'id_colorluz', campoNombre: 'color_luz' },
  { clave: 'color', etiqueta: 'Color', campoId: 'id_color', campoNombre: 'color' },
  { clave: 'modelo', etiqueta: 'Modelo', campoId: 'id_modelo', campoNombre: 'modelo' },
  { clave: 'forma', etiqueta: 'Forma', campoId: 'id_forma', campoNombre: 'forma' },
  { clave: 'material', etiqueta: 'Material', campoId: 'id_material', campoNombre: 'material' },
] as const;

// El decimo tercer criterio es la dimension: una de las tres, por valor exacto.
const DIMENSIONES = [
  { campo: 'altura', etiqueta: 'Altura' },
  { campo: 'elevacion', etiqueta: 'Elevación' },
  { campo: 'profundidad', etiqueta: 'Profundidad' },
] as const;

type CriterioClave = (typeof CRITERIOS)[number]['clave'];
type CampoDimension = (typeof DIMENSIONES)[number]['campo'];
type Filtros = Record<CriterioClave, string>;
type Agrupacion = 'empresa' | 'empresa_estacion';
type Vista = 'detalle' | 'resumen';

interface OpcionCriterio {
  id: string;
  nombre: string;
}

interface Grupo {
  clave: string;
  empresaId: string | null;
  empresa: string;
  estacionId: string | null;
  estacion: string;
  senales: SenalEstadistica[];
}

const SIN_EMPRESA = 'Sin empresa';
const SIN_ESTACION = 'Sin estación';

const FILTROS_VACIOS = Object.fromEntries(CRITERIOS.map((c) => [c.clave, ''])) as Filtros;

const COLUMNAS_DETALLE: ColumnaExport[] = [
  { clave: 'codigo_lsm', titulo: 'Código LSM' },
  { clave: 'nombre', titulo: 'Nombre' },
  { clave: 'empresa', titulo: 'Empresa' },
  { clave: 'estacion', titulo: 'Estación' },
  { clave: 'tipo', titulo: 'Tipo' },
  { clave: 'categoria', titulo: 'Categoría' },
  { clave: 'complejidad', titulo: 'Complejidad' },
  { clave: 'usuario_navegacion', titulo: 'Usuario de navegación' },
  { clave: 'caracteristica', titulo: 'Característica' },
  { clave: 'color_luz', titulo: 'Color de luz' },
  { clave: 'color', titulo: 'Color' },
  { clave: 'modelo', titulo: 'Modelo' },
  { clave: 'forma', titulo: 'Forma' },
  { clave: 'material', titulo: 'Material' },
  { clave: 'altura', titulo: 'Altura' },
  { clave: 'elevacion', titulo: 'Elevación' },
  { clave: 'profundidad', titulo: 'Profundidad' },
  { clave: 'luminica', titulo: 'Lumínica' },
  { clave: 'baja', titulo: 'Baja' },
];

const filaDetalle = (senal: SenalEstadistica): Record<string, CeldaExport> => ({
  codigo_lsm: senal.codigo_lsm,
  nombre: senal.nombre,
  empresa: senal.empresa,
  estacion: senal.estacion,
  tipo: senal.tipo,
  categoria: senal.categoria,
  complejidad: senal.complejidad,
  usuario_navegacion: senal.usuario_navegacion,
  caracteristica: senal.caracteristica,
  color_luz: senal.color_luz,
  color: senal.color,
  modelo: senal.modelo,
  forma: senal.forma,
  material: senal.material,
  altura: senal.altura,
  elevacion: senal.elevacion,
  profundidad: senal.profundidad,
  luminica: senal.luminica,
  baja: senal.baja,
});

const formatearCelda = (valor: CeldaExport): string => {
  if (valor === null || valor === undefined || valor === '') return '—';
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  return String(valor);
};

function construirGrupos(senales: SenalEstadistica[], agrupacion: Agrupacion): Grupo[] {
  const mapa = new Map<string, Grupo>();
  for (const senal of senales) {
    const estacionId = agrupacion === 'empresa_estacion' ? senal.id_estacion : null;
    const clave = `${senal.id_empresa ?? ''}|${estacionId ?? ''}`;
    let grupo = mapa.get(clave);
    if (!grupo) {
      grupo = {
        clave,
        empresaId: senal.id_empresa,
        empresa: senal.empresa ?? SIN_EMPRESA,
        estacionId,
        estacion: agrupacion === 'empresa_estacion' ? (senal.estacion ?? SIN_ESTACION) : '',
        senales: [],
      };
      mapa.set(clave, grupo);
    }
    grupo.senales.push(senal);
  }

  return [...mapa.values()]
    .sort((a, b) => a.empresa.localeCompare(b.empresa, 'es') || a.estacion.localeCompare(b.estacion, 'es'))
    .map((grupo) => ({
      ...grupo,
      senales: [...grupo.senales].sort((a, b) => a.codigo_lsm.localeCompare(b.codigo_lsm, 'es', { numeric: true })),
    }));
}

function TarjetaTotal({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{etiqueta}</p>
        <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{valor}</p>
      </CardContent>
    </Card>
  );
}

export default function EstadisticasPage() {
  const [datos, setDatos] = useState<SenalEstadistica[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS);
  const [dimCampo, setDimCampo] = useState<CampoDimension | ''>('');
  const [dimValor, setDimValor] = useState('');
  const [agrupacion, setAgrupacion] = useState<Agrupacion>('empresa');
  const [vista, setVista] = useState<Vista>('detalle');
  const [incluirBajas, setIncluirBajas] = useState(false);

  useEffect(() => {
    let ignorar = false;
    void estadisticasService.listar().then((respuesta) => {
      if (ignorar) return;
      if (respuesta.success && respuesta.data) setDatos(respuesta.data);
      else setError(respuesta.message || 'No se pudieron cargar las estadísticas');
    });
    return () => {
      ignorar = true;
    };
  }, []);

  const todas = useMemo(() => datos ?? [], [datos]);

  // Las opciones salen de todas las señales cargadas, para que no desaparezcan al filtrar.
  const opciones = useMemo(() => {
    const resultado = {} as Record<CriterioClave, OpcionCriterio[]>;
    for (const criterio of CRITERIOS) {
      const mapa = new Map<string, string>();
      for (const senal of todas) {
        const id = senal[criterio.campoId];
        if (id) mapa.set(id, senal[criterio.campoNombre] ?? id);
      }
      resultado[criterio.clave] = [...mapa]
        .map(([id, nombre]) => ({ id, nombre }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    }
    return resultado;
  }, [todas]);

  const dimension = dimCampo !== '' && dimValor.trim() !== '' ? { campo: dimCampo, valor: dimValor.trim() } : null;
  const criteriosActivos = CRITERIOS.filter((c) => filtros[c.clave] !== '').length + (dimension ? 1 : 0);

  const filtradas = todas.filter((senal) => {
    if (!incluirBajas && senal.baja) return false;
    if (CRITERIOS.some((c) => filtros[c.clave] !== '' && senal[c.campoId] !== filtros[c.clave])) return false;
    if (dimension && senal[dimension.campo] !== Number(dimension.valor)) return false;
    return true;
  });

  const totalSenales = filtradas.length;
  const totalLuminicas = filtradas.filter((senal) => senal.luminica).length;
  const grupos = construirGrupos(filtradas, agrupacion);

  const actualizarCriterio = (clave: CriterioClave, valor: string) => {
    setFiltros((anterior) => ({ ...anterior, [clave]: valor }));
  };

  const limpiarCriterios = () => {
    setFiltros(FILTROS_VACIOS);
    setDimCampo('');
    setDimValor('');
  };

  // Cada cantidad enlaza a /gestion-senales con el grupo y los criterios activos.
  const enlaceGrupo = (grupo: Grupo): string => {
    const params = new URLSearchParams();
    if (grupo.empresaId) params.set('empresa', grupo.empresaId);
    if (grupo.estacionId) params.set('estacion', grupo.estacionId);
    for (const criterio of CRITERIOS) {
      if (filtros[criterio.clave] !== '') params.set(criterio.clave, filtros[criterio.clave]);
    }
    if (dimension) params.set(dimension.campo, dimension.valor);
    if (incluirBajas) params.set('bajas', '1');
    return `/gestion-senales?${params.toString()}`;
  };

  const etiquetaGrupo = (grupo: Grupo): string => (agrupacion === 'empresa_estacion' ? `${grupo.empresa} · ${grupo.estacion}` : grupo.empresa);

  const tituloExportacion = `Estadísticas de señales · ${agrupacion === 'empresa' ? 'Por empresa' : 'Por empresa y estación'} · ${vista === 'detalle' ? 'Detalle' : 'Resumen'}`;
  const nombreArchivo = `estadisticas-${vista}-${agrupacion}-${format(new Date(), 'yyyy-MM-dd')}`;

  const columnasResumen: ColumnaExport[] = [
    { clave: 'empresa', titulo: 'Empresa' },
    ...(agrupacion === 'empresa_estacion' ? [{ clave: 'estacion', titulo: 'Estación' }] : []),
    { clave: 'cantidad', titulo: 'Señales' },
  ];
  const exportacion =
    vista === 'detalle'
      ? {
          columnas: COLUMNAS_DETALLE,
          filas: grupos.flatMap((grupo) => grupo.senales.map(filaDetalle)),
        }
      : {
          columnas: columnasResumen,
          filas: grupos.map((grupo) => ({ empresa: grupo.empresa, estacion: grupo.estacion, cantidad: grupo.senales.length })),
        };

  return (
    <div className="space-y-6 p-6">
      <PageMeta title="Estadísticas" description="Recuento de señales por empresa, estación y atributos" />

      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Estadísticas</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Recuento de señales activas por empresa y atributos.</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!datos && !error && <p className="text-sm text-gray-600 dark:text-gray-400">Cargando estadísticas...</p>}

      {datos && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <TarjetaTotal etiqueta="Total de señales" valor={totalSenales} />
            <TarjetaTotal etiqueta="Lumínicas" valor={totalLuminicas} />
            <TarjetaTotal etiqueta="Ciegas" valor={totalSenales - totalLuminicas} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Criterios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FilterBar onReset={limpiarCriterios} activeCount={criteriosActivos}>
                {CRITERIOS.map((criterio) => (
                  <FilterField key={criterio.clave} label={criterio.etiqueta}>
                    <Select
                      value={filtros[criterio.clave] || TODOS}
                      onValueChange={(valor) => actualizarCriterio(criterio.clave, valor === TODOS ? '' : valor)}
                    >
                      <SelectTrigger className="w-52">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TODOS}>Todos</SelectItem>
                        {opciones[criterio.clave].map((opcion) => (
                          <SelectItem key={opcion.id} value={opcion.id}>
                            {opcion.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FilterField>
                ))}
                <FilterField label="Dimensión">
                  <div className="flex items-center gap-2">
                    <Select value={dimCampo || TODOS} onValueChange={(valor) => setDimCampo(valor === TODOS ? '' : (valor as CampoDimension))}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TODOS}>Ninguna</SelectItem>
                        {DIMENSIONES.map((dimensionOpcion) => (
                          <SelectItem key={dimensionOpcion.campo} value={dimensionOpcion.campo}>
                            {dimensionOpcion.etiqueta}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step="any"
                      placeholder="Valor exacto"
                      className="w-32"
                      disabled={dimCampo === ''}
                      value={dimValor}
                      onChange={(evento) => setDimValor(evento.target.value)}
                    />
                  </div>
                </FilterField>
              </FilterBar>

              <div className="flex flex-wrap items-end gap-4">
                <FilterField label="Agrupar por">
                  <Select value={agrupacion} onValueChange={(valor) => setAgrupacion(valor as Agrupacion)}>
                    <SelectTrigger className="w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="empresa">Empresa</SelectItem>
                      <SelectItem value="empresa_estacion">Empresa y estación</SelectItem>
                    </SelectContent>
                  </Select>
                </FilterField>
                <FilterField label="Mostrar">
                  <Select value={vista} onValueChange={(valor) => setVista(valor as Vista)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="detalle">Detalle</SelectItem>
                      <SelectItem value="resumen">Resumen</SelectItem>
                    </SelectContent>
                  </Select>
                </FilterField>
                <div className="flex items-center gap-2 pb-2">
                  <Checkbox
                    id="estadisticas-incluir-bajas"
                    checked={incluirBajas}
                    onCheckedChange={(valor) => setIncluirBajas(valor === true)}
                  />
                  <Label htmlFor="estadisticas-incluir-bajas">Incluir bajas</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <ExportarTabla
            titulo={tituloExportacion}
            columnas={exportacion.columnas}
            filas={exportacion.filas}
            nombreArchivo={nombreArchivo}
          />

          {totalSenales === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-gray-600 dark:text-gray-400">No hay señales con estos criterios.</CardContent>
            </Card>
          ) : vista === 'resumen' ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      {agrupacion === 'empresa_estacion' && <TableHead>Estación</TableHead>}
                      <TableHead className="text-right">Señales</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grupos.map((grupo) => (
                      <TableRow key={grupo.clave}>
                        <TableCell>{grupo.empresa}</TableCell>
                        {agrupacion === 'empresa_estacion' && <TableCell>{grupo.estacion}</TableCell>}
                        <TableCell className="text-right">
                          <Link to={enlaceGrupo(grupo)} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                            {grupo.senales.length}
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            grupos.map((grupo) => (
              <Card key={grupo.clave}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {etiquetaGrupo(grupo)}:{' '}
                    <Link to={enlaceGrupo(grupo)} className="text-blue-600 hover:underline dark:text-blue-400">
                      {grupo.senales.length} {grupo.senales.length === 1 ? 'señal' : 'señales'}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {COLUMNAS_DETALLE.map((columna) => (
                            <TableHead key={columna.clave}>{columna.titulo}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {grupo.senales.map((senal) => {
                          const fila = filaDetalle(senal);
                          return (
                            <TableRow key={senal.id_senal}>
                              {COLUMNAS_DETALLE.map((columna) => (
                                <TableCell key={columna.clave}>{formatearCelda(fila[columna.clave])}</TableCell>
                              ))}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </>
      )}
    </div>
  );
}
