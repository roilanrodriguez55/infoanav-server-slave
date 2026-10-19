import { useState } from 'react';
import { CATALOGOS, type CatalogoDef } from '@/config/catalogos';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CatalogoTabla from './CatalogoTabla';

export default function CatalogosPage() {
  const [seleccionado, setSeleccionado] = useState<CatalogoDef>(CATALOGOS[0]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Catálogos</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Administra los valores de las listas desplegables del sistema.
        </p>
      </div>

      <Card className="shadow-xl border-blue-200 dark:border-gray-700 dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800 dark:text-white">{seleccionado.etiqueta}</CardTitle>
          <CardDescription>Valores disponibles en las listas desplegables de los formularios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            role="group"
            aria-label="Catálogos disponibles"
            className="flex flex-wrap gap-2"
          >
            {CATALOGOS.map((def) => {
              const activo = def.tabla === seleccionado.tabla;
              return (
                <Button
                  key={def.tabla}
                  type="button"
                  size="sm"
                  variant={activo ? 'default' : 'outline'}
                  aria-pressed={activo}
                  className="shrink-0"
                  onClick={() => setSeleccionado(def)}
                >
                  {def.etiqueta}
                </Button>
              );
            })}
          </div>

          <CatalogoTabla key={seleccionado.tabla} def={seleccionado} />
        </CardContent>
      </Card>
    </div>
  );
}
