import { useEffect, useState } from 'react';
import {
  documentacionService,
  type CatalogoCreable,
  type CatalogosLibros,
} from '@/services/api/documentacionApi';
import type { CatalogoItem } from '@/services/api/senalesApi';

const CATALOGOS_VACIOS: CatalogosLibros = {
  temas: [],
  tiposDocumento: [],
  paises: [],
  editoriales: [],
  idiomas: [],
};

const ordenarPorNombre = (items: CatalogoItem[]): CatalogoItem[] =>
  [...items].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

export function useCatalogosDocumentacion() {
  const [catalogos, setCatalogos] = useState<CatalogosLibros>(CATALOGOS_VACIOS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    documentacionService
      .getCatalogos()
      .then((datos) => {
        if (activo) setCatalogos(datos);
      })
      .catch(() => {
        if (activo) setError('No se pudieron cargar los catálogos');
      });
    return () => {
      activo = false;
    };
  }, []);

  // Devuelve la funcion que crea un item en el catalogo indicado y lo agrega a la lista local.
  const crearEn = (clave: CatalogoCreable) => async (nombre: string): Promise<CatalogoItem> => {
    const creado = await documentacionService.crearCatalogo(clave, nombre);
    setCatalogos((previo) => ({ ...previo, [clave]: ordenarPorNombre([...previo[clave], creado]) }));
    return creado;
  };

  return { catalogos, error, crearEn };
}
