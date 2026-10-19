# 9. Equipamiento

## Para que sirve

Este modulo guarda el inventario de los equipos instalados en las senales: sus numeros de inventario, modelo, empresa, ubicacion actual y vida util. Tambien reune las alertas de equipos que cumplieron su vida util o estan fuera de servicio, el registro de los grupos electrogenos (plantas de energia) y el catalogo de modelos.

## Como llegar

- Menu lateral: **Equipamiento** (grupo Modulos principales).
- Ruta: `/equipamiento`.
- Desde el Dashboard, la tarjeta **Equipos con vida util cumplida**, con el enlace **Ver alertas de equipamiento**, que abre la pestana Alertas.

La pantalla tiene cuatro pestanas: **Inventario**, **Alertas**, **Grupos electrogenos** y **Modelos**. Se abre en Inventario.

## Pestana Inventario

### Que ve en pantalla

- Una fila de pestanas, una por cada tipo de equipamiento del catalogo. Elija el tipo para ver sus equipos.
- Filtros.
- Boton **Nuevo equipo**.
- Un contador con el total ("N equipos") o el aviso "Sin equipos registrados con estos filtros".
- Tabla con las columnas Inventario, LSM actual, Modelo, Empresa, Ubicacion y Vida util, y la columna de estado F/S.

En la columna de estado:

- **F/S** (rojo): fuera de servicio.
- **En servicio**: en servicio.

En la columna Vida util aparece **Cumplida** (rojo) cuando la vida util del equipo ya se cumplio.

### Filtros

Los filtros se consultan en el servidor. Los disponibles son:

- Inventario (numero de inventario).
- Empresa.
- Modelo.
- Proveedor.
- Ubicacion.
- F/S: Fuera de servicio o En servicio.
- Vida util.
- Inicio de servicio: desde y hasta.
- Limpiar filtros.

### Registrar un equipo nuevo

1. Elija el tipo de equipo en las pestanas de la parte superior.
2. Pulse **Nuevo equipo**.
3. En la ventana, complete los datos. Las secciones son:
   - **Identificacion**: numero de inventario, tipo, modelo, empresa y LSM inicial (la senal donde se instala, con el texto "Seleccione una senal").
   - **Adquisicion y vida util**: proveedor, inicio de servicio, garantia y vida util.
   - **Observaciones**.
4. Pulse **Crear equipo**.

Para cambiar un equipo existente, pulselo en la tabla y use **Editar** en la ficha. El boton de guardado dice **Guardar cambios**.

### Ficha del equipo

Al pulsar una fila se abre la ficha del equipo, con estos datos:

- **Ubicacion actual**: la ubicacion del medio y la fecha desde la que esta alli. Si no tiene, muestra "Sin ubicacion".
- **Historial de ubicaciones**: cada cambio con su ubicacion y fechas. Si no hay registros, muestra "Sin ubicaciones registradas.".

Botones de la ficha:

- **Editar**: abre el formulario del equipo.
- **Cambiar ubicacion**: abre la ventana para mover el equipo.
- **Eliminar** (en rojo): pide confirmacion con "Eliminar equipo?". Disponible para los dos roles.

### Cambiar la ubicacion de un equipo

1. En la ficha, pulse **Cambiar ubicacion**.
2. En **Nueva ubicacion**, elija la ubicacion. Puede buscar con el campo "Buscar".
3. Pulse **Cambiar ubicacion** para confirmar. Mientras guarda, el boton dice "Guardando...".

El cambio queda en el historial de ubicaciones del equipo.

Mensajes:

- **"No se pudo cargar el historial de ubicaciones"**: la consulta del historial fallo. Recargue la ficha.

## Pestana Alertas

Muestra los tipos de equipo que tienen equipos con alertas, con dos contadores por tipo:

- **Vida util cumplida**: equipos cuya vida util ya se cumplio.
- **Fuera de servicio**: equipos marcados como fuera de servicio.

Si no hay ningun equipo con alertas, aparece "No hay equipos con alertas.".

Use esta pestana como lista de trabajo: revise cada equipo en el Inventario, decida si debe reemplazarse o repararse, y actualice su estado o su ubicacion.

## Pestana Grupos electrogenos

Registra las plantas de energia de las senales.

### Que ve en pantalla

- Titulo **Grupos electrogenos** y el texto "Plantas de energia de las senales maritimas y sus fallas".
- Boton **Nueva planta**.
- Filtros y un listado con paginacion. Si no hay resultados, aparece "No hay plantas registradas." o "No se encontraron plantas con esos filtros.".

### Ficha de la planta

Muestra Marca, Modelo, Numero, Inventario, Serie, Empresa, Potencia, Consumo, Voltaje, Frecuencia y Observaciones.

Botones:

- **Editar datos**: abre el formulario de la planta.
- **Registrar falla**: registra que la planta quedo fuera de servicio.

### Registrar una falla de planta

1. Pulse **Registrar falla**.
2. En la ventana, indique la fecha. El texto dice: "La planta queda fuera de servicio desde la fecha indicada.".
3. Confirme.

La ficha muestra una tabla con las fallas de la planta, su fecha de fuera de servicio, su fecha de restablecimiento y el tiempo transcurrido. Si la planta no tiene fecha de restablecimiento, el tiempo se calcula hasta hoy.

## Pestana Modelos

Es el catalogo de modelos por tipo de equipamiento.

- Todos los roles pueden consultar la lista.
- **Nuevo modelo** aparece solo para el administrador.
- Solo el administrador puede abrir un modelo para editarlo. Para el rol Usuario, las filas no responden al clic.

En el formulario de modelo, el administrador completa Nombre (obligatorio), Tipo de equipamiento (obligatorio), Pais, Consumo, Voltaje y Vatios. El boton de guardado dice **Crear modelo** o **Guardar cambios**.

Para eliminar un modelo, el administrador pulsa **Eliminar** y confirma en "Eliminar modelo?". El modelo deja de aparecer en el catalogo.

## Mensajes frecuentes

- **"Sin equipos registrados con estos filtros"** o **"No hay equipos de este tipo."**: no hay equipos que mostrar. Cambie los filtros o cree un equipo nuevo.
- **"No se encontraron equipos con esos filtros."**: los filtros no coinciden.
- **"No hay equipos con alertas."**: no hay alertas para mostrar.
- **"Cargando modelos..."**: espere a que termine la carga.
