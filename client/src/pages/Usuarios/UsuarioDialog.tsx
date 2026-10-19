import { useEffect, useState, type FormEvent } from 'react';
import api from '@/services/config/axiosConfig';
import { usersService, type Usuario } from '@/services/api/usersApi';
import type { Rol } from '@/types/auth.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface UsuarioDialogProps {
  // Sin usuario se crea un usuario nuevo; con usuario se edita (el nombre no cambia).
  usuario: Usuario | null;
  onCerrar: () => void;
  onGuardado: (mensaje: string) => void;
}

interface Errores {
  usuario?: string;
  contrasena?: string;
}

interface EmpresaOpcion {
  id_empresa: string;
  nombre: string;
}

const SIN_EMPRESA = '__none__';

const PATRON_USUARIO = /^[A-Za-z0-9._-]+$/;

const validar = (usuario: string, contrasena: string, esEdicion: boolean): Errores => {
  const errores: Errores = {};
  if (!esEdicion) {
    if (usuario.length < 3 || usuario.length > 50) {
      errores.usuario = 'El usuario debe tener entre 3 y 50 caracteres';
    } else if (!PATRON_USUARIO.test(usuario)) {
      errores.usuario = 'Solo se permiten letras, números, punto, guion y guion bajo';
    }
  }
  // En edicion la contrasena es opcional: vacia significa no cambiarla.
  if (!esEdicion || contrasena !== '') {
    if (contrasena.length < 8 || contrasena.length > 72) {
      errores.contrasena = 'La contraseña debe tener entre 8 y 72 caracteres';
    }
  }
  return errores;
};

const UsuarioDialog = ({ usuario, onCerrar, onGuardado }: UsuarioDialogProps) => {
  const esEdicion = usuario !== null;

  const [nombre, setNombre] = useState(usuario?.usuario ?? '');
  const [contrasena, setContrasena] = useState('');
  const [rol, setRol] = useState<Rol>(usuario?.rol ?? 'usuario');
  const [cargo, setCargo] = useState(usuario?.cargo_ocupa ?? '');
  const [idEmpresa, setIdEmpresa] = useState(usuario?.id_empresa ?? '');
  const [errores, setErrores] = useState<Errores>({});
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [empresas, setEmpresas] = useState<EmpresaOpcion[]>([]);

  useEffect(() => {
    let activo = true;
    api
      .get<EmpresaOpcion[]>('/empresas?deleted_at=is.null&select=id_empresa,nombre&order=nombre.asc')
      .then((response) => {
        if (activo) setEmpresas(response.data);
      })
      .catch(() => {
        if (activo) setEmpresas([]);
      });
    return () => {
      activo = false;
    };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nombreLimpio = nombre.trim();
    const erroresNuevos = validar(nombreLimpio, contrasena, esEdicion);
    setErrores(erroresNuevos);
    setErrorServidor(null);
    if (Object.keys(erroresNuevos).length > 0) return;

    setEnviando(true);
    try {
      if (usuario) {
        await usersService.update(usuario.id, {
          rol,
          cargo_ocupa: cargo.trim() || null,
          id_empresa: idEmpresa.trim() || null,
          ...(contrasena !== '' ? { contrasena } : {}),
        });
        onGuardado(`Usuario ${usuario.usuario} actualizado correctamente`);
      } else {
        await usersService.create({
          usuario: nombreLimpio,
          contrasena,
          rol,
          cargo_ocupa: cargo.trim() || undefined,
          id_empresa: idEmpresa.trim() || undefined,
        });
        onGuardado(`Usuario ${nombreLimpio} creado correctamente`);
      }
      onCerrar();
    } catch (error: unknown) {
      setErrorServidor(error instanceof Error ? error.message : 'No se pudo completar la operación');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open onOpenChange={(abierto) => { if (!abierto && !enviando) onCerrar(); }}>
      <DialogContent className="sm:max-w-md dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-gray-800 dark:text-white">
            {esEdicion ? 'Editar usuario' : 'Nuevo usuario'}
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            {esEdicion ? 'Modifica el rol, el cargo, la empresa o la contraseña.' : 'Completa los datos del nuevo usuario.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4">
          {errorServidor && (
            <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-700 dark:text-red-300">{errorServidor}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="usuario-nombre">Usuario</Label>
            <Input
              id="usuario-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={esEdicion}
              autoComplete="off"
              className="dark:bg-gray-900 dark:text-white"
            />
            {errores.usuario && <p className="text-sm text-red-600 dark:text-red-400">{errores.usuario}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="usuario-contrasena">
              {esEdicion ? 'Nueva contraseña' : 'Contraseña'}
            </Label>
            <Input
              id="usuario-contrasena"
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              autoComplete="new-password"
              className="dark:bg-gray-900 dark:text-white"
            />
            {esEdicion && (
              <p className="text-xs text-gray-500 dark:text-gray-400">Dejar vacío para no cambiarla</p>
            )}
            {errores.contrasena && <p className="text-sm text-red-600 dark:text-red-400">{errores.contrasena}</p>}
          </div>

          <div className="space-y-2">
            <Label>Rol</Label>
            <Select value={rol} onValueChange={(valor) => setRol(valor as Rol)}>
              <SelectTrigger className="w-full dark:bg-gray-900 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usuario">Usuario</SelectItem>
                <SelectItem value="administrador">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="usuario-cargo">Cargo</Label>
            <Input
              id="usuario-cargo"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              className="dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <Label>Empresa</Label>
            <Select
              value={idEmpresa || SIN_EMPRESA}
              onValueChange={(valor) => setIdEmpresa(valor === SIN_EMPRESA ? '' : valor)}
            >
              <SelectTrigger className="w-full dark:bg-gray-900 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SIN_EMPRESA}>Sin empresa</SelectItem>
                {empresas.map((empresa) => (
                  <SelectItem key={empresa.id_empresa} value={empresa.id_empresa}>
                    {empresa.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar} disabled={enviando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando} className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
              {enviando ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UsuarioDialog;
