import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fallasService } from '../../services/api/fallasApi';
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
import { Checkbox } from '../../../@/components/ui/checkbox';
import { Alert, AlertDescription } from '../../../@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../@/components/ui/tabs';
import {
  AlertCircle,
  Save,
  X,
  ArrowLeft,
  Calendar,
  User,
  Clock,
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

interface FormData {
  fecha_falla: string;
  fecha_restablecer: string;
  fecha_pronost_restablecer: string;
  id_tipo_falla: string;
  causa_de_falla: string;
  medidas: string;
  reporto: string;
  rescatada: boolean;
  observaciones: string;
  duracion_de_falla: string;
  diferencia_tiempo: string;
  id_origen_falla: string;
  transmite: string;
  anar: string;
  rg: string;
}

const FormFallas: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { authState } = useAuth();
  
  const isEditing = !!id;
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [tiposFalla, setTiposFalla] = useState<TipoFalla[]>([]);
  const [origenesFalla, setOrigenesFalla] = useState<OrigenFalla[]>([]);
  const [activeTab, setActiveTab] = useState('basicos');
  
  const [formData, setFormData] = useState<FormData>({
    fecha_falla: '',
    fecha_restablecer: '',
    fecha_pronost_restablecer: '',
    id_tipo_falla: '',
    causa_de_falla: '',
    medidas: '',
    reporto: '',
    rescatada: false,
    observaciones: '',
    duracion_de_falla: '',
    diferencia_tiempo: '',
    id_origen_falla: '',
    transmite: '',
    anar: '',
    rg: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar catálogos
  useEffect(() => {
    const loadCatalogos = async () => {
      setLoading(true);
      try {
        const [tiposRes, origenesRes] = await Promise.all([
          fallasService.getTiposFalla(),
          fallasService.getOrigenesFalla(),
        ]);

        if (tiposRes.success) {
          setTiposFalla(tiposRes.data.map((item: any) => ({
            id: item.id,
            nombre: item.nombre
          })));
        }
        
        if (origenesRes.success) {
          setOrigenesFalla(origenesRes.data.map((item: any) => ({
            id: item.id,
            nombre: item.nombre
          })));
        }
      } catch (error) {
        console.error('Error cargando catálogos:', error);
        alert('Error al cargar los catálogos');
      } finally {
        setLoading(false);
      }
    };

    loadCatalogos();
  }, []);

  // Cargar datos de la falla si estamos editando
  useEffect(() => {
    const loadFalla = async () => {
      if (!id) return;
      
      setLoadingData(true);
      try {
        console.log('Cargando falla para edición, ID:', id);
        const response = await fallasService.getById(id);
        
        if (response.success && response.data) {
          const data = response.data;
          console.log('Datos recibidos:', data);
          
          const formatDateForInput = (dateStr?: string) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return date.toISOString().slice(0, 16);
          };

          setFormData({
            fecha_falla: formatDateForInput(data.fecha_falla),
            fecha_restablecer: formatDateForInput(data.fecha_restablecer),
            fecha_pronost_restablecer: formatDateForInput(data.fecha_pronost_restablecer),
            id_tipo_falla: data.id_tipo_falla || '',
            causa_de_falla: data.causa_de_falla || '',
            medidas: data.medidas || '',
            reporto: data.reporto || '',
            rescatada: data.rescatada || false,
            observaciones: data.observaciones || '',
            duracion_de_falla: data.duracion_de_falla || '',
            diferencia_tiempo: data.diferencia_tiempo || '',
            id_origen_falla: data.id_origen_falla || '',
            transmite: data.transmite || '',
            anar: data.anar || '',
            rg: data.rg || ''
          });
        } else {
          alert('Error al cargar los datos de la falla');
          navigate('/gestion-fallas');
        }
      } catch (error) {
        console.error('Error cargando falla:', error);
        alert('Error al conectar con el servidor');
        navigate('/gestion-fallas');
      } finally {
        setLoadingData(false);
      }
    };

    if (isEditing) {
      loadFalla();
    }
  }, [id, isEditing, navigate]);

  // Calcular duración automáticamente
  useEffect(() => {
    if (formData.fecha_falla && formData.fecha_restablecer) {
      const inicio = new Date(formData.fecha_falla);
      const fin = new Date(formData.fecha_restablecer);
      const diffMs = fin.getTime() - inicio.getTime();
      
      if (diffMs > 0) {
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        setFormData(prev => ({
          ...prev,
          duracion_de_falla: `${diffHrs}h ${diffMins}m`
        }));
      }
    }
  }, [formData.fecha_falla, formData.fecha_restablecer]);

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
    navigate('/gestion-fallas');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fecha_falla) newErrors.fecha_falla = 'La fecha de falla es requerida';
    if (!formData.id_tipo_falla) newErrors.id_tipo_falla = 'El tipo de falla es requerido';
    if (!formData.causa_de_falla) newErrors.causa_de_falla = 'La causa de falla es requerida';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const userStr = localStorage.getItem('usuario');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const dataToSend: any = {
        fecha_falla: formData.fecha_falla,
        fecha_restablecer: formData.fecha_restablecer || null,
        fecha_pronost_restablecer: formData.fecha_pronost_restablecer || null,
        id_tipo_falla: formData.id_tipo_falla || null,
        causa_de_falla: formData.causa_de_falla,
        medidas: formData.medidas || null,
        reporto: formData.reporto || null,
        rescatada: formData.rescatada || false,
        observaciones: formData.observaciones || null,
        duracion_de_falla: formData.duracion_de_falla || null,
        diferencia_tiempo: formData.diferencia_tiempo || null,
        id_origen_falla: formData.id_origen_falla || null,
        transmite: formData.transmite || null,
        anar: formData.anar || null,
        rg: formData.rg || null
      };

      if (isEditing) {
        dataToSend.updateby = user?.usuario || 'sistema';
      } else {
        dataToSend.createby = user?.usuario || 'sistema';
      }

      console.log('📤 Datos a enviar:', JSON.stringify(dataToSend, null, 2));
      
      let response;
      if (isEditing) {
        response = await fallasService.update(id!, dataToSend);
      } else {
        response = await fallasService.create(dataToSend);
      }
      
      console.log('🟢 Respuesta del servidor:', response);
      
      if (response.success) {
        alert(`✅ Falla ${isEditing ? 'actualizada' : 'registrada'} correctamente`);
        navigate('/gestion-fallas');
      } else {
        alert('❌ Error al guardar: ' + (response.message || 'Error desconocido'));
      }
    } catch (error: any) {
      console.error('🔴 Error:', error);
      alert('❌ Error al conectar con el servidor: ' + (error.message || 'Error desconocido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (isEditing) {
      window.location.reload();
    } else {
      setFormData({
        fecha_falla: '',
        fecha_restablecer: '',
        fecha_pronost_restablecer: '',
        id_tipo_falla: '',
        causa_de_falla: '',
        medidas: '',
        reporto: '',
        rescatada: false,
        observaciones: '',
        duracion_de_falla: '',
        diferencia_tiempo: '',
        id_origen_falla: '',
        transmite: '',
        anar: '',
        rg: ''
      });
      setErrors({});
      navigate('/gestion-fallas');
    }
  };

  const hasError = (fieldName: keyof FormData): boolean => {
    return !!errors[fieldName];
  };

  const inputClassName = (fieldName: keyof FormData): string => {
    const baseClasses = "w-full";
    return hasError(fieldName)
      ? `${baseClasses} border-red-500 focus-visible:ring-red-500`
      : baseClasses;
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-900 dark:text-gray-100 mx-auto mb-4" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            {loadingData ? 'Cargando datos de la falla...' : 'Cargando catálogos...'}
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
              <AlertCircle className="w-8 h-8 mr-3 text-gray-600 dark:text-gray-300" />
              {isEditing ? 'Editar Falla' : 'Nueva Falla'}
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              {isEditing 
                ? 'Modifique los datos de la falla seleccionada' 
                : 'Complete la información detallada de la falla'}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Fecha de Falla */}
                    <div className="space-y-2">
                      <Label htmlFor="fecha_falla" className="flex items-center text-gray-700 dark:text-gray-300 font-medium">
                        Fecha de Falla <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="fecha_falla"
                        type="datetime-local"
                        name="fecha_falla"
                        value={formData.fecha_falla}
                        onChange={handleInputChange}
                        className={`${inputClassName('fecha_falla')} border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
                      />
                      {errors.fecha_falla && (
                        <p className="text-sm text-red-500 flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.fecha_falla}
                        </p>
                      )}
                    </div>

                    {/* Tipo de Falla */}
                    <div className="space-y-2">
                      <CommandSelectWithAdd
                        value={formData.id_tipo_falla}
                        onValueChange={(value) => handleSelectChange('id_tipo_falla', value)}
                        placeholder="Seleccionar tipo de falla"
                        searchPlaceholder="Buscar tipo..."
                        emptyMessage="No se encontraron tipos de falla"
                        items={tiposFalla}
                        onAddItem={async (nombre) => {
                          const response = await catalogosService.createTipoFalla(nombre);
                          if (response.success) {
                            const newItem = { id: response.data.id, nombre };
                            setTiposFalla(prev => [...prev, newItem]);
                            return newItem;
                          }
                          throw new Error(response.message);
                        }}
                        label="Tipo de Falla"
                        required
                      />
                      {errors.id_tipo_falla && (
                        <p className="text-sm text-red-500 flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.id_tipo_falla}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Causa de Falla */}
                  <div className="space-y-2">
                    <Label htmlFor="causa_de_falla" className="flex items-center text-gray-700 dark:text-gray-300 font-medium">
                      Causa de Falla <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Textarea
                      id="causa_de_falla"
                      name="causa_de_falla"
                      value={formData.causa_de_falla}
                      onChange={handleInputChange}
                      placeholder="Describa la causa de la falla..."
                      className={`${inputClassName('causa_de_falla')} border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400`}
                      rows={4}
                    />
                    {errors.causa_de_falla && (
                      <p className="text-sm text-red-500 flex items-center mt-1">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.causa_de_falla}
                      </p>
                    )}
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
                      <Input
                        id="fecha_restablecer"
                        type="datetime-local"
                        name="fecha_restablecer"
                        value={formData.fecha_restablecer}
                        onChange={handleInputChange}
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    {/* Fecha Pronóstico */}
                    <div className="space-y-2">
                      <Label htmlFor="fecha_pronost_restablecer" className="text-gray-700 dark:text-gray-300 font-medium">
                        Fecha Pronóstico Restablecimiento
                      </Label>
                      <Input
                        id="fecha_pronost_restablecer"
                        type="datetime-local"
                        name="fecha_pronost_restablecer"
                        value={formData.fecha_pronost_restablecer}
                        onChange={handleInputChange}
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    {/* Origen de Falla */}
                    <div className="space-y-2">
                      <CommandSelectWithAdd
                        value={formData.id_origen_falla}
                        onValueChange={(value) => handleSelectChange('id_origen_falla', value)}
                        placeholder="Seleccionar origen de falla"
                        searchPlaceholder="Buscar origen..."
                        emptyMessage="No se encontraron orígenes de falla"
                        items={origenesFalla}
                        onAddItem={async (nombre) => {
                          const response = await catalogosService.createOrigenFalla(nombre);
                          if (response.success) {
                            const newItem = { id: response.data.id, nombre };
                            setOrigenesFalla(prev => [...prev, newItem]);
                            return newItem;
                          }
                          throw new Error(response.message);
                        }}
                        label="Origen de Falla"
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
                      className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
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
                      className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
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
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
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
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
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
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
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
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
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
                        name="duracion_de_falla"
                        value={formData.duracion_de_falla}
                        onChange={handleInputChange}
                        placeholder="Ej: 2h 30m"
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="diferencia_tiempo" className="text-gray-700 dark:text-gray-300 font-medium">
                        Diferencia de Tiempo
                      </Label>
                      <Input
                        id="diferencia_tiempo"
                        name="diferencia_tiempo"
                        value={formData.diferencia_tiempo}
                        onChange={handleInputChange}
                        placeholder="Diferencia"
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {formData.fecha_falla && formData.fecha_restablecer && (
                    <Alert className="bg-gray-100 border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                      <Clock className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      <AlertDescription className="text-gray-700 dark:text-gray-300">
                        Duración calculada: {formData.duracion_de_falla || 'Calculando...'}
                      </AlertDescription>
                    </Alert>
                  )}
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