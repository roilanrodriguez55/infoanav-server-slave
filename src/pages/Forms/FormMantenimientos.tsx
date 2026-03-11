import React, { useState, useEffect } from 'react';
import { mantenimientosService } from '../../services/api/mantenApi';
import { useAuth } from '../../context/AuthContext';

// Interfaces para tipos de datos
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
  // Campo para mostrar la falla asociada (no se guarda directamente)
  tipoFallaCausa: string;
}

const FormMantenimientos: React.FC = () => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(false);
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
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Cargar catálogos al montar el componente
  useEffect(() => {
    const loadCatalogos = async () => {
      setLoading(true);
      try {
        const [tiposRes, estadosRes, fallasRes] = await Promise.all([
          mantenimientosService.getTiposMantenimiento(),
          mantenimientosService.getEstadosSenal(),
          mantenimientosService.getTiposFalla()
        ]);
        
        if (tiposRes.success) setTiposMantenimiento(tiposRes.data);
        if (estadosRes.success) setEstadosSenal(estadosRes.data);
        if (fallasRes.success) setTiposFalla(fallasRes.data);
      } catch (error) {
        console.error('Error cargando catálogos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCatalogos();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
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

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.length > 2) {
      try {
        const results = await mantenimientosService.search(term);
        console.log('Resultados de búsqueda:', results);
        // Aquí puedes mostrar los resultados
      } catch (error) {
        console.error('Error en búsqueda:', error);
      }
    }
  };

  const handleGoBack = (): void => {
    window.history.back();
  };

  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.id_tipo_mant) newErrors.id_tipo_mant = 'El tipo de mantenimiento es requerido';
    if (!formData.fecha_inicio) newErrors.fecha_inicio = 'La fecha de inicio es requerida';
    if (!formData.id_estado_senal) newErrors.id_estado_senal = 'El estado es requerido';
    if (!formData.trabajo_realizado) newErrors.trabajo_realizado = 'La descripción del trabajo realizado es requerida';
    
    // Validar que fecha final no sea menor que fecha inicio
    if (formData.fecha_inicio && formData.fecha_finalizacion) {
      if (new Date(formData.fecha_finalizacion) < new Date(formData.fecha_inicio)) {
        newErrors.fecha_finalizacion = 'La fecha de finalización no puede ser anterior a la fecha de inicio';
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
        // Preparar datos para enviar al backend
        const dataToSend = {
          id_tipo_mant: formData.id_tipo_mant,
          ident_mantenimiento: formData.ident_mantenimiento,
          fecha_inicio: formData.fecha_inicio,
          fecha_finalizacion: formData.fecha_finalizacion,
          tiempo_empleado: formData.tiempo_empleado || 0,
          aseguro: formData.aseguro,
          id_estado_senal: formData.id_estado_senal,
          trabajo_realizado: formData.trabajo_realizado,
          costo_mn: formData.costo_mn || 0,
          costo_mlc: formData.costo_mlc || 0,
          diesel_lit: formData.diesel_lit || 0,
          gasolina_lit: formData.gasolina_lit || 0,
          informa: formData.informa,
          transmite: formData.transmite,
          rg: formData.rg,
          orden: formData.orden,
          introdujo: formData.introdujo
        };

        console.log('Enviando datos:', dataToSend);
        
        const response = await mantenimientosService.create(dataToSend);
        
        if (response.success) {
          alert('✅ Mantenimiento registrado con éxito');
          handleReset();
        } else {
          alert('❌ Error al guardar: ' + response.message);
        }
      } catch (error: any) {
        console.error('Error detallado:', error);
        alert('❌ Error al conectar con el servidor: ' + (error.message || 'Error desconocido'));
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setErrors(newErrors);
    }
  };

  const handleReset = (): void => {
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
    setSearchTerm('');
  };

  // Función para cargar datos automáticos de la falla
  const loadFallaData = (): void => {
    // Aquí puedes implementar la lógica para buscar una falla por ID
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

  const inputClassName = (fieldName: string): string => {
    const baseClasses = "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";
    return hasError(fieldName)
      ? `${baseClasses} border-red-500 focus:ring-red-500`
      : `${baseClasses} border-gray-300`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando catálogos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-8">
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
              placeholder="Buscar mantenimientos por ID, tipo, responsable..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Header - Cambiado de verde a azul */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-800 px-6 py-5">
            <h1 className="text-2xl font-bold text-white flex items-center">
              <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Formulario de Mantenimientos
            </h1>
            <p className="text-blue-200 text-sm mt-2">
              Registre y gestione las actividades de mantenimiento de las señales marítimas
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 lg:p-8">
            <div className="space-y-8">
              {/* Información General del Mantenimiento */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Información General del Mantenimiento
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Tipo de Mantenimiento */}
                  <div className="space-y-2">
                    <label htmlFor="id_tipo_mant" className="block text-sm font-medium text-gray-700">
                      Tipo de Mantenimiento <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="id_tipo_mant"
                      name="id_tipo_mant"
                      value={formData.id_tipo_mant}
                      onChange={handleChange}
                      className={inputClassName('id_tipo_mant')}
                    >
                      <option value="">Seleccione tipo</option>
                      {tiposMantenimiento.map(m => (
                        <option key={m.id} value={m.id}>{m.nombre}</option>
                      ))}
                    </select>
                    {errors.id_tipo_mant && <p className="text-red-500 text-xs mt-1">{errors.id_tipo_mant}</p>}
                  </div>

                  {/* ID Mantenimiento */}
                  <div className="space-y-2">
                    <label htmlFor="ident_mantenimiento" className="block text-sm font-medium text-gray-700">
                      Identificador Mantenimiento
                    </label>
                    <input
                      id="ident_mantenimiento"
                      type="text"
                      name="ident_mantenimiento"
                      value={formData.ident_mantenimiento}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ID del mantenimiento"
                    />
                  </div>

                  {/* Estado de Señal */}
                  <div className="space-y-2">
                    <label htmlFor="id_estado_senal" className="block text-sm font-medium text-gray-700">
                      Estado de la Señal <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="id_estado_senal"
                      name="id_estado_senal"
                      value={formData.id_estado_senal}
                      onChange={handleChange}
                      className={inputClassName('id_estado_senal')}
                    >
                      <option value="">Seleccione estado</option>
                      {estadosSenal.map(est => (
                        <option key={est.id} value={est.id}>{est.nombre}</option>
                      ))}
                    </select>
                    {errors.id_estado_senal && <p className="text-red-500 text-xs mt-1">{errors.id_estado_senal}</p>}
                  </div>

                  {/* Tipo de falla y causa */}
                  <div className="lg:col-span-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="tipoFallaCausa" className="block text-sm font-medium text-gray-700">
                        Tipo de Falla y Causa
                      </label>
                      <button
                        type="button"
                        onClick={loadFallaData}
                        className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
                      >
                        Cargar datos de la falla
                      </button>
                    </div>
                    <textarea
                      id="tipoFallaCausa"
                      name="tipoFallaCausa"
                      value={formData.tipoFallaCausa}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Descripción de la falla y su causa (se puede cargar automáticamente)"
                    />
                  </div>
                </div>
              </div>

              {/* Fechas y Tiempos */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Fechas y Tiempos
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Fecha Inicio */}
                  <div className="space-y-2">
                    <label htmlFor="fecha_inicio" className="block text-sm font-medium text-gray-700">
                      Fecha Inicio <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="fecha_inicio"
                      type="datetime-local"
                      name="fecha_inicio"
                      value={formData.fecha_inicio}
                      onChange={handleChange}
                      className={inputClassName('fecha_inicio')}
                    />
                    {errors.fecha_inicio && <p className="text-red-500 text-xs mt-1">{errors.fecha_inicio}</p>}
                  </div>

                  {/* Fecha Finalización */}
                  <div className="space-y-2">
                    <label htmlFor="fecha_finalizacion" className="block text-sm font-medium text-gray-700">
                      Fecha Finalización
                    </label>
                    <input
                      id="fecha_finalizacion"
                      type="datetime-local"
                      name="fecha_finalizacion"
                      value={formData.fecha_finalizacion}
                      onChange={handleChange}
                      className={inputClassName('fecha_finalizacion')}
                    />
                    {errors.fecha_finalizacion && <p className="text-red-500 text-xs mt-1">{errors.fecha_finalizacion}</p>}
                  </div>

                  {/* Tiempo Empleado */}
                  <div className="space-y-2">
                    <label htmlFor="tiempo_empleado" className="block text-sm font-medium text-gray-700">
                      Tiempo Empleado (horas)
                    </label>
                    <input
                      id="tiempo_empleado"
                      type="number"
                      name="tiempo_empleado"
                      value={formData.tiempo_empleado}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.5"
                      placeholder="Horas trabajadas"
                    />
                  </div>

                  {/* Aseguro */}
                  <div className="space-y-2">
                    <label htmlFor="aseguro" className="block text-sm font-medium text-gray-700">
                      Aseguró
                    </label>
                    <input
                      id="aseguro"
                      type="text"
                      name="aseguro"
                      value={formData.aseguro}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Quién aseguró el trabajo"
                    />
                  </div>
                </div>
              </div>

              {/* Trabajo Realizado */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Trabajo Realizado
                </h2>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="trabajo_realizado" className="block text-sm font-medium text-gray-700">
                      Descripción del Trabajo <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="trabajo_realizado"
                      name="trabajo_realizado"
                      value={formData.trabajo_realizado}
                      onChange={handleChange}
                      rows={4}
                      className={inputClassName('trabajo_realizado')}
                      placeholder="Describa detalladamente el trabajo realizado durante el mantenimiento..."
                    />
                    {errors.trabajo_realizado && <p className="text-red-500 text-xs mt-1">{errors.trabajo_realizado}</p>}
                  </div>
                </div>
              </div>

              {/* Costos y Consumibles */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Costos y Consumibles
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Costo MN */}
                  <div className="space-y-2">
                    <label htmlFor="costo_mn" className="block text-sm font-medium text-gray-700">
                      Costo MN
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        id="costo_mn"
                        type="number"
                        name="costo_mn"
                        value={formData.costo_mn}
                        onChange={handleChange}
                        className="w-full pl-8 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Costo MLC */}
                  <div className="space-y-2">
                    <label htmlFor="costo_mlc" className="block text-sm font-medium text-gray-700">
                      Costo MLC
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        id="costo_mlc"
                        type="number"
                        name="costo_mlc"
                        value={formData.costo_mlc}
                        onChange={handleChange}
                        className="w-full pl-8 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Diesel L */}
                  <div className="space-y-2">
                    <label htmlFor="diesel_lit" className="block text-sm font-medium text-gray-700">
                      Diesel (L)
                    </label>
                    <input
                      id="diesel_lit"
                      type="number"
                      name="diesel_lit"
                      value={formData.diesel_lit}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.1"
                      placeholder="Litros"
                    />
                  </div>

                  {/* Gasolina L */}
                  <div className="space-y-2">
                    <label htmlFor="gasolina_lit" className="block text-sm font-medium text-gray-700">
                      Gasolina (L)
                    </label>
                    <input
                      id="gasolina_lit"
                      type="number"
                      name="gasolina_lit"
                      value={formData.gasolina_lit}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.1"
                      placeholder="Litros"
                    />
                  </div>
                </div>
              </div>

              {/* Responsables y Control */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Responsables y Control
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Informa */}
                  <div className="space-y-2">
                    <label htmlFor="informa" className="block text-sm font-medium text-gray-700">
                      Informa
                    </label>
                    <input
                      id="informa"
                      type="text"
                      name="informa"
                      value={formData.informa}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Quién informa"
                    />
                  </div>

                  {/* Transmite */}
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

                  {/* RG */}
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
                      placeholder="Número RG"
                    />
                  </div>

                  {/* Orden */}
                  <div className="space-y-2">
                    <label htmlFor="orden" className="block text-sm font-medium text-gray-700">
                      Orden
                    </label>
                    <input
                      id="orden"
                      type="text"
                      name="orden"
                      value={formData.orden}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Número de orden"
                    />
                  </div>

                  {/* Introdujo */}
                  <div className="space-y-2">
                    <label htmlFor="introdujo" className="block text-sm font-medium text-gray-700">
                      Introdujo
                    </label>
                    <input
                      id="introdujo"
                      type="text"
                      name="introdujo"
                      value={formData.introdujo}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Quién introdujo"
                    />
                  </div>
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
                  'Guardar Mantenimiento'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormMantenimientos;