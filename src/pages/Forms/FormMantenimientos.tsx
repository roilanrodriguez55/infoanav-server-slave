import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mantenimientosService } from '../../services/api/mantenApi';
import { catalogosService } from '../../services/api/catalogApi';
import { CommandSelectWithAdd } from '../../../@/components/ui/CommandSelectWithAdd';
import { useAuth } from '../../context/AuthContext';

// Componentes shadcn
import { Button } from '../../../@/components/ui/button';
import { Input } from '../../../@/components/ui/input';
import { Textarea } from '../../../@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '../../../@/components/ui/card';
import { Label } from '../../../@/components/ui/label';
import { Alert, AlertDescription } from '../../../@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../@/components/ui/tabs';
import {
  AlertCircle,
  Save,
  X,
  ArrowLeft,
  Wrench,
  Clock,
  DollarSign,
  Users,
  Loader2
} from 'lucide-react';

// Interfaces
interface CatalogoItem {
  id: string;
  nombre: string;
}

interface FormMantenimientosData {
  id_tipo_mant: string;
  ident_mantenimiento: string;
  fecha_inicio: string;
  fecha_finalizacion: string;
  tiempo_empleado: number;
  aseguro: string;
  id_estado_senal: string;
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
  tipoFallaCausa: string;
}

const FormMantenimientos: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { authState } = useAuth();
  
  const isEditing = !!id;
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditing);
  const [tiposMantenimiento, setTiposMantenimiento] = useState<CatalogoItem[]>([]);
  const [estadosSenal, setEstadosSenal] = useState<CatalogoItem[]>([]);
  const [tiposFalla, setTiposFalla] = useState<CatalogoItem[]>([]);
  
  const [formData, setFormData] = useState<FormMantenimientosData>({
    id_tipo_mant: '',
    ident_mantenimiento: '',
    fecha_inicio: '',
    fecha_finalizacion: '',
    tiempo_empleado: 0,
    aseguro: '',
    id_estado_senal: '',
    trabajo_realizado: '',
    costo_mn: 0,
    costo_mlc: 0,
    diesel_lit: 0,
    gasolina_lit: 0,
    informa: '',
    transmite: '',
    rg: '',
    orden: '',
    introdujo: '',
    tipoFallaCausa: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState('general');

  // Cargar catálogos
  useEffect(() => {
    const loadCatalogos = async () => {
      setLoading(true);
      try {
        const [tiposRes, estadosRes, fallasRes] = await Promise.all([
          mantenimientosService.getTiposMantenimiento(),
          mantenimientosService.getEstadosSenal(),
          mantenimientosService.getTiposFalla()
        ]);
        
        if (tiposRes.success) {
          setTiposMantenimiento(tiposRes.data || []);
        }
        
        if (estadosRes.success) {
          setEstadosSenal(estadosRes.data || []);
        }
        
        if (fallasRes.success) {
          setTiposFalla(fallasRes.data || []);
        }
      } catch (error) {
        console.error('Error cargando catálogos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCatalogos();
  }, []);

  // Cargar datos del mantenimiento si estamos editando
  useEffect(() => {
    const loadMantenimiento = async () => {
      if (!id) return;
      
      setLoadingData(true);
      try {
        console.log('Cargando mantenimiento para edición, ID:', id);
        const response = await mantenimientosService.getById(id);
        
        if (response.success && response.data) {
          const data = response.data;
          console.log('Datos recibidos:', data);
          
          const formatDateForInput = (dateStr?: string) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return date.toISOString().slice(0, 16);
          };

          const getHoras = (tiempo: any): number => {
            if (!tiempo) return 0;
            if (typeof tiempo === 'number') return tiempo;
            if (typeof tiempo === 'object') {
              return tiempo.hours || 0;
            }
            return 0;
          };

          setFormData({
            id_tipo_mant: data.id_tipo_mant || '',
            ident_mantenimiento: data.ident_mantenimiento || '',
            fecha_inicio: formatDateForInput(data.fecha_inicio),
            fecha_finalizacion: formatDateForInput(data.fecha_finalizacion),
            tiempo_empleado: getHoras(data.tiempo_empleado),
            aseguro: data.aseguro || '',
            id_estado_senal: data.id_estado_senal || '',
            trabajo_realizado: data.trabajo_realizado || '',
            costo_mn: parseFloat(data.costo_mn) || 0,
            costo_mlc: parseFloat(data.costo_mlc) || 0,
            diesel_lit: parseFloat(data.diesel_lit) || 0,
            gasolina_lit: parseFloat(data.gasolina_lit) || 0,
            informa: data.informa || '',
            transmite: data.transmite || '',
            rg: data.rg || '',
            orden: data.orden || '',
            introdujo: data.introdujo || '',
            tipoFallaCausa: data.tipoFallaCausa || ''
          });
        } else {
          alert('Error al cargar los datos del mantenimiento');
          navigate('/gestion-mant');
        }
      } catch (error) {
        console.error('Error cargando mantenimiento:', error);
        alert('Error al conectar con el servidor');
        navigate('/gestion-mant');
      } finally {
        setLoadingData(false);
      }
    };

    if (isEditing) {
      loadMantenimiento();
    }
  }, [id, isEditing, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : Number(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleGoBack = () => {
    navigate('/gestion-mant');
  };

  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.id_tipo_mant) newErrors.id_tipo_mant = 'El tipo de mantenimiento es requerido';
    if (!formData.fecha_inicio) newErrors.fecha_inicio = 'La fecha de inicio es requerida';
    if (!formData.id_estado_senal) newErrors.id_estado_senal = 'El estado es requerido';
    if (!formData.trabajo_realizado) newErrors.trabajo_realizado = 'La descripción del trabajo realizado es requerida';
    
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
        const userStr = localStorage.getItem('usuario');
        const user = userStr ? JSON.parse(userStr) : null;
        
        const dataToSend: any = {
          id_tipo_mant: formData.id_tipo_mant,
          ident_mantenimiento: formData.ident_mantenimiento || null,
          fecha_inicio: formData.fecha_inicio || null,
          fecha_finalizacion: formData.fecha_finalizacion || null,
          tiempo_empleado: formData.tiempo_empleado || 0,
          aseguro: formData.aseguro || null,
          id_estado_senal: formData.id_estado_senal,
          trabajo_realizado: formData.trabajo_realizado,
          costo_mn: formData.costo_mn || 0,
          costo_mlc: formData.costo_mlc || 0,
          diesel_lit: formData.diesel_lit || 0,
          gasolina_lit: formData.gasolina_lit || 0,
          informa: formData.informa || null,
          transmite: formData.transmite || null,
          rg: formData.rg || null,
          orden: formData.orden || null,
          introdujo: formData.introdujo || null
        };

        if (isEditing) {
          dataToSend.updateby = user?.usuario || 'sistema';
        } else {
          dataToSend.createby = user?.usuario || 'sistema';
        }

        console.log('Enviando datos:', dataToSend);
        
        let response;
        if (isEditing) {
          response = await mantenimientosService.update(id!, dataToSend);
        } else {
          response = await mantenimientosService.create(dataToSend);
        }
        
        if (response.success) {
          alert(`✅ Mantenimiento ${isEditing ? 'actualizado' : 'registrado'} con éxito`);
          navigate('/gestion-mant');
        } else {
          alert('❌ Error al guardar: ' + (response.message || 'Error desconocido'));
        }
      } catch (error: any) {
        console.error('Error detallado:', error);
        alert('❌ Error al conectar con el servidor: ' + (error.message || 'Error desconocido'));
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
      setFormData({
        id_tipo_mant: '',
        ident_mantenimiento: '',
        fecha_inicio: '',
        fecha_finalizacion: '',
        tiempo_empleado: 0,
        aseguro: '',
        id_estado_senal: '',
        trabajo_realizado: '',
        costo_mn: 0,
        costo_mlc: 0,
        diesel_lit: 0,
        gasolina_lit: 0,
        informa: '',
        transmite: '',
        rg: '',
        orden: '',
        introdujo: '',
        tipoFallaCausa: ''
      });
      setErrors({});
    }
  };

  const loadFallaData = (): void => {
    const fallaEjemplo = tiposFalla.length > 0 
      ? tiposFalla[Math.floor(Math.random() * tiposFalla.length)].nombre 
      : 'Falla en sistema eléctrico';
    
    setFormData(prev => ({
      ...prev,
      tipoFallaCausa: `${fallaEjemplo} - Corte de energía por tormenta eléctrica`
    }));
  };

  const hasError = (fieldName: string): boolean => {
    return !!errors[fieldName];
  };

  const getInputClassName = (fieldName: string): string => {
    return hasError(fieldName) ? "border-red-500 focus-visible:ring-red-500" : "";
  };

  if (loading || loadingData) {
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
                    {/* Tipo de Mantenimiento */}
                    <div className="space-y-2">
                      <Label htmlFor="id_tipo_mant" className="text-gray-700 dark:text-gray-300 font-medium">
                        Tipo de Mantenimiento <span className="text-red-500">*</span>
                      </Label>
                      <CommandSelectWithAdd
                        value={formData.id_tipo_mant}
                        onValueChange={(value) => handleSelectChange('id_tipo_mant', value)}
                        placeholder="Seleccionar tipo de mantenimiento"
                        searchPlaceholder="Buscar tipo..."
                        emptyMessage="No se encontraron tipos de mantenimiento"
                        items={tiposMantenimiento}
                        onAddItem={async (nombre) => {
                          const response = await catalogosService.createTipoMantenimiento(nombre);
                          if (response.success) {
                            const newItem = { id: response.data.id, nombre };
                            setTiposMantenimiento(prev => [...prev, newItem]);
                            return newItem;
                          }
                          throw new Error(response.message);
                        }}
                        label="Tipo de Mantenimiento"
                        required
                      />
                      {errors.id_tipo_mant && (
                        <p className="text-sm text-red-500 flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.id_tipo_mant}
                        </p>
                      )}
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
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>

                    {/* Estado de Señal */}
                    <div className="space-y-2">
                      <Label htmlFor="id_estado_senal" className="text-gray-700 dark:text-gray-300 font-medium">
                        Estado de la Señal <span className="text-red-500">*</span>
                      </Label>
                      <CommandSelectWithAdd
                        value={formData.id_estado_senal}
                        onValueChange={(value) => handleSelectChange('id_estado_senal', value)}
                        placeholder="Seleccionar estado de señal"
                        searchPlaceholder="Buscar estado..."
                        emptyMessage="No se encontraron estados de señal"
                        items={estadosSenal}
                        onAddItem={async (nombre) => {
                          const response = await catalogosService.createEstadoSenal(nombre);
                          if (response.success) {
                            const newItem = { id: response.data.id, nombre };
                            setEstadosSenal(prev => [...prev, newItem]);
                            return newItem;
                          }
                          throw new Error(response.message);
                        }}
                        label="Estado de la Señal"
                        required
                      />
                      {errors.id_estado_senal && (
                        <p className="text-sm text-red-500 flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.id_estado_senal}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tipo de falla y causa */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="tipoFallaCausa" className="text-gray-700 dark:text-gray-300 font-medium">
                        Tipo de Falla y Causa
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={loadFallaData}
                        className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        Cargar datos de la falla
                      </Button>
                    </div>
                    <Textarea
                      id="tipoFallaCausa"
                      name="tipoFallaCausa"
                      value={formData.tipoFallaCausa}
                      onChange={handleInputChange}
                      rows={2}
                      className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                      placeholder="Descripción de la falla y su causa"
                    />
                  </div>

                  {/* Trabajo Realizado */}
                  <div className="space-y-2">
                    <Label htmlFor="trabajo_realizado" className="text-gray-700 dark:text-gray-300 font-medium">
                      Descripción del Trabajo <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="trabajo_realizado"
                      name="trabajo_realizado"
                      value={formData.trabajo_realizado}
                      onChange={handleInputChange}
                      rows={4}
                      className={getInputClassName('trabajo_realizado')}
                      placeholder="Describa detalladamente el trabajo realizado durante el mantenimiento..."
                    />
                    {errors.trabajo_realizado && (
                      <p className="text-sm text-red-500 flex items-center mt-1">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.trabajo_realizado}
                      </p>
                    )}
                  </div>
                </TabsContent>

                {/* Pestaña Fechas y Tiempos */}
                <TabsContent value="fechas" className="space-y-6 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Fecha Inicio */}
                    <div className="space-y-2">
                      <Label htmlFor="fecha_inicio" className="text-gray-700 dark:text-gray-300 font-medium">
                        Fecha Inicio <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="fecha_inicio"
                        type="datetime-local"
                        name="fecha_inicio"
                        value={formData.fecha_inicio}
                        onChange={handleInputChange}
                        className={getInputClassName('fecha_inicio')}
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
                        className={getInputClassName('fecha_finalizacion')}
                      />
                      {errors.fecha_finalizacion && (
                        <p className="text-sm text-red-500">{errors.fecha_finalizacion}</p>
                      )}
                    </div>

                    {/* Tiempo Empleado */}
                    <div className="space-y-2">
                      <Label htmlFor="tiempo_empleado" className="text-gray-700 dark:text-gray-300 font-medium">
                        Tiempo Empleado (horas)
                      </Label>
                      <Input
                        id="tiempo_empleado"
                        type="number"
                        name="tiempo_empleado"
                        value={formData.tiempo_empleado}
                        onChange={handleInputChange}
                        min="0"
                        step="0.5"
                        placeholder="Horas trabajadas"
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
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
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {formData.fecha_inicio && formData.fecha_finalizacion && (
                    <Alert className="bg-gray-100 border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                      <Clock className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      <AlertDescription className="text-gray-700 dark:text-gray-300">
                        Duración: {formData.tiempo_empleado || 0} horas
                      </AlertDescription>
                    </Alert>
                  )}
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
                          className="pl-8 border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
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
                          className="pl-8 border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
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
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
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
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
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
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
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
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
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
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
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
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
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
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
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