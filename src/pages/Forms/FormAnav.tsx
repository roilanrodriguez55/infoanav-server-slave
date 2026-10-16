import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  Save,
  X,
  Plus,
  Trash2,
  Anchor,
  Loader2
} from 'lucide-react';
import { senalesService, type TipoEquipamiento } from '@/services/api/senalesApi';
import { CommandSelect } from '@/components/ui/CommandSelect';

// Interfaces para los tipos de datos
interface CatalogoItem {
  id: string;
  nombre: string;
}

interface EquipamientoItem {
  id?: string;
  id_tipo_equipamiento: string;
  nombre: string;
  cantidad: number;
  num_inventario: string;
}

// Interface para el sistema de fondeo
interface SistemaFondeo {
  no_serie_flotador?: string;
  cadenas: { diametro: string; cantidad: number }[];
  pesos_muertos: { peso: string; cantidad: number }[];
  bridas: { tipo: string; cantidad: number }[];
  grectos: { tipo: string; cantidad: number; giratorio: boolean }[];
}

// Interface para el estado del formulario
interface FormDataState {
  codigo_lsm: string;
  id_tipo: string;
  id_categoria: string;
  nombre: string;
  id_modelo: string;
  id_estacion: string;
  luminica: boolean;
  secreta: boolean;
  fecha_instalacion: string;
  id_usuario_navegacion: string;
  monitoreo: string;
  id_zona: string;
  reflector_radar: boolean;
  repeticion: boolean;
  id_estado: string;
  id_material: string;
  control_distancia: boolean;
  id_energia: string;
  id_marca_tope: string;
  observaciones: string;
  id_color: string;
  id_forma: string;
  altura: string;
  elevacion: string;
  profundidad: string;
  alcancegeografico: string;
  latitud: string;
  longitud: string;
  id_mar: string;
  ubicacion: string;
  alcanceluminico: string;
  intensidadluminica: string;
  id_colorluz: string;
  id_caracteristica: string;
  periodo: string;
  oscuridad: string;
  tiempoluz: string;
  potenciabombillo: string;
  voltagebombillo: string;
  consumodestellador: string;
  id_equipamiento: string;

  sistema_fondeo: string;
}

const FormANAV = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  // Estados para carga de datos
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para catálogos
  const [tipos, setTipos] = useState<CatalogoItem[]>([]);
  const [categorias, setCategorias] = useState<CatalogoItem[]>([]);
  const [modelos, setModelos] = useState<CatalogoItem[]>([]);
  const [estaciones, setEstaciones] = useState<CatalogoItem[]>([]);
  const [usuarios, setUsuarios] = useState<CatalogoItem[]>([]);
  const [zonas, setZonas] = useState<CatalogoItem[]>([]);
  const [estados, setEstados] = useState<CatalogoItem[]>([]);
  const [materiales, setMateriales] = useState<CatalogoItem[]>([]);
  const [energias, setEnergias] = useState<CatalogoItem[]>([]);
  const [marcasTope, setMarcasTope] = useState<CatalogoItem[]>([]);
  const [colores, setColores] = useState<CatalogoItem[]>([]);
  const [formas, setFormas] = useState<CatalogoItem[]>([]);
  const [mares, setMares] = useState<CatalogoItem[]>([]);
  const [coloresLuz, setColoresLuz] = useState<CatalogoItem[]>([]);
  const [caracteristicas, setCaracteristicas] = useState<CatalogoItem[]>([]);
  const [tiposEquipamiento, setTiposEquipamiento] = useState<TipoEquipamiento[]>([]);

  // Estado para la empresa del usuario (sin endpoint en PostgREST, usar null)
  const [empresaUsuario, setEmpresaUsuario] = useState<{ id: string; nombre: string } | null>(null);

  // Estados para búsqueda
  // const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('generales');

  // Estados del formulario
  const [formData, setFormData] = useState<FormDataState>({
    codigo_lsm: '',
    id_tipo: '',
    id_categoria: '',
    nombre: '',
    id_modelo: '',
    id_estacion: '',
    luminica: true,
    secreta: false,
    fecha_instalacion: '',
    id_usuario_navegacion: '',
    monitoreo: '',
    id_zona: '',
    reflector_radar: false,
    repeticion: false,
    id_estado: '',
    id_material: '',
    control_distancia: false,
    id_energia: '',
    id_marca_tope: '',
    observaciones: '',
    id_color: '',
    id_forma: '',
    altura: '',
    elevacion: '',
    profundidad: '',
    alcancegeografico: '',
    latitud: '',
    longitud: '',
    id_mar: '',
    ubicacion: '',
    alcanceluminico: '',
    intensidadluminica: '',
    id_colorluz: '',
    id_caracteristica: '',
    periodo: '',
    oscuridad: '',
    tiempoluz: '',
    potenciabombillo: '',
    voltagebombillo: '',
    consumodestellador: '',
    id_equipamiento: '',

    sistema_fondeo: ''
  });

  // Estado para el equipamiento
  const [equipamiento, setEquipamiento] = useState<EquipamientoItem[]>([
    { id_tipo_equipamiento: '', nombre: '', cantidad: 1, num_inventario: '' }
  ]);

  // Estados para el sistema de fondeo
  const [noSerieFlotador, setNoSerieFlotador] = useState('');
  const [cadenas, setCadenas] = useState([{ diametro: '', cantidad: 1 }]);
  const [pesosMuertos, setPesosMuertos] = useState([{ peso: '', cantidad: 1 }]);
  const [bridas, setBridas] = useState([{ tipo: '', cantidad: 1 }]);
  const [grectos, setGrectos] = useState([{ tipo: '', cantidad: 1, giratorio: false }]);

  // Detectar si es boya o faro
  const esBoya = formData.id_tipo && tipos.find(t => t.id === formData.id_tipo)?.nombre?.toLowerCase() === 'boya';
  const esFaro = formData.id_tipo && ['faro', 'farola'].includes(tipos.find(t => t.id === formData.id_tipo)?.nombre?.toLowerCase() ?? '');

  // Actualizar sistema_fondeo cuando cambian los datos de fondeo
  useEffect(() => {
    if (esBoya) {
      const fondeoData: SistemaFondeo = {
        no_serie_flotador: noSerieFlotador,
        cadenas,
        pesos_muertos: pesosMuertos,
        bridas,
        grectos
      };
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza sistema_fondeo con el estado derivado de fondeo
      setFormData(prev => ({
        ...prev,
        sistema_fondeo: JSON.stringify(fondeoData)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        sistema_fondeo: ''
      }));
    }
  }, [noSerieFlotador, cadenas, pesosMuertos, bridas, grectos, esBoya]);

  // Cargar la empresa del usuario (no disponible en PostgREST directamente, usar null para crear sin empresa)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sin endpoint de empresa en PostgREST, el valor es siempre null
    setEmpresaUsuario(null);
  }, []);

  // Cargar todos los catálogos
  useEffect(() => {
    const loadCatalogos = async () => {
      setLoading(true);
      setError(null);

      try {
        const catalogos = await senalesService.getCatalogos();

        setTipos(catalogos.tipos ?? []);
        setCategorias(catalogos.categorias ?? []);
        setModelos(catalogos.modelos ?? []);
        setEstaciones(catalogos.estaciones ?? []);
        setUsuarios(catalogos.usuariosNavegacion ?? []);
        setZonas(catalogos.zonas ?? []);
        setEstados(catalogos.estados ?? []);
        setMateriales(catalogos.materiales ?? []);
        setEnergias(catalogos.energias ?? []);
        setMarcasTope(catalogos.marcasTope ?? []);
        setColores(catalogos.colores ?? []);
        setFormas(catalogos.formas ?? []);
        setMares(catalogos.mares ?? []);
        setColoresLuz(catalogos.coloresLuz ?? []);
        setCaracteristicas(catalogos.caracteristicas ?? []);
        setTiposEquipamiento(catalogos.tiposEquipamiento ?? []);

      } catch (err: unknown) {
        console.error('Error cargando catálogos:', err);
        const message = err instanceof Error ? err.message : 'Error al cargar los datos';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadCatalogos();
  }, []);

  // Cargar datos de la señal si estamos editando
  useEffect(() => {
    const loadSenal = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await senalesService.getSenalById(id);

        if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
          const data = response.data[0];

          const formatDateForInput = (dateStr?: string) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return date.toISOString().slice(0, 16);
          };

          setFormData({
            codigo_lsm: data.codigo_lsm ?? '',
            id_tipo: data.id_tipo ?? '',
            id_categoria: data.id_categoria ?? '',
            nombre: data.nombre ?? '',
            id_modelo: data.id_modelo ?? '',
            id_estacion: data.id_estacion ?? '',
            luminica: data.luminica ?? true,
            secreta: data.secreta ?? false,
            fecha_instalacion: formatDateForInput(data.fecha_instalacion),
            id_usuario_navegacion: data.id_usuario_navegacion ?? '',
            monitoreo: data.monitoreo ?? '',
            id_zona: data.id_zona ?? '',
            reflector_radar: data.reflector_radar ?? false,
            repeticion: data.repeticion ?? false,
            id_estado: data.id_estado ?? '',
            id_material: data.id_material ?? '',
            control_distancia: data.control_distancia ?? false,
            id_energia: data.id_energia ?? '',
            id_marca_tope: data.id_marca_tope ?? '',
            observaciones: data.observaciones ?? '',
            id_color: data.id_color ?? '',
            id_forma: data.id_forma ?? '',
            altura: data.altura?.toString() ?? '',
            elevacion: data.elevacion?.toString() ?? '',
            profundidad: data.profundidad?.toString() ?? '',
            alcancegeografico: data.alcancegeografico?.toString() ?? '',
            latitud: data.latitud?.toString() ?? '',
            longitud: data.longitud?.toString() ?? '',
            id_mar: data.id_mar ?? '',
            ubicacion: data.ubicacion ?? '',
            alcanceluminico: data.alcanceluminico?.toString() ?? '',
            intensidadluminica: data.intensidadluminica?.toString() ?? '',
            id_colorluz: data.id_colorluz ?? '',
            id_caracteristica: data.id_caracteristica ?? '',
            periodo: data.periodo?.toString() ?? '',
            oscuridad: data.oscuridad?.toString() ?? '',
            tiempoluz: data.tiempoluz?.toString() ?? '',
            potenciabombillo: data.potenciabombillo?.toString() ?? '',
            voltagebombillo: data.voltagebombillo?.toString() ?? '',
            consumodestellador: data.consumodestellador?.toString() ?? '',
            id_equipamiento: data.id_equipamiento ?? '',

            sistema_fondeo: data.sistema_fondeo ?? ''
          });

          if (data.sistema_fondeo) {
            try {
              const fondeoData: SistemaFondeo = JSON.parse(data.sistema_fondeo);
              setNoSerieFlotador(fondeoData.no_serie_flotador ?? '');
              setCadenas(fondeoData.cadenas ?? [{ diametro: '', cantidad: 1 }]);
              setPesosMuertos(fondeoData.pesos_muertos ?? [{ peso: '', cantidad: 1 }]);
              setBridas(fondeoData.bridas ?? [{ tipo: '', cantidad: 1 }]);
              setGrectos(fondeoData.grectos ?? [{ tipo: '', cantidad: 1, giratorio: false }]);
            } catch (e) {
              console.warn('Error parseando sistema_fondeo:', e);
            }
          }
        }
      } catch (error) {
        console.error('Error cargando señal:', error);
        alert('Error al cargar los datos de la señal');
      } finally {
        setLoading(false);
      }
    };

    if (isEditing) {
      void loadSenal();
    }
  }, [id, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Funciones para equipamiento
  const agregarEquipamiento = () => {
    setEquipamiento([...equipamiento, { id_tipo_equipamiento: '', nombre: '', cantidad: 1, num_inventario: '' }]);
  };

  const eliminarEquipamiento = (index: number) => {
    if (equipamiento.length > 1) {
      const nuevoEquipamiento = equipamiento.filter((_, i) => i !== index);
      setEquipamiento(nuevoEquipamiento);
    }
  };

  const actualizarEquipamiento = (index: number, campo: keyof EquipamientoItem, valor: string | number) => {
    const nuevoEquipamiento = [...equipamiento];
    nuevoEquipamiento[index] = { ...nuevoEquipamiento[index], [campo]: valor };
    setEquipamiento(nuevoEquipamiento);
  };

  // Funciones para arrays de fondeo
  const agregarCadena = () => {
    setCadenas([...cadenas, { diametro: '', cantidad: 1 }]);
  };

  const eliminarCadena = (index: number) => {
    setCadenas(cadenas.filter((_, i) => i !== index));
  };

  const actualizarCadena = (index: number, campo: string, valor: string | number) => {
    const nuevasCadenas = [...cadenas];
    nuevasCadenas[index] = { ...nuevasCadenas[index], [campo]: valor };
    setCadenas(nuevasCadenas);
  };

  const agregarPesoMuerto = () => {
    setPesosMuertos([...pesosMuertos, { peso: '', cantidad: 1 }]);
  };

  const eliminarPesoMuerto = (index: number) => {
    setPesosMuertos(pesosMuertos.filter((_, i) => i !== index));
  };

  const actualizarPesoMuerto = (index: number, campo: string, valor: string | number) => {
    const nuevosPesos = [...pesosMuertos];
    nuevosPesos[index] = { ...nuevosPesos[index], [campo]: valor };
    setPesosMuertos(nuevosPesos);
  };

  const agregarBrida = () => {
    setBridas([...bridas, { tipo: '', cantidad: 1 }]);
  };

  const eliminarBrida = (index: number) => {
    setBridas(bridas.filter((_, i) => i !== index));
  };

  const actualizarBrida = (index: number, campo: string, valor: string | number) => {
    const nuevasBridas = [...bridas];
    nuevasBridas[index] = { ...nuevasBridas[index], [campo]: valor };
    setBridas(nuevasBridas);
  };

  const agregarGrecto = () => {
    setGrectos([...grectos, { tipo: '', cantidad: 1, giratorio: false }]);
  };

  const eliminarGrecto = (index: number) => {
    setGrectos(grectos.filter((_, i) => i !== index));
  };

  const actualizarGrecto = (index: number, campo: string, valor: string | number | boolean) => {
    const nuevosGrectos = [...grectos];
    nuevosGrectos[index] = { ...nuevosGrectos[index], [campo]: valor };
    setGrectos(nuevosGrectos);
  };

  // Funciones para búsqueda
  // const handleSearch = () => {
  //   if (searchTerm.length < 3) {
  //     alert('Ingrese al menos 3 caracteres para buscar');
  //     return;
  //   }
  //   setShowSearch(true);
  //   setSearchResults([
  //     { id: '1', nombre: 'Señal 1', tipo: 'Baliza', ubicacion: 'Ubicación 1' },
  //     { id: '2', nombre: 'Señal 2', tipo: 'Boya', ubicacion: 'Ubicación 2' }
  //   ]);
  // };

  // const clearSearch = () => {
  //   setSearchTerm('');
  //   setSearchResults([]);
  //   setShowSearch(false);
  // };

  const handleGoBack = () => {
    navigate('/gestion-senales');
  };

  const handleReset = () => {
    setFormData({
      codigo_lsm: '',
      id_tipo: '',
      id_categoria: '',
      nombre: '',
      id_modelo: '',
      id_estacion: '',
      luminica: true,
      secreta: false,
      fecha_instalacion: '',
      id_usuario_navegacion: '',
      monitoreo: '',
      id_zona: '',
      reflector_radar: false,
      repeticion: false,
      id_estado: '',
      id_material: '',
      control_distancia: false,
      id_energia: '',
      id_marca_tope: '',
      observaciones: '',
      id_color: '',
      id_forma: '',
      altura: '',
      elevacion: '',
      profundidad: '',
      alcancegeografico: '',
      latitud: '',
      longitud: '',
      id_mar: '',
      ubicacion: '',
      alcanceluminico: '',
      intensidadluminica: '',
      id_colorluz: '',
      id_caracteristica: '',
      periodo: '',
      oscuridad: '',
      tiempoluz: '',
      potenciabombillo: '',
      voltagebombillo: '',
      consumodestellador: '',
      id_equipamiento: '',
      sistema_fondeo: ''
    });
    setNoSerieFlotador('');
    setEquipamiento([{ id_tipo_equipamiento: '', nombre: '', cantidad: 1, num_inventario: '' }]);
    setCadenas([{ diametro: '', cantidad: 1 }]);
    setPesosMuertos([{ peso: '', cantidad: 1 }]);
    setBridas([{ tipo: '', cantidad: 1 }]);
    setGrectos([{ tipo: '', cantidad: 1, giratorio: false }]);
    navigate('/gestion-senales');
  };

  const validateForm = (): boolean => {
    if (!formData.codigo_lsm) {
      alert('El código LSM es requerido');
      return false;
    }
    if (!formData.nombre) {
      alert('El nombre es requerido');
      return false;
    }
    if (!formData.id_tipo) {
      alert('El tipo de señal es requerido');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const dataToSend: Record<string, string | number | boolean | null> = {
        codigo_lsm: formData.codigo_lsm,
        id_tipo: formData.id_tipo || null,
        id_categoria: formData.id_categoria || null,
        nombre: formData.nombre,
        id_modelo: formData.id_modelo || null,
        id_empresa: null,
        id_estacion: formData.id_estacion || null,
        luminica: formData.luminica,
        secreta: formData.secreta,
        fecha_instalacion: formData.fecha_instalacion ? new Date(formData.fecha_instalacion).toISOString() : null,
        id_usuario_navegacion: formData.id_usuario_navegacion || null,
        monitoreo: formData.monitoreo || null,
        id_zona: formData.id_zona || null,
        reflector_radar: formData.reflector_radar,
        repeticion: formData.repeticion,
        id_estado: formData.id_estado || null,
        id_material: formData.id_material || null,
        control_distancia: formData.control_distancia,
        id_energia: formData.id_energia || null,
        id_marca_tope: formData.id_marca_tope || null,
        observaciones: formData.observaciones || null,
        id_color: formData.id_color || null,
        id_forma: formData.id_forma || null,
        altura: formData.altura ? parseFloat(formData.altura) : null,
        elevacion: formData.elevacion ? parseFloat(formData.elevacion) : null,
        profundidad: formData.profundidad ? parseFloat(formData.profundidad) : null,
        alcancegeografico: formData.alcancegeografico ? parseFloat(formData.alcancegeografico) : null,
        latitud: formData.latitud ? parseFloat(formData.latitud) : null,
        longitud: formData.longitud ? parseFloat(formData.longitud) : null,
        id_mar: formData.id_mar || null,
        ubicacion: formData.ubicacion || null,
        alcanceluminico: formData.alcanceluminico ? parseFloat(formData.alcanceluminico) : null,
        intensidadluminica: formData.intensidadluminica ? parseFloat(formData.intensidadluminica) : null,
        id_colorluz: formData.id_colorluz || null,
        id_caracteristica: formData.id_caracteristica || null,
        periodo: formData.periodo ? parseFloat(formData.periodo) : null,
        oscuridad: formData.oscuridad ? parseFloat(formData.oscuridad) : null,
        tiempoluz: formData.tiempoluz ? parseFloat(formData.tiempoluz) : null,
        potenciabombillo: formData.potenciabombillo ? parseInt(formData.potenciabombillo) : null,
        voltagebombillo: formData.voltagebombillo ? parseInt(formData.voltagebombillo) : null,
        consumodestellador: formData.consumodestellador ? parseFloat(formData.consumodestellador) : null,
        id_equipamiento: formData.id_equipamiento || null,

        sistema_fondeo: formData.sistema_fondeo || null
      };

      if (isEditing) {
        dataToSend.updated_at = new Date().toISOString();
      } else {
        dataToSend.created_at = new Date().toISOString();
      }

      let response;
      if (isEditing) {
        response = await senalesService.updateSenal(id, dataToSend);
      } else {
        response = await senalesService.createSenal(dataToSend);
      }

      if (response.success) {
        alert(`✅ Señal ${isEditing ? 'actualizada' : 'guardada'} correctamente`);

        if (!isEditing && equipamiento.length > 0 && equipamiento[0].id_tipo_equipamiento) {
          const senalId = (response.data as { id_señal: string }[])[0].id_señal;
          for (const eq of equipamiento) {
            if (eq.id_tipo_equipamiento) {
              await senalesService.addEquipamiento(senalId, eq);
            }
          }
        }

        void navigate('/gestion-senales');
      } else {
        alert('❌ Error al guardar: ' + (response.message ?? 'Error desconocido'));
      }
    } catch (err: unknown) {
      console.error('❌ Error detallado:', err);

      let errorMessage = 'Error al conectar con el servidor';
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const errorObj = err as { response: { data: { message?: string } } };
        if (errorObj.response?.data?.message) {
          errorMessage = errorObj.response.data.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      alert(`❌ ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Cargando catálogos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
              Reintentar
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Barra superior con buscador */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="w-full sm:w-auto border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Regresar
          </Button>
        </div>

        <Card className="shadow-2xl border-blue-200 dark:border-gray-700 dark:bg-gray-800">
          {/* Header */}
          <CardHeader className="bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-t-xl dark:from-gray-800 dark:to-gray-900">
            <CardTitle className="text-2xl">
              {isEditing ? 'Editar Señal' : 'Nueva Señal'}
            </CardTitle>
            <CardDescription className="text-blue-100 dark:text-gray-300 text-sm mt-2">
              {isEditing ? 'Modifique los datos de la señal' : 'Registre una nueva señal en el sistema'}
            </CardDescription>
            {empresaUsuario && (
              <div className="mt-2 text-sm text-blue-200 dark:text-blue-300">
                Empresa asignada: <span className="font-semibold">{empresaUsuario.nombre}</span>
              </div>
            )}
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 lg:p-8">
              {/* Código LSM y Tipo de Señal juntos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 dark:bg-gray-700 dark:border-gray-600">
                <div className="space-y-2">
                  <Label htmlFor="codigo_lsm" className="text-blue-900 dark:text-gray-200 font-medium">
                    Código LSM <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="codigo_lsm"
                    name="codigo_lsm"
                    placeholder="Ingrese código LSM"
                    value={formData.codigo_lsm}
                    onChange={handleInputChange}
                    className="border-blue-200 h-11 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <CommandSelect
                    value={formData.id_tipo}
                    onValueChange={(value) => handleSelectChange('id_tipo', value)}
                    placeholder="Seleccionar tipo"
                    searchPlaceholder="Buscar tipo..."
                    emptyMessage="No se encontraron tipos"
                    items={tipos}
                    label="Tipo de Señal"
                    required
                  />
                </div>
                {esFaro && (
                  <div className="md:col-span-2 flex justify-end">
                    <span className="text-sm font-normal text-amber-600 bg-amber-100 px-3 py-1 rounded-full dark:text-amber-300 dark:bg-amber-900">
                      Modo Faro
                    </span>
                  </div>
                )}
              </div>

              {/* Tabs de navegación */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="grid grid-cols-5 bg-blue-100 dark:bg-gray-700">
                  <TabsTrigger
                    value="generales"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-600 dark:text-gray-300"
                  >
                    Datos Generales
                  </TabsTrigger>
                  <TabsTrigger
                    value="geograficos"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-600 dark:text-gray-300"
                  >
                    Datos Geográficos
                  </TabsTrigger>
                  <TabsTrigger
                    value="luminicos"
                    disabled={!formData.luminica}
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[disabled]:opacity-50 dark:data-[state=active]:bg-blue-600 dark:text-gray-300"
                  >
                    Datos Lumínicos
                  </TabsTrigger>
                  <TabsTrigger
                    value="equipamiento"
                    disabled={!formData.luminica}
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[disabled]:opacity-50 dark:data-[state=active]:bg-blue-600 dark:text-gray-300"
                  >
                    Equipamiento
                  </TabsTrigger>
                  <TabsTrigger
                    value="fondeo"
                    disabled={!esBoya}
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[disabled]:opacity-50 dark:data-[state=active]:bg-blue-600 dark:text-gray-300"
                  >
                    Sistema de Fondeo
                  </TabsTrigger>
                </TabsList>

                {/* Pestaña Datos Generales */}
                {activeTab === 'generales' && (
                  <div className="space-y-6 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Categoría */}
                      <div className="space-y-2">
                        <CommandSelect
                          value={formData.id_categoria}
                          onValueChange={(value) => handleSelectChange('id_categoria', value)}
                          placeholder="Seleccionar categoría"
                          searchPlaceholder="Buscar categoría..."
                          emptyMessage="No se encontraron categorías"
                          items={categorias}
                          label="Categoría"
                        />
                      </div>

                      {/* Modelo */}
                      <div className="space-y-2">
                        <CommandSelect
                          value={formData.id_modelo}
                          onValueChange={(value) => handleSelectChange('id_modelo', value)}
                          placeholder="Seleccionar modelo"
                          searchPlaceholder="Buscar modelo..."
                          emptyMessage="No se encontraron modelos"
                          items={modelos}
                          label="Modelo"
                        />
                      </div>

                      {/* Nombre */}
                      <div className="space-y-2">
                        <Label htmlFor="nombre" className="text-blue-900 dark:text-gray-200 font-medium">
                          Nombre <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="nombre"
                          name="nombre"
                          placeholder="Nombre de la señal"
                          value={formData.nombre}
                          onChange={handleInputChange}
                          className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                        />
                      </div>

                      {/* Estación */}
                      <div className="space-y-2">
                        <CommandSelect
                          value={formData.id_estacion}
                          onValueChange={(value) => handleSelectChange('id_estacion', value)}
                          placeholder="Seleccionar estación"
                          searchPlaceholder="Buscar estación..."
                          emptyMessage="No se encontraron estaciones"
                          items={estaciones}
                          label="Estación"
                        />
                      </div>

                      {/* Checkbox de Señalización Lumínica */}
                      <div className="flex items-center space-x-2 pt-6">
                        <Checkbox
                          id="luminica"
                          name="luminica"
                          checked={formData.luminica}
                          onCheckedChange={(checked) => handleCheckboxChange('luminica', checked as boolean)}
                          className="border-blue-400 text-blue-600 dark:border-gray-500 dark:bg-gray-700"
                        />
                        <Label htmlFor="luminica" className="cursor-pointer text-blue-900 dark:text-gray-200">
                          Señalización Lumínica
                        </Label>
                      </div>

                      {/* Fecha instalación */}
                      <div className="space-y-2">
                        <Label htmlFor="fecha_instalacion" className="text-blue-900 dark:text-gray-200 font-medium">Fecha de Instalación</Label>
                        <Input
                          id="fecha_instalacion"
                          name="fecha_instalacion"
                          type="datetime-local"
                          value={formData.fecha_instalacion}
                          onChange={handleInputChange}
                          className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      {/* Secreta */}
                      <div className="flex items-center space-x-2 pt-6">
                        <Checkbox
                          id="secreta"
                          name="secreta"
                          checked={formData.secreta}
                          onCheckedChange={(checked) => handleCheckboxChange('secreta', checked as boolean)}
                          className="border-blue-400 text-blue-600 dark:border-gray-500 dark:bg-gray-700"
                        />
                        <Label htmlFor="secreta" className="cursor-pointer text-blue-900 dark:text-gray-200">Secreta</Label>
                      </div>

                      {/* Usuario */}
                      <div className="space-y-2">
                        <CommandSelect
                          value={formData.id_usuario_navegacion}
                          onValueChange={(value) => handleSelectChange('id_usuario_navegacion', value)}
                          placeholder="Seleccionar usuario"
                          searchPlaceholder="Buscar usuario..."
                          emptyMessage="No se encontraron usuarios"
                          items={usuarios}
                          label="Usuario"
                        />
                      </div>

                      {/* Monitoreo */}
                      <div className="space-y-2">
                        <Label htmlFor="monitoreo" className="text-blue-900 dark:text-gray-200 font-medium">Monitoreo</Label>
                        <Input
                          id="monitoreo"
                          name="monitoreo"
                          placeholder="Tipo de monitoreo"
                          value={formData.monitoreo}
                          onChange={handleInputChange}
                          className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                        />
                      </div>

                      {/* Zona */}
                      <div className="space-y-2">
                        <CommandSelect
                          value={formData.id_zona}
                          onValueChange={(value) => handleSelectChange('id_zona', value)}
                          placeholder="Seleccionar zona"
                          searchPlaceholder="Buscar zona..."
                          emptyMessage="No se encontraron zonas"
                          items={zonas}
                          label="Zona"
                        />
                      </div>

                      {/* Reflector radar */}
                      <div className="flex items-center space-x-2 pt-6">
                        <Checkbox
                          id="reflector_radar"
                          name="reflector_radar"
                          checked={formData.reflector_radar}
                          onCheckedChange={(checked) => handleCheckboxChange('reflector_radar', checked as boolean)}
                          className="border-blue-400 text-blue-600 dark:border-gray-500 dark:bg-gray-700"
                        />
                        <Label htmlFor="reflector_radar" className="cursor-pointer text-blue-900 dark:text-gray-200">Reflector Radar</Label>
                      </div>

                      {/* Repetición */}
                      <div className="flex items-center space-x-2 pt-6">
                        <Checkbox
                          id="repeticion"
                          name="repeticion"
                          checked={formData.repeticion}
                          onCheckedChange={(checked) => handleCheckboxChange('repeticion', checked as boolean)}
                          className="border-blue-400 text-blue-600 dark:border-gray-500 dark:bg-gray-700"
                        />
                        <Label htmlFor="repeticion" className="cursor-pointer text-blue-900 dark:text-gray-200">Repetición</Label>
                      </div>

                      {/* Estado */}
                      <div className="space-y-2">
                        <CommandSelect
                          value={formData.id_estado}
                          onValueChange={(value) => handleSelectChange('id_estado', value)}
                          placeholder="Seleccionar estado"
                          searchPlaceholder="Buscar estado..."
                          emptyMessage="No se encontraron estados"
                          items={estados}
                          label="Estado de la señal"
                        />
                      </div>

                      {/* Material */}
                      <div className="space-y-2">
                        <CommandSelect
                          value={formData.id_material}
                          onValueChange={(value) => handleSelectChange('id_material', value)}
                          placeholder="Seleccionar material"
                          searchPlaceholder="Buscar material..."
                          emptyMessage="No se encontraron materiales"
                          items={materiales}
                          label="Material"
                        />
                      </div>

                      {/* Control a distancia */}
                      <div className="flex items-center space-x-2 pt-6">
                        <Checkbox
                          id="control_distancia"
                          name="control_distancia"
                          checked={formData.control_distancia}
                          onCheckedChange={(checked) => handleCheckboxChange('control_distancia', checked as boolean)}
                          className="border-blue-400 text-blue-600 dark:border-gray-500 dark:bg-gray-700"
                        />
                        <Label htmlFor="control_distancia" className="cursor-pointer text-blue-900 dark:text-gray-200">Control a distancia</Label>
                      </div>

                      {/* Energía */}
                      <div className="space-y-2">
                        <CommandSelect
                          value={formData.id_energia}
                          onValueChange={(value) => handleSelectChange('id_energia', value)}
                          placeholder="Seleccionar energía"
                          searchPlaceholder="Buscar energía..."
                          emptyMessage="No se encontraron energías"
                          items={energias}
                          label="Energía"
                        />
                      </div>

                      {/* Marca de tope */}
                      <div className="space-y-2">
                        <CommandSelect
                          value={formData.id_marca_tope}
                          onValueChange={(value) => handleSelectChange('id_marca_tope', value)}
                          placeholder="Seleccionar marca"
                          searchPlaceholder="Buscar marca..."
                          emptyMessage="No se encontraron marcas"
                          items={marcasTope}
                          label="Marca de tope"
                        />
                      </div>
                    </div>

                    {/* Observaciones */}
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="observaciones" className="text-blue-900 dark:text-gray-200 font-medium">Observaciones</Label>
                      <Textarea
                        id="observaciones"
                        name="observaciones"
                        placeholder="Observaciones adicionales..."
                        rows={3}
                        value={formData.observaciones}
                        onChange={handleInputChange}
                        className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>
                  </div>
                )}

                {/* Pestaña Datos Geográficos */}
                {activeTab === 'geograficos' && (
                  <div className="space-y-6 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Color */}
                      <div className="space-y-2">
                        <CommandSelect
                          value={formData.id_color}
                          onValueChange={(value) => handleSelectChange('id_color', value)}
                          placeholder="Seleccionar color"
                          searchPlaceholder="Buscar color..."
                          emptyMessage="No se encontraron colores"
                          items={colores}
                          label="Color"
                        />
                      </div>

                      {/* Forma */}
                      <div className="space-y-2">
                        <CommandSelect
                          value={formData.id_forma}
                          onValueChange={(value) => handleSelectChange('id_forma', value)}
                          placeholder="Seleccionar forma"
                          searchPlaceholder="Buscar forma..."
                          emptyMessage="No se encontraron formas"
                          items={formas}
                          label="Forma"
                        />
                      </div>

                      {/* Altura */}
                      <div className="space-y-2">
                        <Label htmlFor="altura" className="text-blue-900 dark:text-gray-200 font-medium">Altura (m)</Label>
                        <Input
                          id="altura"
                          name="altura"
                          type="number"
                          step="0.1"
                          value={formData.altura}
                          onChange={handleInputChange}
                          className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      {/* Elevación */}
                      <div className="space-y-2">
                        <Label htmlFor="elevación" className="text-blue-900 dark:text-gray-200 font-medium">Elevación (m)</Label>
                        <Input
                          id="elevación"
                          name="elevación"
                          type="number"
                          step="0.1"
                          value={formData.elevacion}
                          onChange={handleInputChange}
                          className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      {/* Profundidad */}
                      <div className="space-y-2">
                        <Label htmlFor="profundidad" className="text-blue-900 dark:text-gray-200 font-medium">Profundidad (m)</Label>
                        <Input
                          id="profundidad"
                          name="profundidad"
                          type="number"
                          step="0.1"
                          value={formData.profundidad}
                          onChange={handleInputChange}
                          className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      {/* Alcance Geográfico */}
                      <div className="space-y-2">
                        <Label htmlFor="alcancegeografico" className="text-blue-900 dark:text-gray-200 font-medium">Alcance Geográfico (millas)</Label>
                        <Input
                          id="alcancegeografico"
                          name="alcancegeografico"
                          type="number"
                          step="0.1"
                          value={formData.alcancegeografico}
                          onChange={handleInputChange}
                          className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      {/* Latitud */}
                      <div className="space-y-2">
                        <Label htmlFor="latitud" className="text-blue-900 dark:text-gray-200 font-medium">Latitud</Label>
                        <Input
                          id="latitud"
                          name="latitud"
                          type="number"
                          step="any"
                          placeholder="Ej: 10.2583"
                          value={formData.latitud}
                          onChange={handleInputChange}
                          className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                        />
                      </div>

                      {/* Longitud */}
                      <div className="space-y-2">
                        <Label htmlFor="longitud" className="text-blue-900 dark:text-gray-200 font-medium">Longitud</Label>
                        <Input
                          id="longitud"
                          name="longitud"
                          type="number"
                          step="any"
                          placeholder="Ej: -75.5200"
                          value={formData.longitud}
                          onChange={handleInputChange}
                          className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                        />
                      </div>

                      {/* Mar */}
                      <div className="space-y-2">
                        <CommandSelect
                          value={formData.id_mar}
                          onValueChange={(value) => handleSelectChange('id_mar', value)}
                          placeholder="Seleccionar mar"
                          searchPlaceholder="Buscar mar..."
                          emptyMessage="No se encontraron mares"
                          items={mares}
                          label="Mar"
                        />
                      </div>

                      {/* Ubicación */}
                      <div className="space-y-2 lg:col-span-2">
                        <Label htmlFor="ubicación" className="text-blue-900 dark:text-gray-200 font-medium">Ubicación</Label>
                        <Input
                          id="ubicación"
                          name="ubicación"
                          placeholder="Descripción de ubicación"
                          value={formData.ubicacion}
                          onChange={handleInputChange}
                          className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Pestaña Datos Lumínicos */}
                {activeTab === 'luminicos' && (
                  <div className="space-y-6 mt-4">
                    {!formData.luminica ? (
                      <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900">
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <AlertDescription className="text-amber-800 dark:text-amber-200">
                          La señalización lumínica está desactivada. Active la opción en Datos Generales para configurar estos campos.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Alcance Lumínico */}
                        <div className="space-y-2">
                          <Label htmlFor="alcanceluminico" className="text-blue-900 dark:text-gray-200 font-medium">Alcance Lumínico (millas)</Label>
                          <Input
                            id="alcanceluminico"
                            name="alcanceluminico"
                            type="number"
                            min="0"
                            step="0.1"
                            value={formData.alcanceluminico}
                            onChange={handleInputChange}
                            className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          />
                        </div>

                        {/* Intensidad Lumínica */}
                        <div className="space-y-2">
                          <Label htmlFor="intensidadluminica" className="text-blue-900 dark:text-gray-200 font-medium">Intensidad Lumínica (cd)</Label>
                          <Input
                            id="intensidadluminica"
                            name="intensidadluminica"
                            type="number"
                            step="0.1"
                            value={formData.intensidadluminica}
                            onChange={handleInputChange}
                            className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          />
                        </div>

                        {/* Color de Luz */}
                        <div className="space-y-2">
                          <CommandSelect
                            value={formData.id_colorluz}
                            onValueChange={(value) => handleSelectChange('id_colorluz', value)}
                            placeholder="Seleccionar color de luz"
                            searchPlaceholder="Buscar color..."
                            emptyMessage="No se encontraron colores"
                            items={coloresLuz}
                            label="Color de Luz"
                          />
                        </div>

                        {/* Característica */}
                        <div className="space-y-2">
                          <CommandSelect
                            value={formData.id_caracteristica}
                            onValueChange={(value) => handleSelectChange('id_caracteristica', value)}
                            placeholder="Seleccionar característica"
                            searchPlaceholder="Buscar característica..."
                            emptyMessage="No se encontraron características"
                            items={caracteristicas}
                            label="Característica"
                          />
                        </div>

                        {/* Periodo */}
                        <div className="space-y-2">
                          <Label htmlFor="periodo" className="text-blue-900 dark:text-gray-200 font-medium">Periodo (seg)</Label>
                          <Input
                            id="periodo"
                            name="periodo"
                            type="number"
                            step="0.1"
                            value={formData.periodo}
                            onChange={handleInputChange}
                            className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          />
                        </div>

                        {/* Oscuridad */}
                        <div className="space-y-2">
                          <Label htmlFor="oscuridad" className="text-blue-900 dark:text-gray-200 font-medium">Oscuridad (seg)</Label>
                          <Input
                            id="oscuridad"
                            name="oscuridad"
                            type="number"
                            step="0.1"
                            value={formData.oscuridad}
                            onChange={handleInputChange}
                            className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          />
                        </div>

                        {/* Tiempo de Luz */}
                        <div className="space-y-2">
                          <Label htmlFor="tiempoluz" className="text-blue-900 dark:text-gray-200 font-medium">Tiempo de Luz (seg)</Label>
                          <Input
                            id="tiempoluz"
                            name="tiempoluz"
                            type="number"
                            step="0.1"
                            value={formData.tiempoluz}
                            onChange={handleInputChange}
                            className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          />
                        </div>

                        {/* Potencia del Bombillo */}
                        <div className="space-y-2">
                          <Label htmlFor="potenciabombillo" className="text-blue-900 dark:text-gray-200 font-medium">Potencia del Bombillo (W)</Label>
                          <Input
                            id="potenciabombillo"
                            name="potenciabombillo"
                            type="number"
                            step="1"
                            value={formData.potenciabombillo}
                            onChange={handleInputChange}
                            className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          />
                        </div>

                        {/* Voltaje del Bombillo */}
                        <div className="space-y-2">
                          <Label htmlFor="voltagebombillo" className="text-blue-900 dark:text-gray-200 font-medium">Voltaje del Bombillo (V)</Label>
                          <Input
                            id="voltagebombillo"
                            name="voltagebombillo"
                            type="number"
                            step="1"
                            value={formData.voltagebombillo}
                            onChange={handleInputChange}
                            className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          />
                        </div>

                        {/* Consumo Destellador */}
                        <div className="space-y-2">
                          <Label htmlFor="consumodestellador" className="text-blue-900 dark:text-gray-200 font-medium">Consumo Destellador (W)</Label>
                          <Input
                            id="consumodestellador"
                            name="consumodestellador"
                            type="number"
                            step="0.1"
                            value={formData.consumodestellador}
                            onChange={handleInputChange}
                            className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Pestaña Equipamiento */}
                {activeTab === 'equipamiento' && (
                  <div className="space-y-6 mt-4">
                    {!formData.luminica ? (
                      <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900">
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <AlertDescription className="text-amber-800 dark:text-amber-200">
                          La señalización lumínica está desactivada. Active la opción en Datos Generales para configurar el equipamiento.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-400">Equipamiento de la Señal</h3>
                          <Button
                            onClick={agregarEquipamiento}
                            variant="outline"
                            size="sm"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                          >
                            <Plus className="h-4 w-4 mr-2" /> Agregar Equipamiento
                          </Button>
                        </div>

                        {/* Lista de equipamiento */}
                        {equipamiento.map((item, index) => (
                          <Card key={index} className="border border-blue-200 dark:border-gray-700 dark:bg-gray-800">
                            <CardContent className="pt-6">
                              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                <div className="space-y-2">
                                  <CommandSelect
                                    value={item.id_tipo_equipamiento}
                                    onValueChange={(value) => actualizarEquipamiento(index, 'id_tipo_equipamiento', value)}
                                    placeholder="Seleccionar tipo"
                                    searchPlaceholder="Buscar tipo..."
                                    emptyMessage="No se encontraron tipos"
                                    items={tiposEquipamiento.map(t => ({ id: t.id_tipo_equipamiento, nombre: t.nombre }))}
                                    label="Tipo de Equipamiento"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-blue-900 dark:text-gray-200 font-medium">Nombre</Label>
                                  <Input
                                    placeholder="Nombre del equipo"
                                    value={item.nombre}
                                    onChange={(e) => actualizarEquipamiento(index, 'nombre', e.target.value)}
                                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-blue-900 dark:text-gray-200 font-medium">Cantidad</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={item.cantidad}
                                    onChange={(e) => actualizarEquipamiento(index, 'cantidad', parseInt(e.target.value))}
                                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-blue-900 dark:text-gray-200 font-medium">N° Inventario</Label>
                                  <Input
                                    placeholder="Número de inventario"
                                    value={item.num_inventario}
                                    onChange={(e) => actualizarEquipamiento(index, 'num_inventario', e.target.value)}
                                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                                  />
                                </div>

                                <div className="flex justify-end">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => eliminarEquipamiento(index)}
                                    disabled={equipamiento.length === 1}
                                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Pestaña Sistema de Fondeo */}
                {activeTab === 'fondeo' && (
                  <div className="space-y-6 mt-4">
                    {!esBoya ? (
                      <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <AlertDescription className="text-amber-700 dark:text-amber-300">
                          El sistema de fondeo solo está disponible para boyas.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-400 flex items-center gap-2">
                          <Anchor className="h-5 w-5" />
                          Sistema de Fondeo (se guardará como JSON)
                        </h3>

                        {/* Número de Serie Flotador */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-blue-900 dark:text-gray-200 font-medium">N° Serie Flotador</Label>
                            <Input
                              value={noSerieFlotador}
                              onChange={(e) => setNoSerieFlotador(e.target.value)}
                              type="text"
                              placeholder="Número de serie del flotador"
                              className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                            />
                          </div>
                        </div>

                        {/* Cadenas */}
                        <div className="space-y-2">
                          <Label className="text-blue-900 dark:text-gray-200 font-medium">Cadenas</Label>
                          {cadenas.map((cadena, index) => (
                            <div key={index} className="flex gap-2 items-center">
                              <Input
                                placeholder="Diámetro (mm)"
                                className="w-40 border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                                value={cadena.diametro}
                                onChange={(e) => actualizarCadena(index, 'diametro', e.target.value)}
                              />
                              <Input
                                type="number"
                                placeholder="Cantidad"
                                className="w-32 border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                                value={cadena.cantidad}
                                onChange={(e) => actualizarCadena(index, 'cantidad', parseInt(e.target.value))}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => eliminarCadena(index)}
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                            onClick={agregarCadena}
                          >
                            <Plus className="h-4 w-4 mr-2" /> Agregar cadena
                          </Button>
                        </div>

                        {/* Pesos Muertos */}
                        <div className="space-y-2">
                          <Label className="text-blue-900 dark:text-gray-200 font-medium">Pesos Muertos</Label>
                          {pesosMuertos.map((peso, index) => (
                            <div key={index} className="flex gap-2 items-center">
                              <Input
                                placeholder="Peso (kg)"
                                className="w-40 border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                                value={peso.peso}
                                onChange={(e) => actualizarPesoMuerto(index, 'peso', e.target.value)}
                              />
                              <Input
                                type="number"
                                placeholder="Cantidad"
                                className="w-32 border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                                value={peso.cantidad}
                                onChange={(e) => actualizarPesoMuerto(index, 'cantidad', parseInt(e.target.value))}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => eliminarPesoMuerto(index)}
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                            onClick={agregarPesoMuerto}
                          >
                            <Plus className="h-4 w-4 mr-2" /> Agregar peso muerto
                          </Button>
                        </div>

                        {/* Bridas */}
                        <div className="space-y-2">
                          <Label className="text-blue-900 dark:text-gray-200 font-medium">Bridas</Label>
                          {bridas.map((brida, index) => (
                            <div key={index} className="flex gap-2 items-center">
                              <Input
                                placeholder="Tipo"
                                className="w-40 border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                                value={brida.tipo}
                                onChange={(e) => actualizarBrida(index, 'tipo', e.target.value)}
                              />
                              <Input
                                type="number"
                                placeholder="Cantidad"
                                className="w-32 border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                                value={brida.cantidad}
                                onChange={(e) => actualizarBrida(index, 'cantidad', parseInt(e.target.value))}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => eliminarBrida(index)}
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                            onClick={agregarBrida}
                          >
                            <Plus className="h-4 w-4 mr-2" /> Agregar brida
                          </Button>
                        </div>

                        {/* Grectos */}
                        <div className="space-y-2">
                          <Label className="text-blue-900 dark:text-gray-200 font-medium">Grectos</Label>
                          {grectos.map((grecto, index) => (
                            <div key={index} className="flex gap-2 items-center flex-wrap">
                              <Input
                                placeholder="Tipo"
                                className="w-32 border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                                value={grecto.tipo}
                                onChange={(e) => actualizarGrecto(index, 'tipo', e.target.value)}
                              />
                              <Input
                                type="number"
                                placeholder="Cant"
                                className="w-24 border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                                value={grecto.cantidad}
                                onChange={(e) => actualizarGrecto(index, 'cantidad', parseInt(e.target.value))}
                              />
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`giratorio-${index}`}
                                  checked={grecto.giratorio}
                                  onCheckedChange={(checked) => actualizarGrecto(index, 'giratorio', checked)}
                                  className="border-blue-400 text-blue-600 dark:border-gray-500 dark:bg-gray-700"
                                />
                                <Label htmlFor={`giratorio-${index}`} className="text-blue-900 dark:text-gray-200">Giratorio</Label>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => eliminarGrecto(index)}
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                            onClick={agregarGrecto}
                          >
                            <Plus className="h-4 w-4 mr-2" /> Agregar grecto
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Tabs>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 p-6 border-t border-blue-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={saving}
                className="w-full sm:w-auto border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4 mr-2" />
                {isEditing ? 'Restaurar' : 'Cancelar'}
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white dark:from-blue-700 dark:to-blue-800"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? 'Actualizar Señal' : 'Guardar Señal'}
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

export default FormANAV;