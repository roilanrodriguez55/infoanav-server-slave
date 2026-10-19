# 6. Fallas

## Para que sirve

Una falla registra que una senal dejo de funcionar o funciona mal: cuando ocurrio, que la causo, quien la reporto y cuando se restablecio. Con esos datos el sistema calcula cuanto duro la falla, muestra las senales fuera de servicio en el Dashboard y alimenta las estadisticas.

Cada falla pertenece a una senal. Por eso conviene tener la senal registrada antes de cargar la falla.

## Como llegar

- Menu lateral: **Fallas** (grupo Modulos principales).
- Ruta del listado: `/gestion-fallas`.
- Desde el Dashboard, la tarjeta **Senales fuera de servicio** (enlace **Ver fallas**).
- Desde la ficha de una senal, pestana **Fallas**, con el enlace **Registrar falla**.

## Listado de fallas

### Que ve en pantalla

- Titulo **Gestion de Fallas** y el texto "Administre las fallas registradas en el sistema".
- Botones: **Fuera de servicio actualmente** (muestra solo las fallas abiertas), **Actualizar** y **Nueva Falla**.
- Filtros.
- Tabla con las columnas Senal, Fecha, Tipo, Causa, Reporto, Estado y Acciones.

La columna **Estado** muestra **Abierta** (sin fecha de restablecimiento) o **Restablecida** (con fecha de restablecimiento).

### Filtros

| Filtro | Que hace |
|---|---|
| Buscar | Busca en la causa, quien reporto y las observaciones. |
| Senal | Filtra por una senal concreta. |
| Tipo de falla | Filtra por el tipo del catalogo. |
| Origen | Filtra por el origen de la falla. |
| Estado | Todas, Abiertas o Restablecidas. |
| Fecha desde / Fecha hasta | Rango de fecha de la falla. |
| Limpiar filtros | Quita los filtros activos. |

Puede ordenar por Fecha, Causa y Reporto pulsando el titulo de la columna.

### Acciones de cada fila

- **Ver detalle de falla**: abre la ficha.
- **Editar falla**: abre el formulario.
- **Eliminar falla**: pide confirmacion. Esta disponible para los dos roles.

### Mensajes del listado

- **"No hay fallas"** y **"Comienza agregando una nueva falla"**: no hay registros.
- **"No se encontraron fallas"** y **"Prueba con otros filtros"**: los filtros no coinciden.
- Al eliminar, el aviso de exito es "Falla eliminada correctamente". Si falla, aparece "Error al eliminar: ..." o "Error al conectar con el servidor".

## Registrar una falla nueva

1. Pulse **Nueva Falla** en el listado, o use el enlace **Registrar falla** en la pestana Fallas de una senal. En el segundo caso, la senal llega ya elegida.
2. Complete las pestanas, que se describen abajo.
3. Pulse **Guardar Falla**.
4. Si se guarda, vuelve al listado.

### Pestanas del formulario

| Pestana | Campos |
|---|---|
| Datos Basicos | Senal, Fecha de Falla, Tipo de Falla y Causa de Falla. |
| Detalles | Fecha de Restablecimiento, Fecha Pronostico Restablecimiento, Origen de Falla, Falla Rescatada (casilla), Medidas Tomadas y Observaciones. |
| Responsables | Reporto, Transmite, ANAR y RG. |
| Tiempos | Duracion de Falla y Diferencia de Tiempo. Se calculan solos. |

Detalles de los campos:

- **Senal**: es obligatoria. Si no la elige, aparece el mensaje "La senal es requerida". Al elegirla, el formulario muestra un resumen de la senal y, si tiene fallas abiertas, el aviso "Esta senal ya tiene N falla(s) abierta(s)" con el enlace **Ver fallas de la senal**.
- **Aviso de baja**: si la senal fue dada de baja antes de la fecha de la falla, aparece el aviso "La senal fue retirada el ... ; la falla es posterior". Revise la fecha.
- **Fecha de restablecimiento**: no puede ser anterior a la fecha de falla. Si lo es, aparece "La fecha de restablecimiento no puede ser anterior a la fecha de falla".
- **Duracion de Falla**: se calcula con la fecha de falla y la de restablecimiento. Necesita ambas fechas.
- **Diferencia de Tiempo**: se calcula con la fecha pronosticada de restablecimiento y la de restablecimiento. Necesita ambas.
- **Reporto** y **Transmite**: nombre de quien reporta la falla y de quien la transmite.

### Botones del formulario

- **Guardar Falla** (nueva) o **Actualizar Falla** (edicion).
- **Cancelar** (en una falla nueva): regresa al listado sin guardar. En edicion, el boton se llama **Restaurar** y vuelve a cargar los datos guardados, descartando los cambios no guardados.

Si el guardado falla, aparece "Error al guardar: ..." y la falla no se modifica.

## Ficha de la falla

Se abre con **Ver detalle de falla**. Muestra el titulo "Falla del" seguido de la fecha de la falla.

Botones:

- **Volver**: regresa al listado.
- **Restablecer**: aparece solo mientras la falla esta abierta.
- **Editar**: abre el formulario de edicion.

Pestanas: **Datos Basicos**, **Detalles**, **Responsables**, **Tiempos** e **Historial** (cambios registrados sobre la falla).

## Restablecer una falla

Restablecer significa registrar que la senal volvio a funcionar. Es la forma correcta de cerrar una falla, porque el sistema calcula la duracion a partir de esa fecha.

1. Abra la ficha de la falla abierta.
2. Pulse **Restablecer**.
3. En la ventana **Restablecer falla**, revise o complete:
   - **Fecha de restablecimiento**. Por defecto aparece la fecha y hora actual.
   - **Medidas tomadas**. Viene con lo que ya estaba registrado.
   - **Observaciones**. Viene con lo que ya estaba registrado.
   - La casilla **Registrar mantenimiento de este restablecimiento**.
4. Pulse **Restablecer** dentro de la ventana. Mientras guarda, el boton muestra "Guardando...". Para salir sin cambios, pulse **Cancelar**.

Si marca la casilla, el sistema abre el formulario de **Nuevo Mantenimiento** con la senal, la falla y la fecha de fin ya cargadas. Si no la marca, la falla queda restablecida y la pantalla se actualiza.

Mensajes de esta ventana:

- **"Indique la fecha de restablecimiento"**: falta la fecha.
- **"La fecha de restablecimiento no puede ser anterior a la fecha de falla"**: revise las fechas.
- **"Error al restablecer la falla"** o el mensaje que devuelva el servidor.

## Mensajes frecuentes

- **"Falla no encontrada"**: el enlace apunta a una falla que no existe o fue eliminada. Vuelva al listado.
- **"Error al cargar los datos de la falla"**: no se pudo abrir la falla para editarla. El sistema regresa al listado.
- **"Error al cargar los catalogos"**: no se cargaron las listas desplegables. Recargue la pagina.
