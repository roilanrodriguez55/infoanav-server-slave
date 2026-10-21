import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import { authService } from '@/services/api/authApi';
import type { EmpresaSetup } from '@/types/auth.types';
import { validarContrasena, validarNombreUsuario } from '@/lib/validacionAuth';
import CodigoRecuperacion from '@/components/auth/CodigoRecuperacion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Eye, EyeOff, Lock, User } from 'lucide-react';

interface SetupPageProps {
  empresas: EmpresaSetup[];
  onRecargarEstado: () => Promise<void>;
  onConfigurado: () => void;
}

interface Errores {
  usuario?: string;
  contrasena?: string;
  confirmar?: string;
}

const SIN_EMPRESA = '__none__';

export default function SetupPage({ empresas, onRecargarEstado, onConfigurado }: SetupPageProps) {
  const navigate = useNavigate();
  const { establecerSesion } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [idEmpresa, setIdEmpresa] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errores, setErrores] = useState<Errores>({});
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [codigo, setCodigo] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nombre = usuario.trim();
    const erroresNuevos: Errores = {
      usuario: validarNombreUsuario(nombre),
      contrasena: validarContrasena(contrasena),
      confirmar: contrasena !== confirmar ? 'Las contraseñas no coinciden' : undefined,
    };
    setErrores(erroresNuevos);
    setErrorServidor(null);
    if (Object.values(erroresNuevos).some((error) => error !== undefined)) return;

    setEnviando(true);
    try {
      const resultado = await authService.setup({
        usuario: nombre,
        contrasena,
        id_empresa: idEmpresa || null,
      });
      if (!resultado.success) {
        // 409: ya hay administrador. Se recarga el estado y la app redirige a /signin.
        if (resultado.status === 409) {
          await onRecargarEstado();
          return;
        }
        setErrorServidor(resultado.message);
        return;
      }
      establecerSesion(resultado.data);
      setCodigo(resultado.data.codigoRecuperacion);
    } finally {
      setEnviando(false);
    }
  };

  const confirmarCodigo = () => {
    void navigate('/', { replace: true });
    onConfigurado();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col items-center justify-center px-4">
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-2">
            InfoANAV
          </h1>
          <p className="text-muted-foreground">
            {codigo === null
              ? 'Crea el administrador del sistema para comenzar'
              : 'Cuenta de administrador creada'}
          </p>
        </div>

        {codigo !== null ? (
          <CodigoRecuperacion codigo={codigo} onConfirmar={confirmarCodigo} />
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-6">
            {errorServidor && (
              <Alert variant="destructive" data-testid="setup-error">
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
                  autoComplete="off"
                  className="pl-10 h-12 border-border focus:border-blue-500 focus:ring-blue-500 transition-all bg-card text-foreground"
                />
              </div>
              {errores.usuario && <p className="text-sm text-red-600 dark:text-red-400">{errores.usuario}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contrasena">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-icon" />
                <Input
                  id="contrasena"
                  name="contrasena"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingrese su contraseña"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
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
                placeholder="Repita la contraseña"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                disabled={enviando}
                autoComplete="new-password"
                className="h-12 border-border focus:border-blue-500 focus:ring-blue-500 transition-all bg-card text-foreground"
              />
              {errores.confirmar && <p className="text-sm text-red-600 dark:text-red-400">{errores.confirmar}</p>}
            </div>

            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select
                value={idEmpresa || SIN_EMPRESA}
                onValueChange={(valor) => setIdEmpresa(valor === SIN_EMPRESA ? '' : valor)}
                disabled={enviando}
              >
                <SelectTrigger className="w-full h-12 bg-card text-foreground">
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

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
              disabled={enviando}
            >
              {enviando ? 'Creando administrador...' : 'Crear administrador'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
