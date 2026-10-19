# 18. Uso general: listas, filtros, formularios y fichas

Muchas pantallas de INFOANAV funcionan igual. Este archivo explica esos patrones comunes, para que no haga falta repetirlos en cada modulo. Los detalles propios de cada pantalla estan en sus archivos (04 a 17).

## Listas

Las listas (Senales, Fallas, Mantenimientos, Equipos, Hechos, Personal, Libros y otras) muestran los registros por paginas.

- **Paginacion**: al pie de la lista aparecen los controles para cambiar de pagina. Cada pagina muestra un numero fijo de registros (20 por defecto; pendiente de confirmar en cada modulo).
- **Consulta al servidor**: cada cambio de pagina, de orden o de filtro vuelve a consultar el servidor. Si la conexion es lenta, la lista puede mostrar "Cargando..." por un momento.
- **Orden**: pulse el titulo de una columna para ordenar por esa columna. Vuelva a pulsarlo para invertir el orden. Solo se pueden ordenar las columnas que tienen titulo pulsable.
- **Actualizar**: el boton recarga la lista con los datos mas recientes del servidor.
- **Registros dados de baja**: no aparecen en las listas, salvo en las vistas o filtros que los incluyen (por ejemplo, Senales en la vista Bajas, o Usuarios con la casilla Mostrar dados de baja).
- **Sin resultados**: si no hay registros, la lista dice "No hay ..." (no hay datos cargados). Si hay filtros activos y no coinciden, dice "No se encontraron ..." y sugiere cambiar los filtros.
- **Error de carga**: si la lista no se puede cargar, aparece el aviso "No se pudieron cargar los datos" con el boton **Reintentar**.

## Filtros y busqueda

- **Buscar**: el campo de busqueda busca por varios campos del modulo, indicados en el texto de ayuda. Espera un momento despues de escribir antes de buscar.
- **Desplegables**: cada filtro de catalogo tiene la opcion **Todos** (o **Todas**), que equivale a no filtrar. Algunos desplegables tienen su propio buscador ("Buscar ...") para encontrar valores en listas largas.
- **Limpiar filtros**: quita todos los filtros del modulo. El boton se desactiva cuando no hay ninguno activo.

Los caracteres especiales en el texto de busqueda (comas, parentesis, asteriscos, comillas y barras invertidas) se quitan automaticamente.

## Acciones de cada fila

Las filas de las listas tienen botones con un icono. Pase el puntero sobre el icono para ver su nombre, o use el nombre que se indica en cada archivo del manual.

- Ver detalle: abre la ficha del registro.
- Editar: abre el formulario de ese registro.
- Eliminar o dar de baja: pide confirmacion antes de actuar.

## Confirmaciones

Antes de eliminar o dar de baja algo, aparece una ventana de confirmacion con el titulo "Esta seguro?" o una pregunta equivalente. Tiene dos botones:

- **Cancelar**: cierra la ventana sin cambiar nada.
- El boton de accion (por ejemplo **Eliminar**, **Dar baja** o **Confirmar baja**): realiza la operacion.

Mientras la operacion se procesa, los botones quedan desactivados. No cierre la ventana hasta que termine.

Lea el texto de la ventana antes de confirmar. Algunas ventanas indican si la accion se puede deshacer.

## Formularios

- **Campos obligatorios**: en los formularios que lo indican, se marcan con un asterisco rojo (*). Si falta un dato obligatorio, el formulario no se guarda y muestra un mensaje junto al campo.
- **Mensajes de validacion**: aparecen debajo del campo que tiene el problema. Corrija ese campo y vuelva a guardar.
- **Fechas y horas**: use los selectores de fecha y hora del navegador.
- **Numeros**: escriba solo cifras en los campos numericos.
- **Pestanas**: algunos formularios estan divididos en pestanas. Un dato puede estar en otra pestana distinta a la que se abre primero. Revise todas antes de guardar.
- **Guardar**: el boton del formulario guarda el registro. Mientras guarda, dice "Guardando...".
- **Cancelar o Restaurar**: en el formulario de una falla nueva, **Cancelar** vuelve a la lista sin guardar. En una falla existente, el boton **Restaurar** descarta los cambios no guardados. Otros formularios tienen botones parecidos (pendiente de confirmar en cada caso).

### Desplegables de seleccion

Los desplegables de senal, tipo, empresa, buque y otros valores del catalogo permiten buscar escribiendo. Si la lista no tiene el valor que necesita, no lo escriba a mano: pida al administrador que lo agregue en Catalogos (ver el archivo 16).

Si aparece el mensaje "No se encontraron ..." dentro de un desplegable, el valor no esta en la lista.

### Avisos despues de guardar

Los avisos aparecen de dos formas:

- Como un recuadro dentro de la pantalla, generalmente arriba, en verde (correcto) o en rojo (error).
- Como una ventana emergente del navegador, con un texto corto. Algunos formularios de senales, fallas y mantenimientos la usan.

Si el aviso indica un error, lea el texto antes de volver a intentarlo. El texto suele indicar que dato revisar.

## Fichas y detalle

Una ficha muestra un registro en solo lectura, organizado en pestanas. Desde la ficha se llega al formulario con el boton **Editar**, y se vuelve al listado con **Volver**.

Las fichas de senal, falla y mantenimiento tienen una pestana **Historial**. Muestra los cambios que se hicieron sobre el registro, ordenados del mas reciente al mas antiguo, con un maximo de 50. El historial solo se consulta: no se puede modificar.

## Notas generales

- **Tema claro y oscuro**: el boton de la cabecera cambia el tema de la pantalla.
- **Menu contraido**: la forma en que deja el menu lateral (contraido o expandido) se recuerda en su navegador.
- **Sesion**: si la sesion se cierra, vuelva a entrar. Revise el archivo 01 para ver cuando ocurre esto.
- **Datos no guardados**: si cambia de pantalla antes de guardar, los cambios se pierden. Guarde antes de salir.
- **Exportar**: en el modulo Estadisticas, los botones Exportar Excel y Exportar PDF generan un archivo con el resultado de la consulta.
