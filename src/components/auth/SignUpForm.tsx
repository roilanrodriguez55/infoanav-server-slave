import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import { useAuth } from "../../context/AuthContext";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  // Estado para los datos del formulario - ADAPTADO A TU TABLA
  const [formData, setFormData] = useState({
    usuario: '',           // Cambiado de firstName + lastName a usuario
    contraseña: '',        // Mantenemos contraseña
    confirmarContraseña: '',
    cargo_ocupa: ''        // Nuevo campo opcional
  });

  const { register, authState } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validar contraseñas coincidentes
    if (name === 'contraseña' || name === 'confirmarContraseña') {
      const password = name === 'contraseña' ? value : formData.contraseña;
      const confirmPassword = name === 'confirmarContraseña' ? value : formData.confirmarContraseña;
      
      if (confirmPassword && password !== confirmPassword) {
        setPasswordError('Las contraseñas no coinciden');
      } else {
        setPasswordError('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.usuario.trim()) {
      alert('El nombre de usuario es requerido');
      return;
    }

    if (!formData.contraseña.trim()) {
      alert('La contraseña es requerida');
      return;
    }

    if (formData.contraseña.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.contraseña !== formData.confirmarContraseña) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    if (!isChecked) {
      alert('Debes aceptar los términos y condiciones');
      return;
    }

    // Llamar al servicio de registro
    const success = await register(
      formData.usuario,
      formData.contraseña,
      formData.cargo_ocupa || undefined
    );

    if (success) {
      navigate('/dashboard'); // Redirigir al dashboard después del registro exitoso
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="w-full max-w-md mx-auto mb-5 sm:pt-10">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Volver al inicio
        </Link>
      </div>
      
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ¡Regístrate para acceder al sistema!
            </p>
          </div>

          {/* Mensaje de error del contexto */}
          {authState.error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {authState.error}
            </div>
          )}

          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                {/* Campo de Usuario (reemplaza First Name y Last Name) */}
                <div>
                  <Label>
                    Usuario <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="usuario"
                    value={formData.usuario}
                    onChange={handleChange}
                    placeholder="Ingresa tu nombre de usuario"
                    disabled={authState.loading}
                  />
                </div>

                {/* Campo de Cargo (nuevo - opcional) */}
                <div>
                  <Label>
                    Cargo que ocupas <span className="text-gray-400">(opcional)</span>
                  </Label>
                  <Input
                    type="text"
                    name="cargo_ocupa"
                    value={formData.cargo_ocupa}
                    onChange={handleChange}
                    placeholder="Ej: Administrador, Vendedor, etc."
                    disabled={authState.loading}
                  />
                </div>

                {/* Contraseña */}
                <div>
                  <Label>
                    Contraseña <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="contraseña"
                      value={formData.contraseña}
                      onChange={handleChange}
                      placeholder="Mínimo 6 caracteres"
                      disabled={authState.loading}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>

                {/* Confirmar Contraseña */}
                <div>
                  <Label>
                    Confirmar Contraseña <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmarContraseña"
                      value={formData.confirmarContraseña}
                      onChange={handleChange}
                      placeholder="Confirma tu contraseña"
                      disabled={authState.loading}
                    />
                    <span
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showConfirmPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>

                {/* Mensaje de error de contraseñas */}
                {passwordError && (
                  <p className="text-sm text-error-500">{passwordError}</p>
                )}

                {/* Checkbox de términos */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    className="w-5 h-5"
                    checked={isChecked}
                    onChange={setIsChecked}
                  />
                  <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                    Al crear una cuenta aceptas los{" "}
                    <span className="text-gray-800 dark:text-white/90">
                      Términos y Condiciones,
                    </span>{" "}
                    y nuestras{" "}
                    <span className="text-gray-800 dark:text-white">
                      Políticas de Privacidad
                    </span>
                  </p>
                </div>

                {/* Botón de registro */}
                <div>
                  <button
                    type="submit"
                    disabled={authState.loading}
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300"
                  >
                    {authState.loading ? 'Registrando...' : 'Registrarse'}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                ¿Ya tienes una cuenta? {""}
                <Link
                  to="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Inicia Sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
