import React, { useState,useEffect } from 'react';
import { fallasService } from '../../services/api/fallasApi';
import { useAuth } from '../../context/AuthContext';

// Interfaces para tipos de datos
interface TipoFalla {
  id: number;
  nombre: string;
}

interface OrigenFalla {
  id: number;
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

interface FormErrors {
  [key: string]: string;
}

type FormFieldChangeEvent = 
  | React.ChangeEvent<HTMLInputElement>
  | React.ChangeEvent<HTMLTextAreaElement>
  | React.ChangeEvent<HTMLSelectElement>;

const FormFallas: React.FC = () => {
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

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Agrega estos estados
const [tiposFalla, setTiposFalla] = useState<TipoFalla[]>([]);
const [origenesFalla, setOrigenesFalla] = useState<OrigenFalla[]>([]);
const [loadingCatalogos, setLoadingCatalogos] = useState(true);

// Agrega este useEffect después de los estados
useEffect(() => {
  const loadCatalogos = async () => {
    try {
      const [tiposRes, origenesRes] = await Promise.all([
        fallasService.getTiposFalla(),
        fallasService.getOrigenesFalla()
      ]);
      
      if (tiposRes.success) {
        setTiposFalla(tiposRes.data);
      }
      
      if (origenesRes.success) {
        setOrigenesFalla(origenesRes.data);
      }
    } catch (error) {
      console.error('Error cargando catálogos:', error);
    } finally {
      setLoadingCatalogos(false);
    }
  };
  
  loadCatalogos();
}, []);

  const handleChange = (e: FormFieldChangeEvent): void => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
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

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
  const term = e.target.value;
  setSearchTerm(term);
  
  if (term.length > 2) {
    try {
      const results = await fallasService.search(term);
      console.log('Resultados de búsqueda:', results);
      // Aquí puedes mostrar los resultados en una tabla o lista
    } catch (error) {
      console.error('Error en búsqueda:', error);
    }
  }
};

  const handleGoBack = (): void => {
    // Implementar la navegación de regreso
    // Si estás usando React Router, usa: navigate('/')
    // Si es una aplicación simple, puedes usar window.history.back()
    window.history.back();
  };

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};
    
    if (!formData.fecha_falla.trim()) {
      newErrors.fecha_falla = 'La fecha de falla es requerida';
    }
    
    if (!formData.id_tipo_falla) {
      newErrors.id_tipo_falla = 'El tipo de falla es requerido';
    }
    
    if (!formData.causa_de_falla.trim()) {
      newErrors.causa_de_falla = 'La causa de falla es requerida';
    }
    
    if (formData.fecha_falla && formData.fecha_restablecer) {
      if (new Date(formData.fecha_restablecer) < new Date(formData.fecha_falla)) {
        newErrors.fecha_restablecer = 'La fecha de restablecimiento no puede ser anterior a la fecha de falla';
      }
    }
    
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      
      try {
      // Preparar datos para enviar
      const dataToSend = {
        ...formData,
        // Convertir strings vacíos a null para las fechas
        fecha_falla: formData.fecha_falla || new Date().toISOString().slice(0, 16),
        fecha_restablecer: formData.fecha_restablecer,
        fecha_pronost_restablecer: formData.fecha_pronost_restablecer,
        id_tipo_falla: formData.id_tipo_falla,
        id_origen_falla: formData.id_origen_falla,
        rescatada: formData.rescatada || false
      };

      console.log('Enviando datos:', dataToSend);
      
      const response = await fallasService.create(dataToSend);
      
      if (response.success) {
        alert('✅ Falla registrada con éxito');
        handleReset();
      } else {
        alert('❌ Error al guardar: ' + response.message);
      }
        } catch (error) {
        console.error('Error al guardar:', error);
        alert('Error al guardar la falla');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setErrors(newErrors);
      const firstErrorField = Object.keys(newErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleReset = (): void => {
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
  };

  const hasError = (fieldName: string): boolean => {
    return !!errors[fieldName];
  };

  const inputClassName = (fieldName: string): string => {
    const baseClasses = "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";
    return hasError(fieldName)
      ? `${baseClasses} border-red-500 focus:ring-red-500`
      : `${baseClasses} border-gray-300`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Barra superior con buscador y botón regresar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Regresar
          </button>
          
          <div className="relative flex-1 max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Buscar fallas por ID, tipo, causa..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-5">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Registro de Fallas
            </h2>
            <p className="text-blue-100 text-sm mt-1">Complete la información detallada de la falla</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 lg:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Fechas */}
              <div className="space-y-2">
                <label htmlFor="fecha_falla" className="block text-sm font-medium text-gray-700">
                  Fecha de Falla <span className="text-red-500">*</span>
                </label>
                <input
                  id="fecha_falla"
                  type="datetime-local"
                  name="fecha_falla"
                  value={formData.fecha_falla}
                  onChange={handleChange}
                  className={inputClassName('fecha_falla')}
                  aria-invalid={hasError('fecha_falla')}
                />
                {errors.fecha_falla && (
                  <p className="text-red-500 text-xs flex items-center mt-1">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.fecha_falla}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="fecha_restablecer" className="block text-sm font-medium text-gray-700">
                  Fecha de Restablecimiento
                </label>
                <input
                  id="fecha_restablecer"
                  type="datetime-local"
                  name="fecha_restablecer"
                  value={formData.fecha_restablecer}
                  onChange={handleChange}
                  className={inputClassName('fecha_restablecer')}
                />
                {errors.fecha_restablecer && (
                  <p className="text-red-500 text-xs mt-1">{errors.fecha_restablecer}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="fecha_pronost_restablecer" className="block text-sm font-medium text-gray-700">
                  Fecha Pronóstico Restablecimiento
                </label>
                <input
                  id="fecha_pronost_restablecer"
                  type="datetime-local"
                  name="fecha_pronost_restablecer"
                  value={formData.fecha_pronost_restablecer}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Selects */}
              <div className="space-y-2">
                <label htmlFor="id_tipo_falla" className="block text-sm font-medium text-gray-700">
                  Tipo de Falla <span className="text-red-500">*</span>
                </label>
                <select
                  id="id_tipo_falla"
                  name="id_tipo_falla"
                  value={formData.id_tipo_falla}
                  onChange={handleChange}
                  className={inputClassName('FK_id_tipo_falla')}
                >
                  <option value="">Seleccione tipo de falla</option>
                  {tiposFalla.map(tipo => (
                    <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                  ))}
                </select>
                {errors.FK_id_tipo_falla && (
                  <p className="text-red-500 text-xs mt-1">{errors.FK_id_tipo_falla}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="id_origen_falla" className="block text-sm font-medium text-gray-700">
                  Origen de Falla
                </label>
                <select
                  id="id_origen_falla"
                  name="id_origen_falla"
                  value={formData.id_origen_falla}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione origen</option>
                  {origenesFalla.map(origen => (
                    <option key={origen.id} value={origen.id}>{origen.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Campos de texto */}
              <div className="lg:col-span-2 space-y-2">
                <label htmlFor="causa_de_falla" className="block text-sm font-medium text-gray-700">
                  Causa de Falla <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="causa_de_falla"
                  name="causa_de_falla"
                  value={formData.causa_de_falla}
                  onChange={handleChange}
                  rows={3}
                  className={inputClassName('causa_de_falla')}
                  placeholder="Describa la causa de la falla..."
                />
                {errors.causa_de_falla && (
                  <p className="text-red-500 text-xs mt-1">{errors.causa_de_falla}</p>
                )}
              </div>

              <div className="lg:col-span-2 space-y-2">
                <label htmlFor="medidas" className="block text-sm font-medium text-gray-700">
                  Medidas Tomadas
                </label>
                <textarea
                  id="medidas"
                  name="medidas"
                  value={formData.medidas}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describa las medidas tomadas..."
                />
              </div>

              <div className="lg:col-span-2 space-y-2">
                <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700">
                  Observaciones
                </label>
                <textarea
                  id="observaciones"
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Observaciones adicionales..."
                />
              </div>

              {/* Campos de texto simples */}
              <div className="space-y-2">
                <label htmlFor="reporto" className="block text-sm font-medium text-gray-700">
                  Reportó
                </label>
                <input
                  id="reporto"
                  type="text"
                  name="reporto"
                  value={formData.reporto}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre de quien reporta"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="transmite" className="block text-sm font-medium text-gray-700">
                  Transmite
                </label>
                <input
                  id="transmite"
                  type="text"
                  name="transmite"
                  value={formData.transmite}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Quién transmite"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="anar" className="block text-sm font-medium text-gray-700">
                  ANAR
                </label>
                <input
                  id="anar"
                  type="text"
                  name="anar"
                  value={formData.anar}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ANAR"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="rg" className="block text-sm font-medium text-gray-700">
                  RG
                </label>
                <input
                  id="rg"
                  type="text"
                  name="rg"
                  value={formData.rg}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="RG"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="duracion_de_falla" className="block text-sm font-medium text-gray-700">
                  Duración de Falla
                </label>
                <input
                  id="duracion_de_falla"
                  type="text"
                  name="duracion_de_falla"
                  value={formData.duracion_de_falla}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 2h 30m"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="diferencia_tiempo" className="block text-sm font-medium text-gray-700">
                  Diferencia de Tiempo
                </label>
                <input
                  id="diferencia_tiempo"
                  type="text"
                  name="diferencia_tiempo"
                  value={formData.diferencia_tiempo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Diferencia"
                />
              </div>

              {/* Checkbox */}
              <div className="flex items-center h-full pt-6">
                <div className="flex items-center space-x-3">
                  <input
                    id="rescatada"
                    type="checkbox"
                    name="rescatada"
                    checked={formData.rescatada}
                    onChange={handleChange}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                  />
                  <label htmlFor="rescatada" className="text-sm font-medium text-gray-700">
                    Falla Rescatada
                  </label>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
              >
                Limpiar Formulario
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center order-1 sm:order-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </>
                ) : (
                  'Guardar Falla'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormFallas;