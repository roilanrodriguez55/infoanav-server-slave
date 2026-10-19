# 7. Mantenimientos

## Para que sirve

Este modulo registra los trabajos que se hicieron a una senal: que se hizo, cuando, cuanto duro, quien lo ejecuto y cuanto costo. Un mantenimiento puede venir de un plan planificado (ver el archivo 08) o de una falla que se acaba de restablecer (ver el archivo 06). Tambien puede registrarse sin ninguno de los dos casos.

## Como llegar

- Menu lateral: **Mantenimientos** (grupo Modulos principales).
- Ruta del listado: `/gestion-mant`.
- Para planificar trabajos, use el enlace **Plan** de la parte superior del listado (ruta `/plan-mantenimiento`).
- Desde el Dashboard, en la seccion **Mantenimientos proximos**.

## Listado de mantenimientos

### Que ve en pantalla

- Titulo **Gestion de Mantenimientos** y el texto "Administre los mantenimientos de las senales maritimas".
- En la parte superior, dos vistas: **Realizados** (la actual) y **Plan**.
- Botones **Actualizar** y **Nuevo Mantenimiento**.
- Filtros.
- Tabla con las columnas ID, Senal, Tipo, Fecha Inicio, Tiempo, Trabajo Realizado, Responsable, Costo MN y Acciones.

### Filtros

| Filtro | Que hace |
|---|---|
| Buscar | Busca en el identificador, el trabajo realizado y el responsable. |
| Senal | Filtra por una senal concreta. |
| Tipo de mantenimiento | Filtra por el tipo del catalogo. |
| Estado de la senal | Filtra por el estado de la senal al momento del trabajo. |
| Fecha desde / Fecha hasta | Rango de fecha de inicio. |
| Costo MN | Filtro de costo en moneda nacional. |
| Limpiar filtros | Quita los filtros activos. |

Puede ordenar por ID, Fecha Inicio, Trabajo Realizado y Costo MN.

### Acciones de cada fila

- **Ver detalle de mantenimiento**: abre la ficha.
- **Editar mantenimiento**: abre el formulario.
- **Eliminar mantenimiento**: pide confirmacion. Disponible para los dos roles. La ventana dice "Esta accion eliminara permanentemente el mantenimiento" y "no se puede deshacer".

### Mensajes del listado

- **"No hay mantenimientos"** y **"Comienza agregando un nuevo mantenimiento"**: no hay registros.
- **"No se encontraron mantenimientos"**: los filtros no coinciden.
- Si la carga falla, aparece el aviso con el boton **Reintentar**.

## Registrar un mantenimiento

1. Pulse **Nuevo Mantenimiento** en el listado.
2. Complete las pestanas. Los campos se describen abajo.
3. Pulse **Guardar Mantenimiento**.
4. Si se guarda, vuelve al listado.

Al abrirlo desde un plan o desde el restablecimiento de una falla, el formulario llega con la senal, el tipo, el trabajo y la fecha de fin ya cargados. Puede cambiar cualquier dato antes de guardar.

### Pestanas del formulario

| Pestana | Campos |
|---|---|
| Informacion General | Senal, Tipo de Mantenimiento, Identificador Mantenimiento, Estado de la Senal, Medio utilizado (Buque o Vehiculo), Falla asociada (solo lectura) y Descripcion del Trabajo. |
| Fechas y Tiempos | Fecha Inicio, Fecha Finalizacion, Tiempo Empleado (se calcula con las fechas) y Quien aseguro el trabajo. |
| Costos | Costo MN, Costo MLC, consumo de diesel y de gasolina (en litros). |
| Responsables | Quien informa, Quien transmite, Numero RG, Numero de orden y Quien introdujo. |

Detalles de los campos:

- **Medio utilizado**: se elige **Buque** (de la flota) o **Vehiculo**. Son excluyentes: elegir uno desactiva el otro.
- **Falla asociada**: aparece cuando el mantenimiento viene de una falla. Muestra fecha de falla, tipo y causa. Solo se lee.
- **Tiempo Empleado**: se calcula solo a partir de las fechas.

### Avisos del formulario

- **"La fecha de finalizacion no puede ser anterior a la fecha de inicio"**: corrija las fechas.
- **"La senal fue retirada el ... y este mantenimiento es posterior a esa fecha."**: el trabajo es posterior a la baja de la senal. Revise las fechas o la senal elegida.
- **"Este plan ya esta cumplido. El mantenimiento se registrara sin modificar el plan."**: el plan que llego ya tenia fecha de cumplimiento. El mantenimiento se guarda igual y el plan no cambia.
- **"No se encontro el plan de mantenimiento. Se registrara sin plan."**: el plan indicado no existe. El mantenimiento se guarda sin vinculo.
- **"No se pudo marcar el plan como cumplido."**: el mantenimiento se guardo, pero el plan no se actualizo. Marquelo desde el modulo de plan.
- **"Error al guardar: ..."**: el servidor rechazo el guardado.

## Ficha del mantenimiento

Se abre con **Ver detalle de mantenimiento**. Si el registro no existe, aparece "Mantenimiento no encontrado" con el boton para volver.

- Muestra el estado de la senal como etiqueta.
- Botones: **Volver** (al listado) y **Editar**.
- Pestanas: **Informacion General**, **Fechas y Tiempos**, **Costos**, **Responsables** e **Historial** (cambios registrados).

## Mensajes frecuentes

- **"Error al cargar los datos del mantenimiento"** o aviso de carga fallida: recargue o use **Reintentar**.
- **"Error al conectar con el servidor"**: revise la conexion.
