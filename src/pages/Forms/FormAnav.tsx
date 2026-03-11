import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { senalesService } from '../../services/api/senalesApi';
import { Senal, CatalogoItem, Equipamiento } from '../../types/senales.types';

interface FormANAVProps {
  senalId?: string; // Para edición
  onSuccess?: () => void;
}

const FormANAV: React.FC<FormANAVProps> = ({ senalId, onSuccess }) => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('basicos');

  // Estados para catálogos
  const [catalogos, setCatalogos] = useState({
    tipos: [] as CatalogoItem[],
    categorias: [] as CatalogoItem[],
    modelos: [] as CatalogoItem[],
    empresas: [] as CatalogoItem[],
    estaciones: [] as CatalogoItem[],
    usuariosNavegacion: [] as CatalogoItem[],
    zonas: [] as CatalogoItem[],
    estados: [] as CatalogoItem[],
    materiales: [] as CatalogoItem[],
    energias: [] as CatalogoItem[],
    colores: [] as CatalogoItem[],
    formas: [] as CatalogoItem[],
    mares: [] as CatalogoItem[],
    coloresLuz: [] as CatalogoItem[],
    marcasTope: [] as CatalogoItem[],
    caracteristicas: [] as CatalogoItem[],
    tiposEquipamiento: [] as CatalogoItem[]
  });

  // Estado del formulario
  const [formData, setFormData] = useState<Partial<Senal>>({
    nombre: '',
    lumínica: false,
    secreta: false,
    reflector_radar: false,
    repetición: false,
    control_distancia: false,
    observaciones: ''
  });

  // Estado para equipamientos
  const [equipamientos, setEquipamientos] = useState<Equipamiento[]>([]);
  const [nuevoEquipamiento, setNuevoEquipamiento] = useState<Partial<Equipamiento>>({
    nombre: '',
    cantidad: 1,
    num_inventario: ''
  });

  // Cargar catálogos y datos de la señal si es edición
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Cargar todos los catálogos
        const data = await senalesService.getCatalogos();
        setCatalogos(data);

        // Si es edición, cargar datos de la señal
        if (senalId) {
          const senalData = await senalesService.getSenalById(senalId);
          setFormData(senalData);
          if (senalData.equipamientos) {
            setEquipamientos(senalData.equipamientos);
          }
        }

        setError(null);
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError('Error al cargar los datos. Por favor, intente de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [senalId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e as React.ChangeEvent<HTMLInputElement>).target.checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value ? parseFloat(value) : undefined }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEquipamientoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setNuevoEquipamiento(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setNuevoEquipamiento(prev => ({ ...prev, [name]: value }));
    }
  };

  const agregarEquipamiento = () => {
    if (nuevoEquipamiento.nombre && nuevoEquipamiento.id_tipo_equipamiento) {
      setEquipamientos(prev => [...prev, nuevoEquipamiento as Equipamiento]);
      setNuevoEquipamiento({
        nombre: '',
        cantidad: 1,
        num_inventario: ''
      });
    }
  };

  const quitarEquipamiento = (index: number) => {
    setEquipamientos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);

      // Agregar metadata
      const dataToSend = {
        ...formData,
        equipamientos,
        createat: new Date().toISOString(),
        createby: authState.usuario?.usuario,
        updateat: new Date().toISOString(),
        updateby: authState.usuario?.usuario
      };

      let response;
      if (senalId) {
        response = await senalesService.updateSenal(senalId, dataToSend);
      } else {
        response = await senalesService.createSenal(dataToSend);
      }

      if (response.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        
        // Resetear formulario si es creación
        if (!senalId) {
          setFormData({
            nombre: '',
            lumínica: false,
            secreta: false,
            reflector_radar: false,
            repetición: false,
            control_distancia: false,
            observaciones: ''
          });
          setEquipamientos([]);
        }
        
        if (onSuccess) onSuccess();
      } else {
        setError(response.message || 'Error al guardar la señal');
      }
    } catch (err) {
      console.error('Error guardando:', err);
      setError('Error al guardar la señal. Por favor, intente de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const renderSelect = (label: string, name: string, options: CatalogoItem[], required?: boolean) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        name={name}
        value={formData[name as keyof Senal] as string || ''}
        onChange={handleChange}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Seleccione...</option>
        {options.map(opt => (
          <option key={opt.id} value={opt.id}>{opt.nombre}</option>
        ))}
      </select>
    </div>
  );

  const renderInput = (label: string, name: string, type: string = 'text', required?: boolean) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={formData[name as keyof Senal] as string || ''}
        onChange={handleChange}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );

  const renderCheckbox = (label: string, name: string) => (
    <label className="flex items-center space-x-2">
      <input
        type="checkbox"
        name={name}
        checked={formData[name as keyof Senal] as boolean || false}
        onChange={handleChange}
        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );

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
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-6 py-5">
            <h1 className="text-2xl font-bold text-white">
              {senalId ? 'Editar Señal' : 'Nueva Señal'}
            </h1>
          </div>

          {/* Mensajes de éxito/error */}
          {success && (
            <div className="mx-6 mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              Señal guardada exitosamente
            </div>
          )}
          
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Tabs de navegación */}
          <div className="border-b border-gray-200 px-6">
            <nav className="flex space-x-8">
              {['basicos', 'ubicacion', 'caracteristicas', 'equipamiento'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab === 'basicos' ? 'Datos Básicos' :
                   tab === 'ubicacion' ? 'Ubicación' :
                   tab === 'caracteristicas' ? 'Características Técnicas' : 'Equipamiento'}
                </button>
              ))}
            </nav>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Pestaña Datos Básicos */}
            {activeTab === 'basicos' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderInput('Nombre de la Señal', 'nombre', 'text', true)}
                  {renderSelect('Tipo de Señal', 'id_tipo', catalogos.tipos, true)}
                  {renderSelect('Categoría', 'id_categoria', catalogos.categorias)}
                  {renderSelect('Modelo', 'id_modelo', catalogos.modelos)}
                  {renderSelect('Empresa', 'id_empresa', catalogos.empresas)}
                  {renderSelect('Estación', 'id_estacion', catalogos.estaciones)}
                  {renderSelect('Usuario Navegación', 'id_usuario_navegacion', catalogos.usuariosNavegacion)}
                  {renderSelect('Zona', 'id_zona', catalogos.zonas)}
                  {renderSelect('Estado', 'id_estado', catalogos.estados)}
                  {renderSelect('Material', 'id_material', catalogos.materiales)}
                  {renderSelect('Energía', 'id_energia', catalogos.energias)}
                  {renderInput('Monitoreo', 'monitoreo')}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {renderCheckbox('Lumínica', 'lumínica')}
                  {renderCheckbox('Secreta', 'secreta')}
                  {renderCheckbox('Reflector Radar', 'reflector_radar')}
                  {renderCheckbox('Repetición', 'repetición')}
                  {renderCheckbox('Control Distancia', 'control_distancia')}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    name="observaciones"
                    value={formData.observaciones || ''}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Observaciones adicionales..."
                  />
                </div>
              </div>
            )}

            {/* Pestaña Ubicación */}
            {activeTab === 'ubicacion' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderSelect('Mar', 'id_mar', catalogos.mares)}
                  {renderInput('Ubicación', 'ubicación')}
                  {renderInput('Latitud', 'latitud', 'number')}
                  {renderInput('Longitud', 'longitud', 'number')}
                  {renderInput('Altura (m)', 'altura', 'number')}
                  {renderInput('Elevación (m)', 'elevación', 'number')}
                  {renderInput('Profundidad (m)', 'profundidad', 'number')}
                </div>
              </div>
            )}

            {/* Pestaña Características Técnicas */}
            {activeTab === 'caracteristicas' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {renderSelect('Color', 'id_color', catalogos.colores)}
                  {renderSelect('Forma', 'id_forma', catalogos.formas)}
                  {renderSelect('Color de Luz', 'id_colorluz', catalogos.coloresLuz)}
                  {renderSelect('Característica', 'id_caracteristica', catalogos.caracteristicas)}
                  {renderSelect('Marca de Tope', 'id_marca_tope', catalogos.marcasTope)}
                  {renderInput('Alcance Geográfico (m)', 'alcancegeografico', 'number')}
                  {renderInput('Alcance Lumínico (m)', 'alcanceluminico', 'number')}
                  {renderInput('Intensidad Lumínica', 'intensidadluminica', 'number')}
                  {renderInput('Período (s)', 'periodo', 'number')}
                  {renderInput('Oscuridad (s)', 'oscuridad', 'number')}
                  {renderInput('Tiempo Luz (s)', 'tiempoluz', 'number')}
                  {renderInput('Potencia Bombillo (W)', 'potenciabombillo', 'number')}
                  {renderInput('Voltage Bombillo (V)', 'voltagebombillo', 'number')}
                  {renderInput('Consumo Destellador', 'consumodestellador', 'number')}
                </div>
              </div>
            )}

            {/* Pestaña Equipamiento */}
            {activeTab === 'equipamiento' && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Agregar Equipamiento</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {renderSelect('Tipo', 'id_tipo_equipamiento', catalogos.tiposEquipamiento)}
                    <input
                      type="text"
                      name="nombre"
                      value={nuevoEquipamiento.nombre || ''}
                      onChange={handleEquipamientoChange}
                      placeholder="Nombre del equipo"
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      name="cantidad"
                      value={nuevoEquipamiento.cantidad || 1}
                      onChange={handleEquipamientoChange}
                      placeholder="Cantidad"
                      min="1"
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      name="num_inventario"
                      value={nuevoEquipamiento.num_inventario || ''}
                      onChange={handleEquipamientoChange}
                      placeholder="N° Inventario"
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={agregarEquipamiento}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Agregar Equipamiento
                  </button>
                </div>

                {/* Lista de equipamientos */}
                {equipamientos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Equipamientos Asignados</h3>
                    <div className="space-y-2">
                      {equipamientos.map((eq, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{eq.nombre}</p>
                            <p className="text-sm text-gray-600">
                              Cantidad: {eq.cantidad} | Inventario: {eq.num_inventario}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => quitarEquipamiento(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Botones de acción */}
            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
              >
                {saving ? 'Guardando...' : senalId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormANAV;