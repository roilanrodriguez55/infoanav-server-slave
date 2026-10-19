# 5. Senales

## Para que sirve

Este modulo es el centro del sistema. Aqui se registran las senales maritimas, se consultan sus datos y se les da de baja cuando salen de servicio. Desde la ficha de cada senal se llega a sus fallas, mantenimientos, hechos, RACON, pronostico, fondeo, LMF e historial de cambios.

## Como llegar

- Menu lateral: **Senales** (grupo Modulos principales).
- Ruta del listado: `/gestion-senales`.
- Desde el Dashboard, el enlace **Ver todas ↗** de la seccion Senales que requieren accion.

Pantallas de este modulo:

| Pantalla | Como se llega |
|---|---|
| Listado de senales | Menu Senales |
| Ficha de la senal | Boton **Ver detalle de senal** (icono de ojo) en el listado |
| Nueva senal | Boton **Nueva Senal** en el listado |
| Editar senal | Boton **Editar senal** (icono de lapiz) en el listado, o **Editar** en la ficha |

## Listado de senales

### Que ve en pantalla

- Titulo **Senales Maritimas** y el texto "Gestion de senales maritimas del sistema".
- Botones de la parte superior: **Actualizar**, **Radioelectricas** (lleva al modulo de RACON) y **Nueva Senal**.
- Cuatro vistas rapidas: **Activas**, **Ciegas**, **Luminicas** y **Bajas**. La vista activa aparece resaltada.
- Filtros.
- Tabla con las columnas Codigo LSM, Nombre, Tipo, Ubicacion, Luminica, Estado, Fecha Creacion y Acciones.

En la vista **Bajas**, las columnas Ubicacion y Estado cambian a **Fecha de retirada** y **Causa**.

### Vistas

| Vista | Que muestra |
|---|---|
| Activas | Senales que no estan dadas de baja. |
| Ciegas | Senales que no son luminicas. |
| Luminicas | Senales luminicas. |
| Bajas | Senales dadas de baja (con fecha de retirada). |

### Filtros

Los filtros se consultan en el servidor, asi que cada cambio actualiza el listado.

| Filtro | Que hace |
|---|---|
| Buscar | Busca en codigo LSM, nombre y ubicacion. Texto de ayuda: "Buscar por codigo, nombre o ubicacion". |
| Tipo, Estado, Zona, Empresa, Estacion, Categoria | Filtra por el valor elegido del catalogo. |
| Usuario de navegacion, Color de luz | Filtra por esos catalogos. |
| Luminica | Si, No o Todas. Aparece en las vistas Activas y Bajas. |
| Bajas | Excluir o Incluir las senales dadas de baja. No aparece en la vista Bajas. |
| Creacion desde / Creacion hasta | Rango de fecha de creacion. |
| Limpiar filtros | Quita todos los filtros. Se desactiva si no hay ninguno activo. |

Los filtros que no tienen valor se ignoran. Las senales dadas de baja no aparecen en las vistas que no sean Bajas, salvo que se incluyan con el filtro Bajas.

Puede ordenar la tabla pulsando el titulo de las columnas Codigo LSM, Nombre, Ubicacion, Luminica y Fecha Creacion.

### Acciones de cada fila

- **Ver detalle de senal**: abre la ficha. Disponible para todos.
- **Editar senal**: abre el formulario. No aparece en la vista Bajas.
- **Eliminar senal**: solo aparece para el administrador. Ver la seccion "Eliminar una senal".

### Mensajes del listado

- **"No hay senales"**: no hay registros. Si no hay filtros activos, el texto invita a agregar una senal nueva.
- **"No se encontraron senales"** y **"Prueba con otros filtros"**: los filtros no coinciden con ninguna senal.

## Registrar una senal nueva

1. En el listado, pulse **Nueva Senal**.
2. Aparece la pantalla **Nueva Senal** con el texto "Registre una nueva senal en el sistema".
3. En la parte superior, escriba el **Codigo LSM** (campo "Ingrese codigo LSM").
4. Elija el **Tipo de Senal** en el desplegable. Puede escribir en el buscador "Buscar tipo...".
5. Complete las pestanas (ver la seccion siguiente).
6. Pulse **Guardar Senal**.
7. El sistema muestra el aviso "Senal guardada correctamente" y vuelve al listado.

Si el tipo de senal es **faro** o **farola**, aparece la etiqueta "Modo Faro" junto al encabezado del formulario. Si es **boya**, se activa la pestana Sistema de Fondeo.

### Pestanas del formulario

| Pestana | Que contiene |
|---|---|
| Datos Generales | Nombre, categoria, modelo, estacion, usuario de navegacion, zona, estado de la senal, material, energia, marca de tope, complejidad, fecha de instalacion, monitoreo, observaciones y las casillas Luminica, Secreta, Reflector Radar, Repeticion y Control a distancia. |
| Datos Geograficos | Color, forma, mar, altura, elevacion, profundidad, alcance geografico, latitud, longitud y descripcion de la ubicacion. |
| Datos Luminicos | Color de luz, caracteristica, alcance luminico, intensidad luminica, periodo, oscuridad, tiempo de luz, potencia y voltaje del bombillo, y consumo del destellador. Solo se activa si la senal es luminica. |
| Equipamiento | Lista de equipos de la senal, con tipo, nombre y cantidad. Solo se activa si la senal es luminica. |
| Sistema de Fondeo | Cadenas, pesos muertos, bridas y grilletes. Solo aplica a boyas. |

Los campos de latitud y longitud muestran un ejemplo de formato dentro del propio campo.

### Mensajes del formulario

- **"El codigo LSM es requerido"**: el codigo LSM esta vacio.
- **"Ya existe una senal con el codigo LSM «...»"**: el codigo ya esta en uso. Cambielo o busque la senal existente.
- **"Error al guardar: ..."**: el servidor rechazo el guardado. Lea el mensaje que aparece.
- **"Error al cargar los datos de la senal"**: no se pudo abrir la senal para editarla. Vuelva al listado e intente de nuevo.

## Editar una senal

1. Desde el listado, pulse **Editar senal** en la fila, o desde la ficha pulse **Editar**.
2. El formulario aparece con los datos cargados. El titulo es **Editar Senal** y el texto "Modifique los datos de la senal".
3. Cambie lo que necesite y pulse **Actualizar Senal**.

Una senal dada de baja no se puede editar. En su lugar aparece el cuadro **Senal dada de baja** con el texto "Esta senal esta dada de baja y no se puede editar" y el boton **Ver ficha de la senal**. Para modificarla, el administrador debe reactivarla primero.

## Ficha de la senal

Se abre con **Ver detalle de senal**. Muestra los datos de la senal en pestanas de solo lectura.

### Botones de la ficha

- **Volver**: regresa al listado.
- **Editar**: abre el formulario de edicion. No aparece para senales dadas de baja.
- **Dar baja**: aparece solo si la senal no esta dada de baja.
- **Reactivar**: aparece solo para el administrador, si la senal esta dada de baja.

### Pestanas de la ficha

- **Datos Generales**, **Datos Geograficos**: los mismos datos del formulario.
- **Datos Luminicos**, **Equipamiento**, **Pronostico**: solo activas si la senal es luminica.
- **Sistema de Fondeo**: solo activa si la senal es boya.
- **Fallas**: fallas de la senal. Desde esta pestana se registra una falla nueva con el enlace **Registrar falla**, que abre el formulario con la senal ya elegida.
- **Mantenimientos**: mantenimientos de la senal.
- **Radioelectrico**: RACON instalados en la senal (ver el archivo 11).
- **LMF**: operaciones de leva, mantenimiento y fondeo. Solo activa si la senal es boya.
- **Hechos**: hechos extraordinarios de la senal (ver el archivo 10).
- **Historial**: cambios registrados sobre la senal.

## Dar de baja una senal

La baja marca la senal como retirada. No la borra. La senal sale de las vistas activas y pasa a la vista **Bajas**.

1. En la ficha de la senal, pulse **Dar baja**.
2. En la ventana **Dar de baja la senal**, complete:
   - **Fecha de retirada**. Si la deja vacia, el sistema usa la fecha de hoy.
   - **Causa de retirada**.
3. Pulse **Dar de baja** y espere a que termine **Guardando...**.

Si la senal tiene fallas abiertas, la ventana lo indica con el texto "Esta senal tiene N falla(s) abierta(s). La baja no las cierra." Revise esas fallas despues de dar de baja.

Un usuario con rol Usuario puede dar de baja una senal. Solo el administrador puede reactivarla.

### Reactivar una senal (solo administrador)

1. Abra la ficha de la senal dada de baja.
2. Pulse **Reactivar**.
3. Confirme en la ventana **Reactivar la senal?**.

## Eliminar una senal (solo administrador)

El boton **Eliminar senal** aparece en el listado solo para el administrador.

1. Pulse **Eliminar senal** en la fila.
2. La ventana **Esta seguro?** muestra el codigo o nombre de la senal.
3. Confirme para eliminarla. El aviso de exito es "Senal eliminada correctamente".

Aclaracion: el texto de la ventana dice que la eliminacion es permanente y que no se puede deshacer. En el codigo, la eliminacion marca el registro como borrado y deja de mostrarse en las listas. Si el administrador necesita recuperarla, debe consultarlo con el responsable tecnico (pendiente de confirmar como se restaura).

Si la eliminacion falla, aparece "Error al eliminar: ..." o "Error al conectar con el servidor".

Si un usuario con rol Usuario intenta eliminar una senal por otra via, el servidor tambien lo rechaza.

## Mensajes frecuentes

- **"Senal dada de baja"** en la pantalla de edicion: la senal no se puede modificar hasta que el administrador la reactive.
- **"Error al conectar con el servidor"**: revise la conexion y vuelva a intentar.
- Si el listado muestra "No se pudieron cargar los datos": el servidor no respondio. Recargue la pagina.
