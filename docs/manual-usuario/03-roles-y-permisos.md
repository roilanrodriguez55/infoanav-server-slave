# 3. Roles y permisos

INFOANAV tiene dos roles. El rol se asigna a cada cuenta cuando la crea el administrador, y se muestra debajo del nombre de usuario en la cabecera.

| Rol | Texto que aparece en pantalla |
|---|---|
| Administrador | "Administrador" |
| Usuario | "Usuario" |

Un usuario puede tener solo un rol. Para cambiarlo, el administrador edita la cuenta en el modulo Usuarios. Al cambiar el rol, las sesiones abiertas de esa cuenta se cierran y la persona tiene que volver a entrar.

## Resumen

| Accion | Usuario | Administrador |
|---|---|---|
| Entrar al sistema y ver el Dashboard | Si | Si |
| Consultar senales, fallas, mantenimientos, equipamiento, hechos, flota, documentacion, estadisticas y calculos | Si | Si |
| Crear y editar senales, fallas, mantenimientos y registros de los modulos operativos | Si | Si |
| Dar de baja una senal, una persona u otro registro (baja logica) | Si | Si |
| Eliminar una senal desde la lista | No | Si |
| Reactivar una senal dada de baja | No | Si |
| Reactivar una persona dada de baja | No | Si |
| Crear y editar modelos de equipamiento | No | Si |
| Ver y usar el modulo Usuarios | No | Si |
| Ver y usar el modulo Catalogos | No | Si |
| Crear valores nuevos en catalogos abiertos (temas, paises, editoriales) | Si | Si |
| Editar o dar de baja valores de catalogos abiertos | No | Si |
| Editar o dar de baja valores de los demas catalogos | No | Si |

Los catalogos "cerrados" (por ejemplo tipos de senal, zonas, estados o materiales) solo se leen para el rol usuario. Los valores nuevos los agrega el administrador desde Catalogos.

## Que ve cada rol en el menu

- **Usuario**: Dashboard, Senales, Mantenimientos, Fallas, Equipamiento, Hechos extraordinarios, Documentacion, Estadisticas, Calculos y Flota y personal.
- **Administrador**: todo lo anterior, mas **Usuarios** y **Catalogos**, en el grupo Administracion.

Si un usuario escribe en la barra del navegador la direccion de Usuarios o de Catalogos, la aplicacion lo devuelve al Dashboard.

## Que hace el usuario y que no

### Lo que puede hacer el rol usuario

- Consultar cualquier informacion del sistema.
- Registrar senales nuevas, editar senales, registrar fallas y mantenimientos, y editar esos registros.
- Dar de baja una senal o una persona. La baja no borra el registro: lo deja fuera de las listas activas y conserva su historial.
- Agregar valores nuevos en los catalogos abiertos (temas, paises y editoriales).
- Consultar el historial de cambios de un registro.

### Lo que no puede hacer el rol usuario

- Entrar a Usuarios o a Catalogos.
- Eliminar una senal. El boton de eliminar no aparece en la lista para este rol. El servidor tambien lo rechaza.
- Reactivar una senal que fue dada de baja. El boton **Reactivar** no aparece para este rol. El servidor tambien lo rechaza.
- Reactivar una persona dada de baja. El boton **Reactivar** no aparece para este rol. El servidor tambien lo rechaza.
- Crear o editar modelos de equipamiento.
- Modificar o dar de baja valores de catalogos que no sean abiertos.
- Escribir en el historial de cambios. El historial solo se consulta.

Si una accion no esta permitida, el sistema muestra un mensaje de error o la accion no aparece en pantalla. El detalle del mensaje que se ve en cada caso esta en la seccion del modulo correspondiente.

## Acciones que solo hace el administrador

1. Gestionar cuentas en el modulo Usuarios: crear, editar el rol, cambiar la contrasena y dar de baja.
2. Administrar catalogos: agregar, renombrar y dar de baja valores.
3. Eliminar senales.
4. Reactivar senales dadas de baja y personas dadas de baja.
5. Crear y editar modelos de equipamiento.
6. Editar o dar de baja valores de los catalogos abiertos.

## Que pasa al cambiar un permiso

- Los permisos se aplican en el servidor. Ocultar un boton en pantalla es solo una ayuda visual: el servidor es el que decide si una accion se acepta.
- Un cambio de rol o de contrasena cierra las sesiones de esa cuenta. La persona tiene que volver a entrar con sus datos nuevos.
- Si la cuenta ya tenia una sesion abierta, el rol anterior puede seguir vigente hasta 15 minutos despues del cambio. Pasado ese tiempo, el sistema usa el rol nuevo.

## Consultas frecuentes

- **No veo la opcion Usuarios ni Catalogos.** Su cuenta tiene el rol Usuario. Pida al administrador que revise su rol si necesita esos modulos.
- **No aparece el boton Eliminar en la lista de senales.** Es normal con el rol Usuario. Para dar de baja una senal, use la opcion de baja del modulo.
- **Un cambio no se guarda y aparece un error de permiso.** Revise con el administrador si su rol permite esa accion.
