import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, Save, X, Loader2 } from 'lucide-react';
import { CommandSelect } from '@/components/ui/CommandSelect';
import { useSenalCatalogos } from './senal/useSenalCatalogos';
import { useSenalFondeo } from './senal/useSenalFondeo';
import { useSenalForm } from './senal/useSenalForm';
import { SenalFormTabs } from './senal/SenalFormTabs';
import { SeccionGeneral } from './senal/SeccionGeneral';
import { SeccionGeografica } from './senal/SeccionGeografica';
import { SeccionLuminica } from './senal/SeccionLuminica';
import { SeccionEquipamiento } from './senal/SeccionEquipamiento';
import { SeccionFondeo } from './senal/SeccionFondeo';
import { SeccionRadioelectrica } from './senal/SeccionRadioelectrica';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CAMPO_PENDIENTE, cn, esVacio } from '@/lib/utils';

const FormANAV = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [activeTab, setActiveTab] = useState('generales');

  const { catalogos, empresaUsuario, loading, setLoading, error } = useSenalCatalogos();
  const fondeo = useSenalFondeo();
  const {
    formData,
    saving,
    errorCodigoLsm,
    errorRacon,
    senalCargada,
    dadaDeBaja,
    esBoya,
    esFaro,
    equipamiento,
    handleInputChange,
    handleCheckboxChange,
    handleSelectChange,
    handleRaconChange,
    agregarEquipamiento,
    eliminarEquipamiento,
    actualizarEquipamiento,
    handleReset,
    handleSubmit
  } = useSenalForm({ id, tipos: catalogos.tipos, setLoading, fondeo });

  const handleGoBack = () => {
    void navigate('/gestion-senales');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-icon mx-auto mb-4" />
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
            <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
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

  if (isEditing && dadaDeBaja) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Señal dada de baja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">Esta señal está dada de baja y no se puede editar.</p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => { void navigate(`/gestion-senales/${id}`); }} className="w-full">
              Ver ficha de la señal
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

          <form onSubmit={(e) => { void handleSubmit(e); }}>
            <CardContent className="p-6 lg:p-8">
              {/* Código LSM y Tipo de Señal juntos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 dark:bg-gray-700 dark:border-gray-600">
                <div className="space-y-2">
                  <Label htmlFor="codigo_lsm" className="text-blue-900 dark:text-gray-200 font-medium">
                    Código LSM <span className="text-red-600 dark:text-red-400">*</span>
                  </Label>
                  <Input
                    id="codigo_lsm"
                    name="codigo_lsm"
                    placeholder="Ingrese código LSM"
                    value={formData.codigo_lsm}
                    aria-invalid={!!errorCodigoLsm}
                    onChange={handleInputChange}
                    className={cn("border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400", esVacio(formData.codigo_lsm) && CAMPO_PENDIENTE)}
                  />
                  {errorCodigoLsm && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorCodigoLsm}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <CommandSelect
                    value={formData.id_tipo}
                    pendiente={esVacio(formData.id_tipo)}
                    onValueChange={(value) => handleSelectChange('id_tipo', value)}
                    placeholder="Seleccionar tipo"
                    searchPlaceholder="Buscar tipo..."
                    emptyMessage="No se encontraron tipos"
                    items={catalogos.tipos}
                    label="Tipo de Señal"
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
              <SenalFormTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                luminica={formData.luminica}
                esBoya={esBoya}
              >
                {activeTab === 'generales' && (
                  <SeccionGeneral
                    formData={formData}
                    catalogos={catalogos}
                    onInputChange={handleInputChange}
                    onCheckboxChange={handleCheckboxChange}
                    onSelectChange={handleSelectChange}
                  />
                )}

                {activeTab === 'geograficos' && (
                  <SeccionGeografica
                    formData={formData}
                    catalogos={catalogos}
                    onInputChange={handleInputChange}
                    onSelectChange={handleSelectChange}
                  />
                )}

                {activeTab === 'luminicos' && (
                  <SeccionLuminica
                    formData={formData}
                    catalogos={catalogos}
                    onInputChange={handleInputChange}
                    onSelectChange={handleSelectChange}
                  />
                )}

                {activeTab === 'equipamiento' && (
                  <SeccionEquipamiento
                    luminica={formData.luminica}
                    equipamiento={equipamiento}
                    tiposEquipamiento={catalogos.tiposEquipamiento}
                    agregarEquipamiento={agregarEquipamiento}
                    eliminarEquipamiento={eliminarEquipamiento}
                    actualizarEquipamiento={actualizarEquipamiento}
                  />
                )}

                {activeTab === 'fondeo' && (
                  <SeccionFondeo esBoya={esBoya} fondeo={fondeo} />
                )}

                {activeTab === 'radioelectrica' && (
                  <SeccionRadioelectrica
                    formData={formData}
                    onCheckboxChange={handleCheckboxChange}
                    onRaconChange={handleRaconChange}
                  />
                )}
              </SenalFormTabs>

              {errorRacon && (
                <Alert className="mt-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertDescription className="text-red-700 dark:text-red-300">
                    La señal se guardó, pero el RACON no se sincronizó: {errorRacon}. Corrija el dato y vuelva a guardar.
                  </AlertDescription>
                </Alert>
              )}
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
                disabled={saving || !senalCargada}
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
