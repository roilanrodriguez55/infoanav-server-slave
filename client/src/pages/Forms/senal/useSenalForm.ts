import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { senalesService } from '@/services/api/senalesApi';
import { esVacio } from '@/lib/utils';
import { aValorDatetimeLocal } from '@/lib/intervalos';
import { aTimestampLocal } from '@/lib/planMantenimiento';
import {
  FORM_DATA_VACIO,
  type CatalogoItem,
  type EquipamientoItem,
  type FondeoControl,
  type FormDataState,
  type SistemaFondeo
} from './tipos';

interface UseSenalFormParams {
  id: string | undefined;
  tipos: CatalogoItem[];
  setLoading: (valor: boolean) => void;
  fondeo: FondeoControl;
}

export const useSenalForm = ({ id, tipos, setLoading, fondeo }: UseSenalFormParams) => {
  const navigate = useNavigate();
  const isEditing = !!id;

  const [saving, setSaving] = useState(false);
  const [errorCodigoLsm, setErrorCodigoLsm] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormDataState>(FORM_DATA_VACIO);
  const [equipamiento, setEquipamiento] = useState<EquipamientoItem[]>([
    { id_tipo_equipamiento: '', nombre: '', cantidad: 1, num_inventario: '' }
  ]);
  const [dadaDeBaja, setDadaDeBaja] = useState(false);

  const { noSerieFlotador, cadenas, pesosMuertos, bridas, grectos, cargar: cargarFondeo, reiniciar: reiniciarFondeo } = fondeo;

  // Detectar si es boya o faro
  const esBoya = !!formData.id_tipo && tipos.find(t => t.id === formData.id_tipo)?.nombre?.toLowerCase() === 'boya';
  const esFaro = !!formData.id_tipo && ['faro', 'farola'].includes(tipos.find(t => t.id === formData.id_tipo)?.nombre?.toLowerCase() ?? '');

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

  // Cargar datos de la señal si estamos editando
  useEffect(() => {
    const loadSenal = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await senalesService.getSenalById(id);

        if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
          const data = response.data[0];

          setDadaDeBaja(!!data.fecha_retirada);

          setFormData({
            codigo_lsm: data.codigo_lsm ?? '',
            id_tipo: data.id_tipo ?? '',
            id_categoria: data.id_categoria ?? '',
            nombre: data.nombre ?? '',
            id_modelo: data.id_modelo ?? '',
            id_estacion: data.id_estacion ?? '',
            luminica: data.luminica ?? true,
            secreta: data.secreta ?? false,
            fecha_instalacion: aValorDatetimeLocal(data.fecha_instalacion),
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
            id_complejidad: data.id_complejidad ?? '',
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
              cargarFondeo(fondeoData);
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
  }, [id, isEditing, setLoading, cargarFondeo]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'codigo_lsm') setErrorCodigoLsm(null);
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

  const handleReset = () => {
    setFormData({ ...FORM_DATA_VACIO });
    reiniciarFondeo();
    setEquipamiento([{ id_tipo_equipamiento: '', nombre: '', cantidad: 1, num_inventario: '' }]);
    navigate('/gestion-senales');
  };

  const validateForm = (): boolean => {
    if (esVacio(formData.codigo_lsm)) {
      alert('El código LSM es requerido');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setErrorCodigoLsm(null);
    setSaving(true);

    try {
      const dataToSend: Record<string, string | number | boolean | null> = {
        codigo_lsm: formData.codigo_lsm,
        id_tipo: formData.id_tipo || null,
        id_categoria: formData.id_categoria || null,
        nombre: formData.nombre || null,
        id_modelo: formData.id_modelo || null,
        id_estacion: formData.id_estacion || null,
        luminica: formData.luminica,
        secreta: formData.secreta,
        fecha_instalacion: aTimestampLocal(formData.fecha_instalacion),
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
        id_complejidad: formData.id_complejidad || null,
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
          const senalId = (response.data as { id_senal: string }[])[0].id_senal;
          for (const eq of equipamiento) {
            if (eq.id_tipo_equipamiento) {
              await senalesService.addEquipamiento(senalId, eq);
            }
          }
        }

        void navigate('/gestion-senales');
      } else if (response.codigoDuplicado) {
        setErrorCodigoLsm(`Ya existe una señal con el código LSM «${formData.codigo_lsm}»`);
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

  return {
    formData,
    saving,
    errorCodigoLsm,
    dadaDeBaja,
    esBoya,
    esFaro,
    equipamiento,
    handleInputChange,
    handleCheckboxChange,
    handleSelectChange,
    agregarEquipamiento,
    eliminarEquipamiento,
    actualizarEquipamiento,
    handleReset,
    handleSubmit
  };
};
