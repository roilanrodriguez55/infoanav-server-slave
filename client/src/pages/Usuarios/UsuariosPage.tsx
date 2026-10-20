import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usersService, type Usuario } from '@/services/api/usersApi';
import UsuarioDialog from './UsuarioDialog';

import { Button } from '@/components/ui/button';
import { DebouncedInput } from '@/components/common/DebouncedInput';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/common/Pagination';
import { PageHeader } from '@/components/common/PageHeader';
import { ListCard } from '@/components/common/ListCard';
import { EmptyState } from '@/components/common/EmptyState';
import { usePagedItems } from '@/hooks/usePagedItems';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Edit, KeyRound, Plus, RefreshCw, Search, UserX, Users } from 'lucide-react';

interface Mensaje {
  tipo: 'success' | 'error';
  texto: string;
}

interface DialogoAbierto {
  key: number;
  usuario: Usuario | null;
}

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const UsuariosPage = () => {
  const { authState, isAdmin } = useAuth();
  const idPropio = authState.usuario?.id;

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [mostrarBajas, setMostrarBajas] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [recarga, setRecarga] = useState(0);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const [dialogo, setDialogo] = useState<DialogoAbierto | null>(null);
  const [aDarDeBaja, setADarDeBaja] = useState<Usuario | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    let vigente = true;
    usersService
      .list(mostrarBajas)
      .then((lista) => {
        if (!vigente) return;
        setUsuarios(lista);
        setErrorCarga(null);
      })
      .catch((error: unknown) => {
        if (!vigente) return;
        setErrorCarga(error instanceof Error ? error.message : 'No se pudo completar la operación');
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [isAdmin, mostrarBajas, recarga]);

  const termino = busqueda.trim().toLowerCase();
  const visibles = termino === ''
    ? usuarios
    : usuarios.filter((u) =>
        [u.usuario, u.cargo_ocupa ?? '', u.rol].some((campo) => campo.toLowerCase().includes(termino))
      );

  const paginado = usePagedItems(visibles);

  if (!isAdmin) {
    return (
      <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <AlertDescription className="text-red-700 dark:text-red-300">
          Esta pantalla es solo para administradores.
        </AlertDescription>
      </Alert>
    );
  }

  const recargar = () => setRecarga((n) => n + 1);

  const darDeBaja = async () => {
    if (!aDarDeBaja) return;
    const usuario = aDarDeBaja;
    setADarDeBaja(null);
    try {
      await usersService.remove(usuario.id);
      setMensaje({ tipo: 'success', texto: `Usuario ${usuario.usuario} dado de baja` });
      recargar();
    } catch (error: unknown) {
      setMensaje({
        tipo: 'error',
        texto: error instanceof Error ? error.message : 'No se pudo completar la operación',
      });
    }
  };

  const onGuardado = (texto: string) => {
    setMensaje({ tipo: 'success', texto });
    recargar();
  };

  return (
    <div className="w-full min-w-0">
      <PageHeader
        icon={<Users />}
        title="Usuarios"
        subtitle="Gestión de usuarios del sistema"
        actions={
          <>
            <Button variant="neutral" onClick={recargar} className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2 text-icon" />
              Actualizar
            </Button>
            <Button
              variant="brand"
              onClick={() => setDialogo({ key: Date.now(), usuario: null })}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo usuario
            </Button>
          </>
        }
      />

      {mensaje && (
        <Alert className={`mb-6 ${mensaje.tipo === 'success'
          ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
          : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
          <AlertDescription className={mensaje.tipo === 'success'
            ? 'text-green-700 dark:text-green-300'
            : 'text-red-700 dark:text-red-300'}>
            {mensaje.texto}
          </AlertDescription>
        </Alert>
      )}

      {errorCarga && (
        <Alert className="mb-6 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-700 dark:text-red-300">
            Error al cargar usuarios: {errorCarga}
          </AlertDescription>
        </Alert>
      )}

      {/* Filtros: el listado es pequeno, la busqueda se hace en cliente */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end gap-4">
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-icon" />
          </div>
          <DebouncedInput
            value={busqueda}
            onValueChange={(valor) => {
              setBusqueda(valor);
              paginado.setPage(1);
            }}
            placeholder="Buscar por usuario, cargo o rol"
            aria-label="Buscar usuarios"
            className="w-full pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="mostrar-bajas"
            checked={mostrarBajas}
            onCheckedChange={(valor) => {
              setCargando(true);
              setMostrarBajas(valor === true);
            }}
          />
          <Label htmlFor="mostrar-bajas" className="text-gray-700 dark:text-gray-300">
            Mostrar dados de baja
          </Label>
        </div>
      </div>

      <ListCard
        title="Listado de usuarios"
        subtitle={`${visibles.length} ${visibles.length === 1 ? 'usuario' : 'usuarios'}`}
        footer={
          <Pagination
            page={paginado.page}
            pageSize={paginado.pageSize}
            total={paginado.total}
            onPageChange={paginado.setPage}
            loading={cargando}
          />
        }
      >
          {cargando ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando usuarios...</p>
              </div>
            </div>
          ) : visibles.length === 0 ? (
            <EmptyState
              icon={<Users />}
              title={termino !== '' ? 'No se encontraron usuarios' : 'No hay usuarios'}
              description={termino !== '' ? 'Prueba con otra búsqueda' : 'Comienza agregando un nuevo usuario'}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-100 dark:bg-gray-700">
                    <TableHead className="font-semibold">Usuario</TableHead>
                    <TableHead className="font-semibold">Rol</TableHead>
                    <TableHead className="font-semibold">Cargo</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold">Alta</TableHead>
                    <TableHead className="font-semibold text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginado.pageItems.map((usuario) => {
                    const dadoDeBaja = usuario.deleted_at !== null;
                    const esPropio = usuario.id === idPropio;
                    return (
                      <TableRow
                        key={usuario.id}
                        className={`hover:bg-blue-50 dark:hover:bg-gray-700 ${dadoDeBaja ? 'opacity-60' : ''}`}
                      >
                        <TableCell className="font-mono font-medium">{usuario.usuario}</TableCell>
                        <TableCell>
                          {usuario.rol === 'administrador' ? (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                              Administrador
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                              Usuario
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{usuario.cargo_ocupa ?? '-'}</TableCell>
                        <TableCell>
                          {dadoDeBaja ? (
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Baja</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Activo</Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(usuario.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDialogo({ key: Date.now(), usuario })}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-gray-700"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDialogo({ key: Date.now(), usuario })}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-gray-700"
                            >
                              <KeyRound className="h-4 w-4 mr-1" />
                              Cambiar contraseña
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={esPropio || dadoDeBaja}
                              onClick={() => setADarDeBaja(usuario)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:bg-gray-700"
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Dar de baja
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
      </ListCard>

      {dialogo && (
        <UsuarioDialog
          key={dialogo.key}
          usuario={dialogo.usuario}
          onCerrar={() => setDialogo(null)}
          onGuardado={onGuardado}
        />
      )}

      <AlertDialog open={aDarDeBaja !== null} onOpenChange={(abierto) => { if (!abierto) setADarDeBaja(null); }}>
        <AlertDialogContent className="dark:bg-popover dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-800 dark:text-white">
              Dar de baja a {aDarDeBaja?.usuario}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
              Es una baja lógica: el registro se conserva y puede verse activando "Mostrar dados de baja".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void darDeBaja()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Dar de baja
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UsuariosPage;
