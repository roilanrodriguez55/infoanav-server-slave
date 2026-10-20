import { useState } from 'react';
import { Library } from 'lucide-react';
import { CATALOGOS, type CatalogoDef } from '@/config/catalogos';
import { PageHeader } from '@/components/common/PageHeader';
import { PillTabs } from '@/components/common/PillTabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CatalogoTabla from './CatalogoTabla';

const PESTANAS = CATALOGOS.map((def) => ({ value: def.tabla, label: def.etiqueta }));

export default function CatalogosPage() {
  const [seleccionado, setSeleccionado] = useState<CatalogoDef>(CATALOGOS[0]);

  const seleccionarCatalogo = (tabla: string) => {
    const def = CATALOGOS.find((catalogo) => catalogo.tabla === tabla);
    if (def) setSeleccionado(def);
  };

  return (
    <div className="w-full min-w-0 space-y-6">
      <PageHeader
        icon={<Library />}
        title="Catálogos"
        subtitle="Administra los valores de las listas desplegables del sistema."
      >
        <PillTabs aria-label="Catalogos disponibles" tabs={PESTANAS} value={seleccionado.tabla} onChange={seleccionarCatalogo} />
      </PageHeader>

      <Card className="shadow-xl border-blue-200 dark:border-gray-700 dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800 dark:text-white">{seleccionado.etiqueta}</CardTitle>
          <CardDescription>Valores disponibles en las listas desplegables de los formularios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CatalogoTabla key={seleccionado.tabla} def={seleccionado} />
        </CardContent>
      </Card>
    </div>
  );
}
