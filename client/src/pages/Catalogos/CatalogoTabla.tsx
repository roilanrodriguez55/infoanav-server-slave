import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import type { CatalogoDef } from '@/config/catalogos';
import { catalogosAdminService, type RegistroCatalogo } from '@/services/api/catalogosAdminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DebouncedInput } from '@/components/common/DebouncedInput';
import { Pagination } from '@/components/common/Pagination';
import { usePagedItems } from '@/hooks/usePagedItems';
import { Check, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';

interface AvisoOperacion {
  tipo: 'exito' | 'error';
  texto: string;
}

interface CatalogoTablaProps {
  def: CatalogoDef;
}

function mensajeDe(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo completar la operación. Intenta de nuevo';
}

export default function CatalogoTabla({ def }: CatalogoTablaProps) {
  const [registros, setRegistros] = useState<RegistroCatalogo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [aviso, setAviso] = useState<AvisoOperacion | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [nuevo, setNuevo] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [valorEdicion, setValorEdicion] = useState('');
  const [paraEliminar, setParaEliminar] = useState<RegistroCatalogo | null>(null);

  const cargar = useCallback(
    () =>
      catalogosAdminService
        .list(def)
        .then((lista) => {
          setRegistros(lista);
          setErrorCarga(null);
        })
        .catch((error: unknown) => {
          setErrorCarga(mensajeDe(error));
        })
        .finally(() => {
          setCargando(false);
        }),
    [def],
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const visibles = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return registros;
    return registros.filter((registro) => registro.nombre.toLowerCase().includes(termino));
  }, [registros, busqueda]);

  const paginado = usePagedItems(visibles);

  const reintentar = () => {
    setCargando(true);
    setErrorCarga(null);
    void cargar();
  };

  const ejecutar = async (operacion: () => Promise<string>) => {
    setGuardando(true);
    setAviso(null);
    try {
      const texto = await operacion();
      setAviso({ tipo: 'exito', texto });
      await cargar();
    } catch (error) {
      setAviso({ tipo: 'error', texto: mensajeDe(error) });
    } finally {
      setGuardando(false);
    }
  };

  const añadir = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nombre = nuevo.trim();
    if (!nombre) return;
    void ejecutar(async () => {
      await catalogosAdminService.create(def, nombre);
      setNuevo('');
      return `Registro "${nombre}" añadido`;
    });
  };

  const iniciarEdicion = (registro: RegistroCatalogo) => {
    setAviso(null);
    setEditandoId(registro.id);
    setValorEdicion(registro.nombre);
  };

  const guardarEdicion = (registro: RegistroCatalogo) => {
    const nombre = valorEdicion.trim();
    if (!nombre) {
      setAviso({ tipo: 'error', texto: 'El nombre no puede estar vacío' });
      return;
    }
    if (nombre === registro.nombre) {
      setEditandoId(null);
      return;
    }
    void ejecutar(async () => {
      await catalogosAdminService.update(def, registro.id, nombre);
      setEditandoId(null);
      return `Registro actualizado a "${nombre}"`;
    });
  };

  const confirmarBaja = () => {
    const registro = paraEliminar;
    setParaEliminar(null);
    if (!registro) return;
    void ejecutar(async () => {
      await catalogosAdminService.remove(def, registro.id);
      return `Registro "${registro.nombre}" eliminado`;
    });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={añadir} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <Label htmlFor="nuevo-registro">Nuevo registro</Label>
          <Input
            id="nuevo-registro"
            value={nuevo}
            onChange={(event) => setNuevo(event.target.value)}
            placeholder={`Nombre de ${def.etiqueta.toLowerCase()}`}
            disabled={guardando}
          />
        </div>
        <Button type="submit" variant="brand" disabled={guardando || nuevo.trim() === ''}>
          <Plus className="h-4 w-4" />
          Añadir
        </Button>
      </form>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-icon" />
        <DebouncedInput
          value={busqueda}
          onValueChange={(valor) => {
            setBusqueda(valor);
            paginado.setPage(1);
          }}
          placeholder="Buscar en este catálogo"
          aria-label="Buscar en este catálogo"
          className="pl-8"
        />
      </div>

      {aviso && (
        <Alert variant={aviso.tipo === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{aviso.texto}</AlertDescription>
        </Alert>
      )}

      {cargando ? (
        <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">Cargando registros...</p>
      ) : errorCarga ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <Alert variant="destructive">
            <AlertDescription>{errorCarga}</AlertDescription>
          </Alert>
          <Button variant="outline" onClick={reintentar}>
            <RefreshCw className="h-4 w-4 text-icon" />
            Reintentar
          </Button>
        </div>
      ) : registros.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Este catálogo no tiene registros todavía.
        </p>
      ) : visibles.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Ningún registro coincide con la búsqueda.
        </p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-md border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
          {paginado.pageItems.map((registro) => (
            <li key={registro.id} className="flex items-center gap-2 px-3 py-2">
              {editandoId === registro.id ? (
                <>
                  <Input
                    value={valorEdicion}
                    onChange={(event) => setValorEdicion(event.target.value)}
                    aria-label={`Nuevo nombre para ${registro.nombre}`}
                    disabled={guardando}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Guardar cambios"
                    disabled={guardando}
                    onClick={() => guardarEdicion(registro)}
                  >
                    <Check className="h-4 w-4 text-icon" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Cancelar edición"
                    disabled={guardando}
                    onClick={() => setEditandoId(null)}
                  >
                    <X className="h-4 w-4 text-icon" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 truncate text-sm text-gray-800 dark:text-gray-100">{registro.nombre}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Editar ${registro.nombre}`}
                    disabled={guardando}
                    onClick={() => iniciarEdicion(registro)}
                  >
                    <Pencil className="h-4 w-4 text-icon" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Eliminar ${registro.nombre}`}
                    disabled={guardando}
                    onClick={() => setParaEliminar(registro)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {!cargando && !errorCarga && registros.length > 0 && (
        <Pagination
          page={paginado.page}
          pageSize={paginado.pageSize}
          total={paginado.total}
          onPageChange={paginado.setPage}
        />
      )}

      <AlertDialog
        open={paraEliminar !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setParaEliminar(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Se dará de baja "{paraEliminar?.nombre}" de {def.etiqueta}. Si está en uso, el sistema lo impedirá.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarBaja}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
