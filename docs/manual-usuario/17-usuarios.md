# 17. Usuarios

## Para que sirve

Este modulo administra las cuentas que pueden entrar a INFOANAV: crear usuarios, cambiar su rol, su cargo, su empresa o su contrasena, y darlos de baja.

Solo el administrador puede usar esta pantalla. Los demas roles no la ven en el menu y, si escriben la direccion, son devueltos al Dashboard. Los roles se explican en el archivo 03.

## Como llegar

- Menu lateral: **Usuarios**, en el grupo Administracion.
- Ruta: `/usuarios`.

## Que ve en pantalla

- Titulo **Gestion de usuarios del sistema** y el boton **Nuevo usuario**.
- Buscador: "Buscar por usuario, cargo o rol". La busqueda se hace en la misma pantalla, sobre la lista cargada.
- Casilla **Mostrar dados de baja**. Sin marcarla, solo aparecen los usuarios activos.
- Tabla **Listado de usuarios** con las columnas Usuario, Rol, Cargo, Estado, Alta y Acciones.

En la columna **Rol** aparece **Administrador** o **Usuario**. En la columna **Estado**, un usuario activo no muestra etiqueta de baja, y un usuario dado de baja muestra **Baja** en rojo.

Mensajes de la lista:

- **"No hay usuarios"** y **"Comienza agregando un nuevo usuario"**: no hay cuentas.
- **"No se encontraron usuarios"** y **"Prueba con otra busqueda"**: la busqueda no coincide.
- **"Error al cargar usuarios: ..."**: no se pudo consultar la lista.

## Crear un usuario

1. Pulse **Nuevo usuario**.
2. En la ventana **Nuevo usuario**, complete:
   - **Usuario**: entre 3 y 50 caracteres. Solo se permiten letras, numeros, punto, guion y guion bajo. Si no cumple, aparece "El usuario debe tener entre 3 y 50 caracteres" o "Solo se permiten letras, numeros, punto, guion y guion bajo".
   - **Contrasena**: entre 8 y 72 caracteres. Si no cumple, aparece "La contrasena debe tener entre 8 y 72 caracteres".
   - **Rol**: Usuario o Administrador.
   - **Cargo**.
   - **Empresa**: elija una de la lista o "Sin empresa".
3. Pulse **Guardar**. Mientras guarda, el boton dice "Guardando...".

Si todo sale bien, aparece el aviso "Usuario [nombre] creado correctamente".

## Editar un usuario

1. En la fila del usuario, pulse **Editar**.
2. En la ventana **Editar usuario**, puede cambiar el rol, el cargo, la empresa o la contrasena.
3. La contrasena es opcional al editar. Si la deja vacia, no se cambia.
4. Pulse **Guardar**. El aviso dice "Usuario [nombre] actualizado correctamente".

Cambiar la contrasena o el rol de una cuenta cierra sus sesiones abiertas. La persona tendra que volver a entrar con los datos nuevos.

## Cambiar la contrasena

El boton **Cambiar contrasena** de la fila (icono de llave) abre la misma ventana de edicion, para cambiar la contrasena del usuario.

## Dar de baja un usuario

1. En la fila del usuario, pulse el boton de dar de baja (icono de usuario con una X).
2. En la ventana **Dar de baja a [usuario]**, lea el texto: "Es una baja logica: el registro se conserva y puede verse activando 'Mostrar dados de baja'."
3. Confirme con el boton **Dar de baja**.

El aviso de exito dice "Usuario [nombre] dado de baja". La cuenta deja de poder entrar y sus sesiones quedan cerradas.

Reglas importantes:

- **No puede dar de baja su propia cuenta.** El boton aparece desactivado en su propia fila.
- Un usuario ya dado de baja no tiene el boton activo.
- Para ver las cuentas dadas de baja, marque **Mostrar dados de baja**.

Si el servidor rechaza la operacion, aparece el mensaje de error en la parte superior de la pantalla.

## Mensajes frecuentes

- **"Esta pantalla es solo para administradores."**: su cuenta no tiene el rol Administrador.
- **"No se pudo completar la operacion"**: el sistema no pudo terminar la accion. Intente de nuevo.
- Un aviso en verde confirma la accion. Un aviso en rojo indica un problema.
