import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { mantenimientosService, type MantenimientoResponse } from '@/services/api/mantenApi';
import { senalesService } from '@/services/api/senalesApi';
import { fallasService } from '@/services/api/fallasApi';
import { planMantService, type PlanMantenimiento } from '@/services/api/planMantApi';
import { flotaService } from '@/services/api/flotaApi';
import { CommandSelect } from '@/components/ui/CommandSelect';
import { CAMPO_PENDIENTE, cn, esVacio, etiquetaSenal } from '@/lib/utils';
import { aIntervaloPostgres, aValorDatetimeLocal, diferenciaMs, formatearDuracion } from '@/lib/intervalos';
import { aTextoLocal, aTimestampLocal, fechaHoraLegible } from '@/lib/planMantenimiento';

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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  Save,
  X,
  ArrowLeft,
  Wrench,
  Loader2
} from 'lucide-react';
import { type AxiosError } from 'axios';

// Interfaces
interface CatalogoItem {
  id: string;
  nombre: string;
}

interface FormMantenimientosData {
  id_senal: string;
  id_tipo_mant: string;
  ident_mantenimiento: string;
  fecha_inicio: string;
  fecha_finalizacion: string;
  aseguro: string;
  id_estado_senal: string;
  id_buque: string;
  vehiculo: string;
  trabajo_realizado: string;
  costo_mn: number;
  costo_mlc: number;
  diesel_lit: number;
  gasolina_lit: number;
  informa: string;
  transmite: string;
  rg: string;
  orden: string;
  introdujo: string;
}

const FORMULARIO_VACIO: FormMantenimientosData = {
  id_senal: '',
  id_tipo_mant: '',
  ident_mantenimiento: '',
  fecha_inicio: '',
  fecha_finalizacion: '',
  aseguro: '',
  id_estado_senal: '',
  id_buque: '',
  vehiculo: '',
  trabajo_realizado: '',
  costo_mn: 0,
  costo_mlc: 0,
  diesel_lit: 0,
  gasolina_lit: 0,
  informa: '',
  transmite: '',
  rg: '',
  orden: '',
  introdujo: ''
};

const CLASE_INPUT = 'border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400';

const texto = (valor: unknown): string => (typeof valor === 'string' ? valor : '');

const numero = (valor: unknown): number => Number(valor) || 0;

const fechaParaInput = (valor: unknown): string => aValorDatetimeLocal(typeof valor === 'string' ? valor : null);

interface FallaRegistro {
  id_senal?: string | null;
  fecha_falla?: string | null;
  id_tipo_falla?: string | null;
  causa_de_falla?: string | null;
}

interface FallaAsociada {
  fecha: string | null;
  tipo: string;
  causa: string | null;
}

const FormMantenimientos: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isEditing = !!id;
  const idPlan = isEditing ? null : searchParams.get('plan');
  const idFalla = isEditing ? null : searchParams.get('falla');

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditing);
  const [senales, setSenales] = useState<CatalogoItem[]>([]);
  const [fechasRetiro, setFechasRetiro] = useState<Record<string, string | null>>({});
  const [tiposMantenimiento, setTiposMantenimiento] = useState<CatalogoItem[]>([]);
  const [estadosSenal, setEstadosSenal] = useState<CatalogoItem[]>([]);
  const [buques, setBuques] = useState<CatalogoItem[]>([]);
  const [medio, setMedio] = useState<'buque' | 'vehiculo' | null>(null);
  const [fallaAsociada, setFallaAsociada] = useState<FallaAsociada | null>(null);
  const [plan, setPlan] = useState<PlanMantenimiento | null>(null);
  const [errorPlan, setErrorPlan] = useState<string | null>(null);

  // Precarga desde la URL: ?senal= y ?fin= (fecha de finalizacion)
  const [formData, setFormData] = useState<FormMantenimientosData>(() => ({
    ...FORMULARIO_VACIO,
    id_senal: searchParams.get('senal') ?? '',
    fecha_finalizacion: fechaParaInput(searchParams.get('fin')),
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState('general');

  // Cargar buques de la flota (medio utilizado)
  useEffect(() => {
    void flotaService.getBuquesCatalogo().then(setBuques).catch(() => undefined);
  }, []);

  // Cargar catálogos
  useEffect(() => {
    const loadCatalogos = async () => {
      setLoading(true);
      try {
        const [senalesRes, tiposRes, estadosRes] = await Promise.all([
          senalesService.getSenales() as Promise<{ success: boolean; data: { id_senal: string; codigo_lsm: string; nombre: string; fecha_retirada?: string | null }[] }>,
          mantenimientosService.getTiposMantenimiento() as Promise<{ success: boolean; data: { id_tipo_mant: string; nombre: string }[] }>,
          mantenimientosService.getEstadosSenal() as Promise<{ success: boolean; data: { id_estado_senal: string; nombre: string }[] }>,
        ]);

        if (senalesRes.success) {
          const lista = senalesRes.data ?? [];
          setSenales(lista.map((item) => ({ id: item.id_senal, nombre: etiquetaSenal(item.codigo_lsm, item.nombre) })));
          setFechasRetiro(Object.fromEntries(lista.map((item) => [item.id_senal, item.fecha_retirada ?? null])));
        }

        if (tiposRes.success) {
          setTiposMantenimiento(((tiposRes.data) ?? []).map((item) => ({ id: item.id_tipo_mant, nombre: item.nombre })));
        }

        if (estadosRes.success) {
          setEstadosSenal(((estadosRes.data) ?? []).map((item) => ({ id: item.id_estado_senal, nombre: item.nombre })));
        }

      } catch (error) {
        console.error('Error cargando catálogos:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadCatalogos();
  }, []);

  // Cargar datos del mantenimiento si estamos editando
  useEffect(() => {
    const loadMantenimiento = async () => {
      if (!id) return;

      setLoadingData(true);
      try {
        const response = await mantenimientosService.getById(id);

        if (response.success && response.data) {
          const items = response.data as Record<string, unknown>[];
          const data = items[0];
          if (!data) {
            alert('Error al cargar los datos del mantenimiento');
            void navigate('/gestion-mant');
            return;
          }

          // Medio utilizado excluyente: si hay datos viejos con buque y vehiculo, prevalece el buque.
          const idBuque = texto(data.id_buque);
          const vehiculo = texto(data.vehiculo);
          setMedio(idBuque ? 'buque' : vehiculo ? 'vehiculo' : null);

          setFormData({
            id_senal: texto(data.id_senal),
            id_tipo_mant: texto(data.id_tipo_mant),
            ident_mantenimiento: texto(data.ident_mantenimiento),
            fecha_inicio: fechaParaInput(data.fecha_inicio),
            fecha_finalizacion: fechaParaInput(data.fecha_finalizacion),
            aseguro: texto(data.aseguro),
            id_estado_senal: texto(data.id_estado_senal),
            id_buque: idBuque,
            vehiculo: idBuque ? '' : vehiculo,
            trabajo_realizado: texto(data.trabajo_realizado),
            costo_mn: numero(data.costo_mn),
            costo_mlc: numero(data.costo_mlc),
            diesel_lit: numero(data.diesel_lit),
            gasolina_lit: numero(data.gasolina_lit),
            informa: texto(data.informa),
            transmite: texto(data.transmite),
            rg: texto(data.rg),
            orden: texto(data.orden),
            introdujo: texto(data.introdujo)
          });
        } else {
          alert('Error al cargar los datos del mantenimiento');
          void navigate('/gestion-mant');
        }
      } catch (error) {
        console.error('Error cargando mantenimiento:', error);
        alert('Error al conectar con el servidor');
        void navigate('/gestion-mant');
      } finally {
        setLoadingData(false);
      }
    };

    if (isEditing) {
      void loadMantenimiento();
    }
  }, [id, isEditing, navigate]);

  // Cargar el plan que se va a cumplir
  useEffect(() => {
    if (!idPlan) return;

    const cargarPlan = async () => {
      const response = await planMantService.getById(idPlan);
      const data = response.success ? (response.data as PlanMantenimiento[] | null)?.[0] : undefined;
      if (!data) {
        setErrorPlan('No se encontró el plan de mantenimiento. Se registrará sin plan.');
        return;
      }
      setPlan(data);
      setFormData(prev => ({
        ...prev,
        id_senal: data.id_senal,
        id_tipo_mant: data.id_tipo_mant ?? '',
        trabajo_realizado: data.trabajo_medios ?? '',
      }));
    };

    void cargarPlan();
  }, [idPlan]);

  // Precargar la señal de la falla y mostrar sus datos (solo lectura, sin referencia guardada)
  useEffect(() => {
    if (!idFalla) return;

    const cargarFalla = async () => {
      const [fallaRes, tiposRes] = await Promise.all([fallasService.getById(idFalla), fallasService.getTiposFalla()]);
      const falla = fallaRes.success ? (fallaRes.data as FallaRegistro[] | null)?.[0] : undefined;
      if (!falla) return;

      const tipos = tiposRes.success ? (tiposRes.data as { id_tipo_falla: string; nombre: string }[] | null) ?? [] : [];
      setFallaAsociada({
        fecha: falla.fecha_falla ?? null,
        tipo: tipos.find(t => t.id_tipo_falla === falla.id_tipo_falla)?.nombre ?? '',
        causa: falla.causa_de_falla ?? null,
      });
      if (falla.id_senal) setFormData(prev => ({ ...prev, id_senal: falla.id_senal ?? '' }));
    };

    void cargarFalla();
  }, [idFalla]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? 0 : Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Al cambiar de medio se limpia el valor del otro.
  const elegirMedio = (nuevo: 'buque' | 'vehiculo') => {
    setMedio(nuevo);
    setFormData(prev => ({
      ...prev,
      id_buque: nuevo === 'buque' ? prev.id_buque : '',
      vehiculo: nuevo === 'vehiculo' ? prev.vehiculo : '',
    }));
  };

  const handleGoBack = () => {
    void navigate('/gestion-mant');
  };

  // Tiempo empleado calculado; null si falta una fecha o fin es anterior a inicio
  const duracionMs = diferenciaMs(formData.fecha_inicio, formData.fecha_finalizacion);
  const duracionValida = duracionMs !== null && duracionMs >= 0 ? duracionMs : null;

  // Aviso no bloqueante: el mantenimiento es posterior a la baja de la señal
  const fechaRetiro = formData.id_senal ? fechasRetiro[formData.id_senal] : null;
  const avisoRetiro = fechaRetiro && formData.fecha_inicio && new Date(formData.fecha_inicio) > new Date(fechaRetiro)
    ? `La señal fue retirada el ${new Date(fechaRetiro).toLocaleDateString('es')} y este mantenimiento es posterior a esa fecha.`
    : null;

  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!formData.id_senal) newErrors.id_senal = 'La señal es requerida';

    if (formData.fecha_inicio && formData.fecha_finalizacion) {
      if (new Date(formData.fecha_finalizacion) < new Date(formData.fecha_inicio)) {
        newErrors.fecha_finalizacion = 'La fecha de finalización no puede ser anterior a la fecha de inicio';
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);

      try {
        const dataToSend = {
          id_senal: formData.id_senal,
          id_tipo_mant: formData.id_tipo_mant || null,
          ident_mantenimiento: formData.ident_mantenimiento || null,
          fecha_inicio: aTimestampLocal(formData.fecha_inicio),
          fecha_finalizacion: aTimestampLocal(formData.fecha_finalizacion),
          tiempo_empleado: duracionValida === null ? null : aIntervaloPostgres(duracionValida),
          aseguro: formData.aseguro || null,
          id_estado_senal: formData.id_estado_senal || null,
          id_buque: medio === 'buque' ? formData.id_buque || null : null,
          vehiculo: medio === 'vehiculo' ? formData.vehiculo || null : null,
          trabajo_realizado: formData.trabajo_realizado || null,
          costo_mn: formData.costo_mn ?? 0,
          costo_mlc: formData.costo_mlc ?? 0,
          diesel_lit: formData.diesel_lit ?? 0,
          gasolina_lit: formData.gasolina_lit ?? 0,
          informa: formData.informa || null,
          transmite: formData.transmite || null,
          rg: formData.rg || null,
          orden: formData.orden || null,
          introdujo: formData.introdujo || null
        };

        let response: MantenimientoResponse;
        if (isEditing) {
          response = await mantenimientosService.update(id, dataToSend);
        } else {
          response = await mantenimientosService.create(dataToSend);
        }

        if (response.success) {
          let avisoPlanCumplido = '';

          // Marca el plan como cumplido solo si estaba pendiente
          if (!isEditing && plan && !plan.fecha_cumplida) {
            const idCreado = (response.data as { id_mantenimiento?: string }[] | null)?.[0]?.id_mantenimiento;
            const actualizado = idCreado
              ? await planMantService.update(plan.id_plan_mantenimiento, {
                  fecha_cumplida: aTimestampLocal(formData.fecha_finalizacion)
                    ?? aTimestampLocal(formData.fecha_inicio)
                    ?? aTextoLocal(new Date()),
                  id_mantenimiento: idCreado,
                })
              : null;
            if (!actualizado?.success) {
              avisoPlanCumplido = '\nNo se pudo marcar el plan como cumplido.';
            }
          }

          alert(`✅ Mantenimiento ${isEditing ? 'actualizado' : 'registrado'} con éxito${avisoPlanCumplido}`);
          void navigate('/gestion-mant');
        } else {
          alert('❌ Error al guardar: ' + (response.message ?? 'Error desconocido'));
        }
      } catch (error: unknown) {
        const axiosError = error as AxiosError<{ message?: string }>;
        console.error('Error detallado:', axiosError);
        alert('❌ Error al conectar con el servidor: ' + (axiosError.response?.data?.message ?? axiosError.message ?? 'Error desconocido'));
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setErrors(newErrors);
      alert(Object.values(newErrors)[0]);
    }
  };

  const handleReset = () => {
    if (isEditing) {
      window.location.reload();
    } else {
      setFormData({ ...FORMULARIO_VACIO });
      setMedio(null);
      setErrors({});
    }
  };

  // Campo vacio se marca en naranja; un error de validacion se marca en rojo
  const claseCampo = (valor: unknown, campo?: string): string =>
    cn(
      CLASE_INPUT,
      esVacio(valor) && CAMPO_PENDIENTE,
      campo && errors[campo] && 'border-red-500 focus-visible:ring-red-500'
    );

  if (loading ?? loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-900 dark:text-gray-100 mx-auto mb-4" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            {loadingData ? 'Cargando datos del mantenimiento...' : 'Cargando catálogos...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
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
              <Wrench className="w-8 h-8 mr-3 text-gray-600 dark:text-gray-300" />
              {isEditing ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento'}
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              {isEditing
                ? 'Modifique los datos del mantenimiento seleccionado'
                : 'Complete la información para registrar un nuevo mantenimiento'}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 lg:p-8">
              {(errorPlan !== null || !!plan?.fecha_cumplida || avisoRetiro !== null) && (
                <div className="mb-6 space-y-3">
                  {errorPlan && (
                    <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <AlertDescription className="text-amber-800 dark:text-amber-300">{errorPlan}</AlertDescription>
                    </Alert>
                  )}
                  {plan?.fecha_cumplida && (
                    <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <AlertDescription className="text-amber-800 dark:text-amber-300">
                        Este plan ya está cumplido. El mantenimiento se registrará sin modificar el plan.
                      </AlertDescription>
                    </Alert>
                  )}
                  {avisoRetiro && (
                    <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <AlertDescription className="text-amber-800 dark:text-amber-300">{avisoRetiro}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-700">
                  <TabsTrigger
                    value="general"
                    className="data-[state=active]:bg-gray-800 data-[state=active]:text-white dark:data-[state=active]:bg-gray-600 dark:text-gray-300"
                  >
                    Información General
                  </TabsTrigger>
                  <TabsTrigger
                    value="fechas"
                    className="data-[state=active]:bg-gray-800 data-[state=active]:text-white dark:data-[state=active]:bg-gray-600 dark:text-gray-300"
                  >
                    Fechas y Tiempos
                  </TabsTrigger>
                  <TabsTrigger
                    value="costos"
                    className="data-[state=active]:bg-gray-800 data-[state=active]:text-white dark:data-[state=active]:bg-gray-600 dark:text-gray-300"
                  >
                    Costos
                  </TabsTrigger>
                  <TabsTrigger
                    value="responsables"
                    className="data-[state=active]:bg-gray-800 data-[state=active]:text-white dark:data-[state=active]:bg-gray-600 dark:text-gray-300"
                  >
                    Responsables
                  </TabsTrigger>
                </TabsList>

                {/* Pestaña Información General */}
                <TabsContent value="general" className="space-y-6 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Señal */}
                    <div className="space-y-2">
                      <CommandSelect
                        value={formData.id_senal}
                        onValueChange={(value) => handleSelectChange('id_senal', value)}
                        placeholder="Seleccionar señal"
                        searchPlaceholder="Buscar señal..."
                        emptyMessage="No se encontraron señales"
                        items={senales}
                        label="Señal"
                        required
                        pendiente={esVacio(formData.id_senal)}
                      />
                      {errors.id_senal && (
                        <p className="text-sm text-red-500 flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.id_senal}
                        </p>
                      )}
                    </div>

                    {/* Tipo de Mantenimiento */}
                    <div className="space-y-2">
                      <CommandSelect
                        value={formData.id_tipo_mant}
                        onValueChange={(value) => handleSelectChange('id_tipo_mant', value)}
                        placeholder="Seleccionar tipo de mantenimiento"
                        searchPlaceholder="Buscar tipo..."
                        emptyMessage="No se encontraron tipos de mantenimiento"
                        items={tiposMantenimiento}
                        label="Tipo de Mantenimiento"
                        pendiente={esVacio(formData.id_tipo_mant)}
                      />
                    </div>

                    {/* Identificador Mantenimiento */}
                    <div className="space-y-2">
                      <Label htmlFor="ident_mantenimiento" className="text-gray-700 dark:text-gray-300 font-medium">
                        Identificador Mantenimiento
                      </Label>
                      <Input
                        id="ident_mantenimiento"
                        name="ident_mantenimiento"
                        value={formData.ident_mantenimiento}
                        onChange={handleInputChange}
                        placeholder="ID del mantenimiento"
                        className={claseCampo(formData.ident_mantenimiento)}
                      />
                    </div>

                    {/* Estado de Señal */}
                    <div className="space-y-2">
                      <CommandSelect
                        value={formData.id_estado_senal}
                        onValueChange={(value) => handleSelectChange('id_estado_senal', value)}
                        placeholder="Seleccionar estado de señal"
                        searchPlaceholder="Buscar estado..."
                        emptyMessage="No se encontraron estados de señal"
                        items={estadosSenal}
                        label="Estado de la Señal"
                        pendiente={esVacio(formData.id_estado_senal)}
                      />
                    </div>
                  </div>

                  {/* Medio utilizado: buque de la flota o vehiculo, excluyentes */}
                  <div className="space-y-2">
                    <p className="font-medium text-gray-700 dark:text-gray-300">Medio utilizado</p>
                    <div className="inline-flex overflow-hidden rounded-md border border-gray-300 dark:border-gray-600">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => elegirMedio('buque')}
                        className={cn('rounded-none', medio === 'buque' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-700 dark:text-gray-300')}
                      >
                        Buque
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => elegirMedio('vehiculo')}
                        className={cn('rounded-none', medio === 'vehiculo' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-700 dark:text-gray-300')}
                      >
                        Vehículo
                      </Button>
                    </div>
                    {medio && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {medio === 'buque' ? (
                          <CommandSelect
                            value={formData.id_buque}
                            onValueChange={(value) => handleSelectChange('id_buque', value)}
                            placeholder="Seleccionar buque"
                            searchPlaceholder="Buscar buque..."
                            emptyMessage="No se encontraron buques"
                            items={buques}
                            label="Buque"
                            pendiente={esVacio(formData.id_buque)}
                          />
                        ) : (
                          <div className="space-y-2">
                            <Label htmlFor="vehiculo" className="text-gray-700 dark:text-gray-300 font-medium">
                              Vehículo
                            </Label>
                            <Input
                              id="vehiculo"
                              name="vehiculo"
                              value={formData.vehiculo}
                              onChange={handleInputChange}
                              placeholder="Vehículo utilizado"
                              className={claseCampo(formData.vehiculo)}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Falla asociada (solo lectura) */}
                  {fallaAsociada && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-1 dark:border-gray-600 dark:bg-gray-700">
                      <p className="font-medium text-gray-700 dark:text-gray-200">Falla asociada</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Fecha de falla: {fechaHoraLegible(fallaAsociada.fecha)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Tipo de falla: {fallaAsociada.tipo || '—'}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Causa: {fallaAsociada.causa ?? '—'}</p>
                    </div>
                  )}

                  {/* Trabajo Realizado */}
                  <div className="space-y-2">
                    <Label htmlFor="trabajo_realizado" className="text-gray-700 dark:text-gray-300 font-medium">
                      Descripción del Trabajo
                    </Label>
                    <Textarea
                      id="trabajo_realizado"
                      name="trabajo_realizado"
                      value={formData.trabajo_realizado}
                      onChange={handleInputChange}
                      rows={4}
                      className={claseCampo(formData.trabajo_realizado)}
                      placeholder="Describa detalladamente el trabajo realizado durante el mantenimiento..."
                    />
                  </div>
                </TabsContent>

                {/* Pestaña Fechas y Tiempos */}
                <TabsContent value="fechas" className="space-y-6 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Fecha Inicio */}
                    <div className="space-y-2">
                      <Label htmlFor="fecha_inicio" className="text-gray-700 dark:text-gray-300 font-medium">
                        Fecha Inicio
                      </Label>
                      <Input
                        id="fecha_inicio"
                        type="datetime-local"
                        name="fecha_inicio"
                        value={formData.fecha_inicio}
                        onChange={handleInputChange}
                        className={claseCampo(formData.fecha_inicio, 'fecha_inicio')}
                      />
                      {errors.fecha_inicio && (
                        <p className="text-sm text-red-500">{errors.fecha_inicio}</p>
                      )}
                    </div>

                    {/* Fecha Finalización */}
                    <div className="space-y-2">
                      <Label htmlFor="fecha_finalizacion" className="text-gray-700 dark:text-gray-300 font-medium">
                        Fecha Finalización
                      </Label>
                      <Input
                        id="fecha_finalizacion"
                        type="datetime-local"
                        name="fecha_finalizacion"
                        value={formData.fecha_finalizacion}
                        onChange={handleInputChange}
                        className={claseCampo(formData.fecha_finalizacion, 'fecha_finalizacion')}
                      />
                      {errors.fecha_finalizacion && (
                        <p className="text-sm text-red-500">{errors.fecha_finalizacion}</p>
                      )}
                    </div>

                    {/* Tiempo Empleado (calculado) */}
                    <div className="space-y-2">
                      <Label htmlFor="tiempo_empleado" className="text-gray-700 dark:text-gray-300 font-medium">
                        Tiempo Empleado
                      </Label>
                      <Input
                        id="tiempo_empleado"
                        name="tiempo_empleado"
                        value={duracionValida === null ? '' : formatearDuracion(duracionValida)}
                        readOnly
                        placeholder="Se calcula con las fechas"
                        className="border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>

                    {/* Aseguro */}
                    <div className="space-y-2">
                      <Label htmlFor="aseguro" className="text-gray-700 dark:text-gray-300 font-medium">
                        Aseguró
                      </Label>
                      <Input
                        id="aseguro"
                        name="aseguro"
                        value={formData.aseguro}
                        onChange={handleInputChange}
                        placeholder="Quién aseguró el trabajo"
                        className={claseCampo(formData.aseguro)}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Pestaña Costos */}
                <TabsContent value="costos" className="space-y-6 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Costo MN */}
                    <div className="space-y-2">
                      <Label htmlFor="costo_mn" className="text-gray-700 dark:text-gray-300 font-medium">
                        Costo MN
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 dark:text-gray-400">$</span>
                        </div>
                        <Input
                          id="costo_mn"
                          type="number"
                          name="costo_mn"
                          value={formData.costo_mn}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className={cn(claseCampo(formData.costo_mn), 'pl-8')}
                        />
                      </div>
                    </div>

                    {/* Costo MLC */}
                    <div className="space-y-2">
                      <Label htmlFor="costo_mlc" className="text-gray-700 dark:text-gray-300 font-medium">
                        Costo MLC
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 dark:text-gray-400">$</span>
                        </div>
                        <Input
                          id="costo_mlc"
                          type="number"
                          name="costo_mlc"
                          value={formData.costo_mlc}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className={cn(claseCampo(formData.costo_mlc), 'pl-8')}
                        />
                      </div>
                    </div>

                    {/* Diesel L */}
                    <div className="space-y-2">
                      <Label htmlFor="diesel_lit" className="text-gray-700 dark:text-gray-300 font-medium">
                        Diesel (L)
                      </Label>
                      <Input
                        id="diesel_lit"
                        type="number"
                        name="diesel_lit"
                        value={formData.diesel_lit}
                        onChange={handleInputChange}
                        min="0"
                        step="0.1"
                        placeholder="Litros"
                        className={claseCampo(formData.diesel_lit)}
                      />
                    </div>

                    {/* Gasolina L */}
                    <div className="space-y-2">
                      <Label htmlFor="gasolina_lit" className="text-gray-700 dark:text-gray-300 font-medium">
                        Gasolina (L)
                      </Label>
                      <Input
                        id="gasolina_lit"
                        type="number"
                        name="gasolina_lit"
                        value={formData.gasolina_lit}
                        onChange={handleInputChange}
                        min="0"
                        step="0.1"
                        placeholder="Litros"
                        className={claseCampo(formData.gasolina_lit)}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Pestaña Responsables */}
                <TabsContent value="responsables" className="space-y-6 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="informa" className="text-gray-700 dark:text-gray-300 font-medium">
                        Informa
                      </Label>
                      <Input
                        id="informa"
                        name="informa"
                        value={formData.informa}
                        onChange={handleInputChange}
                        placeholder="Quién informa"
                        className={claseCampo(formData.informa)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="transmite" className="text-gray-700 dark:text-gray-300 font-medium">
                        Transmite
                      </Label>
                      <Input
                        id="transmite"
                        name="transmite"
                        value={formData.transmite}
                        onChange={handleInputChange}
                        placeholder="Quién transmite"
                        className={claseCampo(formData.transmite)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rg" className="text-gray-700 dark:text-gray-300 font-medium">
                        RG
                      </Label>
                      <Input
                        id="rg"
                        name="rg"
                        value={formData.rg}
                        onChange={handleInputChange}
                        placeholder="Número RG"
                        className={claseCampo(formData.rg)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="orden" className="text-gray-700 dark:text-gray-300 font-medium">
                        Orden
                      </Label>
                      <Input
                        id="orden"
                        name="orden"
                        value={formData.orden}
                        onChange={handleInputChange}
                        placeholder="Número de orden"
                        className={claseCampo(formData.orden)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="introdujo" className="text-gray-700 dark:text-gray-300 font-medium">
                        Introdujo
                      </Label>
                      <Input
                        id="introdujo"
                        name="introdujo"
                        value={formData.introdujo}
                        onChange={handleInputChange}
                        placeholder="Quién introdujo"
                        className={claseCampo(formData.introdujo)}
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
                    {isEditing ? 'Actualizar Mantenimiento' : 'Guardar Mantenimiento'}
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

export default FormMantenimientos;
