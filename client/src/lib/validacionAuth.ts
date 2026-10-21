export const PATRON_USUARIO = /^[A-Za-z0-9._-]+$/;

export const validarNombreUsuario = (usuario: string): string | undefined => {
  if (usuario.length < 3 || usuario.length > 50) {
    return 'El usuario debe tener entre 3 y 50 caracteres';
  }
  if (!PATRON_USUARIO.test(usuario)) {
    return 'Solo se permiten letras, números, punto, guion y guion bajo';
  }
  return undefined;
};

export const validarContrasena = (contrasena: string): string | undefined => {
  if (contrasena.length < 8 || contrasena.length > 72) {
    return 'La contraseña debe tener entre 8 y 72 caracteres';
  }
  return undefined;
};
