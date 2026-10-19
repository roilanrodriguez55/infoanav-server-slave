# 1. Introduccion y acceso

## Que es INFOANAV

INFOANAV es el sistema de gestion de senales maritimas. Desde una sola aplicacion se registran y consultan las senales, sus equipos, las fallas que presentan, los mantenimientos que se les hacen y los hechos extraordinarios que las afectan. Tambien incluye la flota y el personal, la documentacion, las estadisticas y los calculos.

Todo el contenido se guarda en el servidor. La aplicacion se usa desde el navegador de su computadora, sin instalar nada.

## Para quien es

El manual esta escrito para el personal que consulta o registra informacion en el sistema. No hace falta saber programacion. Cada paso indica que ve en pantalla y que debe hacer.

Segun su cuenta, vera todas las pantallas o solo algunas. Los permisos de cada rol estan explicados en el archivo [03-roles-y-permisos.md](03-roles-y-permisos.md).

## Como entrar al sistema

1. Abra en su navegador la direccion de INFOANAV que le indico el administrador. La direccion exacta depende de cada instalacion (pendiente de confirmar para el manual general).
2. Aparece la pantalla de acceso, con el titulo **InfoANAV** y el texto "Ingresa tus credenciales para acceder al sistema".
3. En el campo "Ingrese su usuario", escriba su nombre de usuario.
4. En el campo "Ingrese su contrasena", escriba su contrasena. Para ver lo que escribio, pulse el icono del ojo. Para ocultarla de nuevo, pulselo otra vez.
5. Pulse el boton **Iniciar Sesion**. Mientras el sistema responde, el boton muestra "Iniciando sesion...".
6. Si los datos son correctos, entra a la pantalla principal (Dashboard).

Si el usuario o la contrasena no son validos, la pantalla muestra un aviso en rojo. Corrija los datos y vuelva a intentarlo.

### Mensajes de la pantalla de acceso

| Mensaje | Que significa | Que hacer |
|---|---|---|
| "Por favor complete todos los campos" | Falta el usuario o la contrasena. | Escriba los dos campos y vuelva a pulsar el boton. |
| "Credenciales incorrectas" | El usuario o la contrasena no coinciden. Si el servidor envia un texto propio, ese texto es el que aparece. | Revise las mayusculas y minusculas. Si el problema continua, pida al administrador que revise su cuenta. |
| "No se pudo conectar. Verifique la red o intente mas tarde." | La aplicacion no llego al servidor. | Revise su conexion. Si la red funciona, avise al administrador. |

El servidor limita la cantidad de intentos fallidos. El texto que aparece al superar ese limite y el tiempo de espera son pendientes de confirmar.

## Como cerrar sesion

1. En la parte superior derecha de la pantalla esta el nombre de su usuario, con su rol debajo ("Administrador" o "Usuario").
2. Pulse el boton **Cerrar sesion**, a la derecha de ese nombre.
3. La aplicacion vuelve a la pantalla de acceso.

Cierre la sesion al terminar, sobre todo si usa un equipo compartido.

## Que pasa si la sesion expira

- La aplicacion renueva la sesion sola, en segundo plano. Por eso no aparece un contador ni un aviso de vencimiento, y es normal seguir trabajando sin volver a escribir la contrasena.
- Recargar la pagina (F5) no cierra la sesion. Se mantiene mientras la renovacion automatica siga funcionando.
- Si la renovacion no es posible, la aplicacion lo lleva a la pantalla de acceso. Esto puede pasar en estos casos:
  - Paso el tiempo maximo de sesion que define el servidor (por defecto, 7 dias; pendiente de confirmar el valor de la instalacion).
  - Su contrasena o su rol cambio, o su cuenta fue dada de baja. Al cambiar la contrasena o el rol, el sistema cierra las sesiones abiertas.
  - Abrio INFOANAV en dos pestanas del mismo navegador y ambas renovaron la sesion a la vez. En ese caso se cierra la sesion por seguridad. Use una sola pestana.
- Cuando esto ocurre, la aplicacion no muestra un aviso previo. Si estaba llenando un formulario, los datos no guardados se pierden. Guarde con frecuencia.

## Recorrido de la pantalla principal

Al entrar, la pantalla se divide en tres zonas.

### Menu lateral (izquierda)

Contiene los modulos del sistema, agrupados asi:

- Sin grupo: **Dashboard** (pantalla de inicio).
- **Modulos principales**: Senales, Mantenimientos, Fallas, Equipamiento y Hechos extraordinarios.
- **Consulta y gestion**: Documentacion, Estadisticas, Calculos y Flota y personal.
- **Administracion**: Usuarios y Catalogos. Solo los ve el rol administrador.

Pulse un nombre para abrir ese modulo. La opcion activa queda resaltada.

El menu puede contraerse o expandirse con el boton de tres lineas que esta en la cabecera. Esta preferencia se guarda en el navegador de su equipo. En pantallas pequenas, el menu se abre sobre el contenido con ese mismo boton.

### Cabecera (parte superior)

De izquierda a derecha, encontrara:

- El boton de tres lineas, para mostrar u ocultar el menu lateral.
- El logo y el nombre INFOANAV (en pantallas pequenas).
- Un boton para cambiar entre tema claro y tema oscuro.
- El icono de campana, para **Notificaciones**. El panel tiene un enlace "Ver todas las notificaciones" que lleva al Dashboard. En el codigo actual no aparece una lista de avisos dentro del panel (pendiente de confirmar).
- Su nombre de usuario y su rol.
- El boton **Cerrar sesion**.

### Area de contenido (centro)

Muestra la pantalla del modulo que eligio. Cada modulo tiene su propio titulo, filtros y botones de accion. Los detalles de cada uno estan en los archivos de la seccion 4 en adelante.
