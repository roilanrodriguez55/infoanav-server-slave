import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Wrench } from 'lucide-react';
import { ModuleTabs, type ModuleTab } from '@/components/common/ModuleTabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { equiposService, type EquiposCatalogos } from '@/services/api/equiposApi';
import AlertasTab from './AlertasTab';
import InventarioTab from './InventarioTab';
import ModelosTab from './ModelosTab';
import PlantasTab from '@/pages/Plantas/PlantasTab';

export default function EquipamientoPage() {
  const [catalogos, setCatalogos] = useState<EquiposCatalogos | null>(null);
  const [errorCatalogos, setErrorCatalogos] = useState<string | null>(null);

  const cargarCatalogos = useCallback(() => {
    equiposService
      .getCatalogos()
      .then((datos) => {
        setCatalogos(datos);
        setErrorCatalogos(null);
      })
      .catch(() => setErrorCatalogos('No se pudieron cargar los catálogos de equipamiento'));
  }, []);

  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  const tabs: ModuleTab[] = [
    {
      value: 'inventario',
      label: 'Inventario',
      content: <InventarioTab catalogos={catalogos} />,
    },
    {
      value: 'alertas',
      label: 'Alertas',
      content: <AlertasTab />,
    },
    {
      value: 'plantas',
      label: 'Grupos electrógenos',
      content: <PlantasTab />,
    },
    {
      value: 'modelos',
      label: 'Modelos',
      content: <ModelosTab onCambio={cargarCatalogos} />,
    },
  ];

  return (
    <div className="w-full min-w-0">
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-white">
          <Wrench className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Equipamiento
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Inventario de equipos de las señales, alertas de vida útil y catálogo de modelos
        </p>
      </div>

      {errorCatalogos && (
        <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-700 dark:text-red-300">{errorCatalogos}</AlertDescription>
        </Alert>
      )}

      <ModuleTabs tabs={tabs} defaultValue="inventario" />
    </div>
  );
}
