import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { fallasService, type FallaData } from '@/services/api/fallasApi';
import { senalesService } from '@/services/api/senalesApi';
import { CommandSelect } from '@/components/ui/CommandSelect';
import { DatePickerField } from '@/components/common/DatePickerField';
import { CAMPO_PENDIENTE, cn, esVacio, etiquetaSenal } from '@/lib/utils';
import {
  aIntervaloPostgres,
  aValorDatetimeLocal,
  diferenciaMs,
  formatearDuracion,
} from '@/lib/intervalos';
import { aTimestampLocal } from '@/lib/planMantenimiento';

// Componentes shadcn
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  AlertTriangle,
  Save,
  X,
  ArrowLeft,
  Loader2
} from 'lucide-react';

// Interfaces para tipos de datos
interface TipoFalla {
  id: string;
  nombre: string;
}

interface OrigenFalla {
  id: string;
  nombre: string;
}

interface Catalogo {
  nombre: string;
}

interface SenalResumen {
  id_senal: string;
  codigo_lsm: string;
  nombre: string;
  luminica: boolean | null;
  fecha_retirada: string | null;
  empresa: Catalogo | null;
  zona: Catalogo | null;
  estacion: Catalogo | null;
  tipo: Catalogo | null;
  modelo: Catalogo | null;
  categoria: Catalogo | null;
}

interface FormData {
  id_senal: string;
  fecha_falla: string;
  fecha_restablecer: string;
  fecha_pronost_restablecer: string;
  id_tipo_falla: string;
  causa_de_falla: string;
  medidas: string;
  reporto: string;
  rescatada: boolean;
  observaciones: string;
  id_origen_falla: string;
  transmite: string;
  anar: string;
  rg: string;
}

const formularioVacio = (idSenal = ''): FormData => ({
  id_senal: idSenal,
  fecha_falla: '',
  fecha_restablecer: '',
  fecha_pronost_restablecer: '',
  id_tipo_falla: '',
  causa_de_falla: '',
  medidas: '',
  reporto: '',
  rescatada: false,
  observaciones: '',
  id_origen_falla: '',
  transmite: '',
  anar: '',
  rg: ''
});

const CLASE_AVISO = 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30';

const aNulo = (valor: string): string | null => (esVacio(valor) ? null : valor);

// Las columnas son timestamp sin zona: se guarda la hora local tal cual.
const aIsoNulo = (valor: string): string | null =>
  esVacio(valor) ? null : aTimestampLocal(valor);

const nombreCatalogo = (catalogo: Catalogo | null): string => catalogo?.nombre ?? '—';

function ResumenSenal({ senal }: { senal: SenalResumen }) {
  const campos: [string, string][] = [
    ['LSM', senal.codigo_lsm],
    ['Nombre', senal.nombre],
    ['Empresa', nombreCatalogo(senal.empresa)],
    ['Zona', nombreCatalogo(senal.zona)],
    ['Estación', nombreCatalogo(senal.estacion)],
    ['Tipo', nombreCatalogo(senal.tipo)],
    ['Modelo', nombreCatalogo(senal.modelo)],
    ['Categoría', nombreCatalogo(senal.categoria)],
    ['Lumínica/Ciega', senal.luminica === null ? '—' : senal.luminica ? 'Lumínica' : 'Ciega'],
  ];

  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-3 dark:border-gray-700 dark:bg-gray-800">
      {campos.map(([etiqueta, valor]) => (
        <div key={etiqueta}>
          <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">{etiqueta}</dt>
          <dd className="break-words text-sm text-gray-800 dark:text-gray-200">{valor || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

const FormFallas: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditing);
  const [tiposFalla, setTiposFalla] = useState<TipoFalla[]>([]);
  const [origenesFalla, setOrigenesFalla] = useState<OrigenFalla[]>([]);
  const [senales, setSenales] = useState<{ id: string; nombre: string }[]>([]);
  const [activeTab, setActiveTab] = useState('basicos');

  const [formData, setFormData] = useState<FormData>(
    () => formularioVacio(searchParams.get('senal') ?? '')
  );
  const [senalInfo, setSenalInfo] = useState<{ idSenal: string; datos: SenalResumen | null } | null>(null);
  const [abiertasInfo, setAbiertasInfo] = useState<{ idSenal: string; cantidad: number } | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar catálogos
  useEffect(() => {
    const loadCatalogos = async () => {
      setLoading(true);
      try {
        const [tiposRes, origenesRes, senalesRes] = await Promise.all([
          fallasService.getTiposFalla(),
          fallasService.getOrigenesFalla(),
          senalesService.getSenales() as Promise<{
            success: boolean;
            data: { id_senal: string; codigo_lsm: string; nombre: string }[];
          }>,
        ]);

        if (tiposRes.success) {
          const items = tiposRes.data as { id_tipo_falla: string; nombre: string }[];
          setTiposFalla(items.map((item) => ({
            id: item.id_tipo_falla,
            nombre: item.nombre,
          })));
        }

        if (origenesRes.success) {
          const items = origenesRes.data as { id_origen_falla: string; nombre: string }[];
          setOrigenesFalla(items.map((item) => ({
            id: item.id_origen_falla,
            nombre: item.nombre,
          })));
        }

        if (senalesRes.success) {
          setSenales(
            ((senalesRes.data) ?? []).map((item) => ({
              id: item.id_senal,
              nombre: etiquetaSenal(item.codigo_lsm, item.nombre),
            }))
          );
        }
      } catch (error) {
        console.error('Error cargando catálogos:', error);
        alert('Error al cargar los catálogos');
      } finally {
        setLoading(false);
      }
    };

    void loadCatalogos();
  }, []);

  // Cargar datos de la falla si estamos editando
  useEffect(() => {
    const loadFalla = async () => {
      if (!id) return;

      setLoadingData(true);
      try {
        const response = await fallasService.getById(id);

        if (response.success && response.data) {
          const items = response.data as { id_falla: string; [key: string]: unknown }[];
          const data = items[0];
          if (!data) {
            alert('Error al cargar los datos de la falla');
            void navigate('/gestion-fallas');
            return;
          }

          setFormData({
            id_senal: (data.id_senal as string | null) ?? '',
            fecha_falla: aValorDatetimeLocal(data.fecha_falla as string | null),
            fecha_restablecer: aValorDatetimeLocal(data.fecha_restablecer as string | null),
            fecha_pronost_restablecer: aValorDatetimeLocal(data.fecha_pronost_restablecer as string | null),
            id_tipo_falla: (data.id_tipo_falla as string | null) ?? '',
            causa_de_falla: (data.causa_de_falla as string | null) ?? '',
            medidas: (data.medidas as string | null) ?? '',
            reporto: (data.reporto as string | null) ?? '',
            rescatada: (data.rescatada as boolean | null) ?? false,
            observaciones: (data.observaciones as string | null) ?? '',
            id_origen_falla: (data.id_origen_falla as string | null) ?? '',
            transmite: (data.transmite as string | null) ?? '',
            anar: (data.anar as string | null) ?? '',
            rg: (data.rg as string | null) ?? ''
          });
        } else {
          alert('Error al cargar los datos de la falla');
          void navigate('/gestion-fallas');
        }
      } catch (error) {
        console.error('Error cargando falla:', error);
        alert('Error al conectar con el servidor');
        void navigate('/gestion-fallas');
      } finally {
        setLoadingData(false);
      }
    };

    if (isEditing) {
      void loadFalla();
    }
  }, [id, isEditing, navigate]);

  // Datos de la señal elegida: ficha, fallas abiertas y, si aplica, fecha de retiro
  useEffect(() => {
    const idSenal = formData.id_senal;
    if (!idSenal) return;

    let vigente = true;
    void Promise.all([
      fallasService.getSenalResumen(idSenal),
      fallasService.getAbiertasPorSenal(idSenal, id),
    ]).then(([senalRes, abiertasRes]) => {
      if (!vigente) return;
      const datos = (senalRes.data as SenalResumen[] | null)?.[0] ?? null;
      setSenalInfo({ idSenal, datos: senalRes.success ? datos : null });
      const cantidad = abiertasRes.success ? ((abiertasRes.data as unknown[] | null) ?? []).length : 0;
      setAbiertasInfo({ idSenal, cantidad });
    });

    return () => {
      vigente = false;
    };
  }, [formData.id_senal, id]);

  const senalActual = senalInfo?.idSenal === formData.id_senal ? senalInfo.datos : null;
  const abiertasActual = abiertasInfo?.idSenal === formData.id_senal ? abiertasInfo.cantidad : 0;
  const retiradaActual = senalActual?.fecha_retirada ?? null;
  const fallaPosteriorARetiro =
    !!formData.fecha_falla && !!retiradaActual && new Date(formData.fecha_falla) > new Date(retiradaActual);

  const duracionMs = diferenciaMs(formData.fecha_falla, formData.fecha_restablecer);
  const diferenciaTiempoMs = diferenciaMs(formData.fecha_pronost_restablecer, formData.fecha_restablecer);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleGoBack = () => {
    void navigate('/gestion-fallas');
  };

  const validarFormulario = (): Record<string, string> => {
    const nuevosErrores: Record<string, string> = {};

    if (!formData.id_senal) nuevosErrores.id_senal = 'La señal es requerida';
    if (duracionMs !== null && duracionMs < 0) {
      nuevosErrores.fecha_restablecer = 'La fecha de restablecimiento no puede ser anterior a la fecha de falla';
    }

    return nuevosErrores;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nuevosErrores = validarFormulario();
    if (Object.keys(nuevosErrores).length > 0) {
      setErrors(nuevosErrores);
      setActiveTab(nuevosErrores.id_senal ? 'basicos' : 'detalles');
      alert(Object.values(nuevosErrores)[0]);
      return;
    }

    setIsSubmitting(true);

    try {
      const dataToSend: FallaData = {
        id_senal: formData.id_senal,
        fecha_falla: aIsoNulo(formData.fecha_falla),
        fecha_restablecer: aIsoNulo(formData.fecha_restablecer),
        fecha_pronost_restablecer: aIsoNulo(formData.fecha_pronost_restablecer),
        id_tipo_falla: aNulo(formData.id_tipo_falla),
        causa_de_falla: aNulo(formData.causa_de_falla),
        medidas: aNulo(formData.medidas),
        reporto: aNulo(formData.reporto),
        rescatada: formData.rescatada,
        observaciones: aNulo(formData.observaciones),
        duracion_de_falla: duracionMs === null ? null : aIntervaloPostgres(duracionMs),
        diferencia_tiempo: diferenciaTiempoMs === null ? null : aIntervaloPostgres(diferenciaTiempoMs),
        id_origen_falla: aNulo(formData.id_origen_falla),
        transmite: aNulo(formData.transmite),
        anar: aNulo(formData.anar),
        rg: aNulo(formData.rg)
      };

      const response = id
        ? await fallasService.update(id, dataToSend)
        : await fallasService.create(dataToSend);

      if (response.success) {
        alert(`✅ Falla ${isEditing ? 'actualizada' : 'registrada'} correctamente`);
        void navigate('/gestion-fallas');
      } else {
        alert('❌ Error al guardar: ' + (response.message ?? 'Error desconocido'));
      }
    } catch (error: unknown) {
      console.error('🔴 Error:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido';
      alert('❌ Error al conectar con el servidor: ' + message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (isEditing) {
      window.location.reload();
    } else {
      setFormData(formularioVacio());
      setErrors({});
      void navigate('/gestion-fallas');
    }
  };

  // Campos vacios en naranja; un error de validacion tiene prioridad.
  const claseCampo = (campo: keyof FormData): string =>
    cn(
      'border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
      esVacio(formData[campo]) && CAMPO_PENDIENTE,
      errors[campo] && 'border-red-500 focus-visible:ring-red-500'
    );

  if (loading ?? loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-icon mx-auto mb-4" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            {loadingData ? 'Cargando datos de la falla...' : 'Cargando catálogos...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-6">
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        <Card className="shadow-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <CardHeader className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <CardTitle className="text-2xl flex items-center text-gray-800 dark:text-white">
              <AlertCircle className="w-8 h-8 mr-3 text-icon-strong" />
              {isEditing ? 'Editar Falla' : 'Nueva Falla'}
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              {isEditing
                ? 'Modifique los datos de la falla seleccionada'
                : 'Complete la información detallada de la falla'}
            </CardDescription>
          </CardHeader>

          <form onSubmit={(e) => { void handleSubmit(e); }}>
            <CardContent className="p-6 lg:p-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-700">
                  <TabsTrigger
                    value="basicos"
                    className="data-[state=active]:bg-gray-800 data-[state=active]:text-white dark:data-[state=active]:bg-gray-600 dark:text-gray-300"
                  >
                    Datos Básicos
                  </TabsTrigger>
                  <TabsTrigger
                    value="detalles"
                    className="data-[state=active]:bg-gray-800 data-[state=active]:text-white dark:data-[state=active]:bg-gray-600 dark:text-gray-300"
                  >
                    Detalles
                  </TabsTrigger>
                  <TabsTrigger
                    value="responsables"
                    className="data-[state=active]:bg-gray-800 data-[state=active]:text-white dark:data-[state=active]:bg-gray-600 dark:text-gray-300"
                  >
                    Responsables
                  </TabsTrigger>
                  <TabsTrigger
                    value="tiempos"
                    className="data-[state=active]:bg-gray-800 data-[state=active]:text-white dark:data-[state=active]:bg-gray-600 dark:text-gray-300"
                  >
                    Tiempos
                  </TabsTrigger>
                </TabsList>

                {/* Pestaña Datos Básicos */}
                <TabsContent value="basicos" className="space-y-6 mt-4">
                  <div className="space-y-2 md:max-w-xl">
                    <CommandSelect
                      value={formData.id_senal}
                      onValueChange={(value) => handleSelectChange('id_senal', value)}
                      placeholder="Seleccionar señal"
                      searchPlaceholder="Buscar por código o nombre..."
                      emptyMessage="No se encontraron señales"
                      items={senales}
                      label="Señal"
                      required
                      pendiente={esVacio(formData.id_senal)}
                    />
                    {errors.id_senal && (
                      <p className="text-sm text-red-600 dark:text-red-400 flex items-center mt-1">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.id_senal}
                      </p>
                    )}
                  </div>

                  {senalActual && <ResumenSenal senal={senalActual} />}

                  {abiertasActual > 0 && (
                    <Alert className={CLASE_AVISO}>
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <AlertDescription className="flex flex-wrap items-center gap-x-2 text-amber-800 dark:text-amber-200">
                        <span>
                          Esta señal ya tiene {abiertasActual}{' '}
                          {abiertasActual === 1 ? 'falla abierta' : 'fallas abiertas'}.
                        </span>
                        <Link
                          to={`/gestion-fallas?senal=${formData.id_senal}`}
                          className="underline hover:no-underline"
                        >
                          Ver fallas de la señal
                        </Link>
                      </AlertDescription>
                    </Alert>
                  )}

                  {fallaPosteriorARetiro && retiradaActual && (
                    <Alert className={CLASE_AVISO}>
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <AlertDescription className="text-amber-800 dark:text-amber-200">
                        La señal fue retirada el{' '}
                        {format(new Date(retiradaActual), 'dd/MM/yyyy', { locale: es })}; la falla es posterior.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Fecha de Falla */}
                    <div className="space-y-2">
                      <Label htmlFor="fecha_falla" className="flex items-center text-gray-700 dark:text-gray-300 font-medium">
                        Fecha de Falla
                      </Label>
                      <DatePickerField
                        id="fecha_falla"
                        withTime
                        value={formData.fecha_falla}
                        onChange={(valor) => handleSelectChange('fecha_falla', valor)}
                        className="w-full"
                        inputClassName={claseCampo('fecha_falla')}
                      />
                    </div>

                    {/* Tipo de Falla */}
                    <div className="space-y-2">
                      <CommandSelect
                        value={formData.id_tipo_falla}
                        onValueChange={(value) => handleSelectChange('id_tipo_falla', value)}
                        placeholder="Seleccionar tipo de falla"
                        searchPlaceholder="Buscar tipo..."
                        emptyMessage="No se encontraron tipos de falla"
                        items={tiposFalla}
                        label="Tipo de Falla"
                        pendiente={esVacio(formData.id_tipo_falla)}
                      />
                    </div>
                  </div>

                  {/* Causa de Falla */}
                  <div className="space-y-2">
                    <Label htmlFor="causa_de_falla" className="flex items-center text-gray-700 dark:text-gray-300 font-medium">
                      Causa de Falla
                    </Label>
                    <Textarea
                      id="causa_de_falla"
                      name="causa_de_falla"
                      value={formData.causa_de_falla}
                      onChange={handleInputChange}
                      placeholder="Describa la causa de la falla..."
                      className={claseCampo('causa_de_falla')}
                      rows={4}
                    />
                  </div>
                </TabsContent>

                {/* Pestaña Detalles */}
                <TabsContent value="detalles" className="space-y-6 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Fecha Restablecimiento */}
                    <div className="space-y-2">
                      <Label htmlFor="fecha_restablecer" className="text-gray-700 dark:text-gray-300 font-medium">
                        Fecha de Restablecimiento
                      </Label>
                      <DatePickerField
                        id="fecha_restablecer"
                        withTime
                        value={formData.fecha_restablecer}
                        onChange={(valor) => handleSelectChange('fecha_restablecer', valor)}
                        className="w-full"
                        inputClassName={claseCampo('fecha_restablecer')}
                      />
                      {errors.fecha_restablecer && (
                        <p className="text-sm text-red-600 dark:text-red-400 flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.fecha_restablecer}
                        </p>
                      )}
                    </div>

                    {/* Fecha Pronóstico */}
                    <div className="space-y-2">
                      <Label htmlFor="fecha_pronost_restablecer" className="text-gray-700 dark:text-gray-300 font-medium">
                        Fecha Pronóstico Restablecimiento
                      </Label>
                      <DatePickerField
                        id="fecha_pronost_restablecer"
                        withTime
                        value={formData.fecha_pronost_restablecer}
                        onChange={(valor) => handleSelectChange('fecha_pronost_restablecer', valor)}
                        className="w-full"
                        inputClassName={claseCampo('fecha_pronost_restablecer')}
                      />
                    </div>

                    {/* Origen de Falla */}
                    <div className="space-y-2">
                      <CommandSelect
                        value={formData.id_origen_falla}
                        onValueChange={(value) => handleSelectChange('id_origen_falla', value)}
                        placeholder="Seleccionar origen de falla"
                        searchPlaceholder="Buscar origen..."
                        emptyMessage="No se encontraron orígenes de falla"
                        items={origenesFalla}
                        label="Origen de Falla"
                        pendiente={esVacio(formData.id_origen_falla)}
                      />
                    </div>

                    {/* Checkbox Rescatada */}
                    <div className="flex items-center h-full pt-6">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="rescatada"
                          checked={formData.rescatada}
                          onCheckedChange={(checked) => handleCheckboxChange('rescatada', checked as boolean)}
                          className="border-gray-400 text-gray-800 dark:border-gray-500 dark:bg-gray-700"
                        />
                        <Label htmlFor="rescatada" className="cursor-pointer text-gray-700 dark:text-gray-300 font-medium">
                          Falla Rescatada
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Medidas */}
                  <div className="space-y-2">
                    <Label htmlFor="medidas" className="text-gray-700 dark:text-gray-300 font-medium">
                      Medidas Tomadas
                    </Label>
                    <Textarea
                      id="medidas"
                      name="medidas"
                      value={formData.medidas}
                      onChange={handleInputChange}
                      placeholder="Describa las medidas tomadas..."
                      className={claseCampo('medidas')}
                      rows={3}
                    />
                  </div>

                  {/* Observaciones */}
                  <div className="space-y-2">
                    <Label htmlFor="observaciones" className="text-gray-700 dark:text-gray-300 font-medium">
                      Observaciones
                    </Label>
                    <Textarea
                      id="observaciones"
                      name="observaciones"
                      value={formData.observaciones}
                      onChange={handleInputChange}
                      placeholder="Observaciones adicionales..."
                      className={claseCampo('observaciones')}
                      rows={3}
                    />
                  </div>
                </TabsContent>

                {/* Pestaña Responsables */}
                <TabsContent value="responsables" className="space-y-6 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="reporto" className="text-gray-700 dark:text-gray-300 font-medium">Reportó</Label>
                      <Input
                        id="reporto"
                        name="reporto"
                        value={formData.reporto}
                        onChange={handleInputChange}
                        placeholder="Nombre de quien reporta"
                        className={claseCampo('reporto')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="transmite" className="text-gray-700 dark:text-gray-300 font-medium">Transmite</Label>
                      <Input
                        id="transmite"
                        name="transmite"
                        value={formData.transmite}
                        onChange={handleInputChange}
                        placeholder="Quién transmite"
                        className={claseCampo('transmite')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="anar" className="text-gray-700 dark:text-gray-300 font-medium">ANAR</Label>
                      <Input
                        id="anar"
                        name="anar"
                        value={formData.anar}
                        onChange={handleInputChange}
                        placeholder="ANAR"
                        className={claseCampo('anar')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rg" className="text-gray-700 dark:text-gray-300 font-medium">RG</Label>
                      <Input
                        id="rg"
                        name="rg"
                        value={formData.rg}
                        onChange={handleInputChange}
                        placeholder="RG"
                        className={claseCampo('rg')}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Pestaña Tiempos */}
                <TabsContent value="tiempos" className="space-y-6 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="duracion_de_falla" className="text-gray-700 dark:text-gray-300 font-medium">
                        Duración de Falla
                      </Label>
                      <Input
                        id="duracion_de_falla"
                        readOnly
                        value={formatearDuracion(duracionMs)}
                        placeholder="Requiere fecha de falla y de restablecimiento"
                        className={cn(
                          'w-full border-gray-300 bg-gray-100 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200',
                          esVacio(duracionMs) && CAMPO_PENDIENTE
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="diferencia_tiempo" className="text-gray-700 dark:text-gray-300 font-medium">
                        Diferencia de Tiempo
                      </Label>
                      <Input
                        id="diferencia_tiempo"
                        readOnly
                        value={formatearDuracion(diferenciaTiempoMs)}
                        placeholder="Requiere fecha pronóstico y de restablecimiento"
                        className={cn(
                          'w-full border-gray-300 bg-gray-100 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200',
                          esVacio(diferenciaTiempoMs) && CAMPO_PENDIENTE
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isSubmitting}
                className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4 mr-2" />
                {isEditing ? 'Restaurar' : 'Cancelar'}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-gray-800 hover:bg-gray-900 text-white dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? 'Actualizar Falla' : 'Guardar Falla'}
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default FormFallas;
