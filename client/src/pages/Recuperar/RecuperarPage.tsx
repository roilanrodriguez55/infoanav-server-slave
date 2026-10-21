import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '@/services/api/authApi';
import { validarContrasena } from '@/lib/validacionAuth';
import CodigoRecuperacion from '@/components/auth/CodigoRecuperacion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { Eye, EyeOff, KeyRound, Lock, User } from 'lucide-react';

interface Errores {
  usuario?: string;
  codigo?: string;
  contrasena?: string;
  confirmar?: string;
}

export default function RecuperarPage() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errores, setErrores] = useState<Errores>({});
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [codigoNuevo, setCodigoNuevo] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nombre = usuario.trim();
    const codigoLimpio = codigo.trim();
    const erroresNuevos: Errores = {
      usuario: nombre === '' ? 'Ingresa tu usuario' : undefined,
      codigo: codigoLimpio === '' ? 'Ingresa tu código de recuperación' : undefined,
      contrasena: validarContrasena(nuevaContrasena),
      confirmar: nuevaContrasena !== confirmar ? 'Las contraseñas no coinciden' : undefined,
    };
    setErrores(erroresNuevos);
    setErrorServidor(null);
    if (Object.values(erroresNuevos).some((error) => error !== undefined)) return;

    setEnviando(true);
    try {
      const resultado = await authService.resetPassword({
        usuario: nombre,
        codigo: codigoLimpio,
        nuevaContrasena,
      });
      if (!resultado.success) {
        setErrorServidor(resultado.message);
        return;
      }
      setCodigoNuevo(resultado.data.codigoRecuperacion);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col items-center justify-center px-4">
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-2">
            InfoANAV
          </h1>
          <p className="text-muted-foreground">
            {codigoNuevo === null
              ? 'Restablece tu contraseña con tu código de recuperación'
              : 'Contraseña restablecida'}
          </p>
        </div>

        {codigoNuevo !== null ? (
          <CodigoRecuperacion codigo={codigoNuevo} onConfirmar={() => void navigate('/signin', { replace: true })} />
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-6">
            {errorServidor && (
              <Alert variant="destructive" data-testid="recuperar-error">
                <AlertDescription>{errorServidor}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="usuario">Usuario</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-icon" />
                <Input
                  id="usuario"
                  name="usuario"
                  type="text"
                  placeholder="Ingrese su usuario"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  disabled={enviando}
                  autoComplete="username"
                  className="pl-10 h-12 border-border focus:border-blue-500 focus:ring-blue-500 transition-all bg-card text-foreground"
                />
              </div>
              {errores.usuario && <p className="text-sm text-red-600 dark:text-red-400">{errores.usuario}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo">Código de recuperación</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 h-5 w-5 text-icon" />
                <Input
                  id="codigo"
                  name="codigo"
                  type="text"
                  placeholder="Ingrese su código"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  disabled={enviando}
                  autoComplete="off"
                  className="pl-10 h-12 font-mono border-border focus:border-blue-500 focus:ring-blue-500 transition-all bg-card text-foreground"
                />
              </div>
              {errores.codigo && <p className="text-sm text-red-600 dark:text-red-400">{errores.codigo}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nueva-contrasena">Nueva contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-icon" />
                <Input
                  id="nueva-contrasena"
                  name="nueva-contrasena"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingrese la nueva contraseña"
                  value={nuevaContrasena}
                  onChange={(e) => setNuevaContrasena(e.target.value)}
                  disabled={enviando}
                  autoComplete="new-password"
                  className="pl-10 pr-10 h-12 border-border focus:border-blue-500 focus:ring-blue-500 transition-all bg-card text-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-icon hover:text-icon-strong"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errores.contrasena && <p className="text-sm text-red-600 dark:text-red-400">{errores.contrasena}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmar">Confirmar contraseña</Label>
              <Input
                id="confirmar"
                name="confirmar"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repita la nueva contraseña"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                disabled={enviando}
                autoComplete="new-password"
                className="h-12 border-border focus:border-blue-500 focus:ring-blue-500 transition-all bg-card text-foreground"
              />
              {errores.confirmar && <p className="text-sm text-red-600 dark:text-red-400">{errores.confirmar}</p>}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
              disabled={enviando}
            >
              {enviando ? 'Restableciendo...' : 'Restablecer contraseña'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              <Link to="/signin" className="text-blue-600 hover:underline dark:text-blue-400">
                Volver a iniciar sesión
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
