import { useEffect, useState } from 'react';
import { senalesService } from '@/services/api/senalesApi';
import type { CatalogosSenal } from './tipos';

const CATALOGOS_VACIOS: CatalogosSenal = {
  tipos: [],
  categorias: [],
  modelos: [],
  estaciones: [],
  usuarios: [],
  zonas: [],
  estados: [],
  materiales: [],
  energias: [],
  marcasTope: [],
  complejidades: [],
  colores: [],
  formas: [],
  mares: [],
  coloresLuz: [],
  caracteristicas: [],
  tiposEquipamiento: []
};

export const useSenalCatalogos = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [catalogos, setCatalogos] = useState<CatalogosSenal>(CATALOGOS_VACIOS);

  // Estado para la empresa del usuario (sin endpoint en PostgREST, usar null)
  const [empresaUsuario, setEmpresaUsuario] = useState<{ id: string; nombre: string } | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sin endpoint de empresa en PostgREST, el valor es siempre null
    setEmpresaUsuario(null);
  }, []);

  useEffect(() => {
    const loadCatalogos = async () => {
      setLoading(true);
      setError(null);

      try {
        const datos = await senalesService.getCatalogos();

        setCatalogos({
          tipos: datos.tipos ?? [],
          categorias: datos.categorias ?? [],
          modelos: datos.modelos ?? [],
          estaciones: datos.estaciones ?? [],
          usuarios: datos.usuariosNavegacion ?? [],
          zonas: datos.zonas ?? [],
          estados: datos.estados ?? [],
          materiales: datos.materiales ?? [],
          energias: datos.energias ?? [],
          marcasTope: datos.marcasTope ?? [],
          complejidades: datos.complejidades ?? [],
          colores: datos.colores ?? [],
          formas: datos.formas ?? [],
          mares: datos.mares ?? [],
          coloresLuz: datos.coloresLuz ?? [],
          caracteristicas: datos.caracteristicas ?? [],
          tiposEquipamiento: datos.tiposEquipamiento ?? []
        });
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

  return { catalogos, empresaUsuario, loading, setLoading, error };
};
