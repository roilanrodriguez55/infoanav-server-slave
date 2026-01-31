import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/api/authApi";

// Componentes shadcn
import { Button } from "../../../@/components/ui/button";
import { Input } from "../../../@/components/ui/input";
import { Label } from "../../../@/components/ui/label";
import { Alert, AlertDescription } from "../../../@/components/ui/alert";

// Iconos
import { Eye, EyeOff, Lock, User } from "lucide-react";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    usuario: '',
    contraseña: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.usuario.trim() || !formData.contraseña.trim()) {
      setError('Por favor complete todos los campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.login({
        usuario: formData.usuario,
        contraseña: formData.contraseña
      });

      if (response.success && response.data) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
        navigate('/dashboard');
      } else {
        setError(response.message || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-center px-4">
      {/* Fondo con patrón sutil (opcional, puedes eliminarlo si prefieres) */}
      <div className="absolute inset-0 bg-grid-slate-200 dark:bg-grid-slate-800 [mask-image:linear-gradient(0deg,transparent,black)] pointer-events-none" />
      
      {/* Contenido - completamente libre sobre el fondo */}
      <div className="relative w-full max-w-md">
        {/* Título */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-2">
            InfoANAV
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Ingresa tus credenciales para acceder al sistema
          </p>
        </div>

        {/* Mensaje de error */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Formulario - sin contenedor, solo los inputs */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo Usuario */}
          <div className="space-y-2">
            <Label htmlFor="usuario" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Usuario
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <Input
                id="usuario"
                name="usuario"
                type="text"
                placeholder="Ingrese su usuario"
                value={formData.usuario}
                onChange={handleChange}
                disabled={loading}
                required
                className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all dark:bg-slate-800 dark:border-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="contraseña" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <Input
                id="contraseña"
                name="contraseña"
                type={showPassword ? "text" : "password"}
                placeholder="Ingrese su contraseña"
                value={formData.contraseña}
                onChange={handleChange}
                disabled={loading}
                required
                className="pl-10 pr-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all dark:bg-slate-800 dark:border-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Botón de submit */}
          <Button 
            type="submit"
            className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando sesión...
              </div>
            ) : (
              'Iniciar Sesión'
            )}
          </Button>
        </form>

        {/* Línea decorativa */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-2 text-gray-500 dark:text-gray-400">
              Acceso al sistema
            </span>
          </div>
        </div>

        {/* Mensaje de contacto */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          ¿Problemas para acceder? Contacta al administrador
        </p>

        {/* Versión del sistema */}
        <p className="text-center mt-6 text-xs text-gray-400">
          © 2024 InfoANAVDB - Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}
