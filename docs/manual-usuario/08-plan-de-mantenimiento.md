# 8. Plan de Mantenimiento

## Para que sirve

El plan sirve para programar trabajos de mantenimiento en una fecha determinada. Cada plan indica la senal, el tipo de trabajo, la fecha planificada y lo que hay que hacer. Cuando el trabajo se realiza, se registra como mantenimiento desde el propio plan, y el plan queda marcado como cumplido.

El plan no reemplaza el registro del mantenimiento. Son dos pasos: planificar y, despues, registrar lo realizado (ver el archivo 07).

## Como llegar

- Desde el modulo **Mantenimientos**, en la parte superior, pulse **Plan**.
- Desde el Dashboard, la tarjeta **Planes de mantenimiento vencidos**, con el enlace **Ver plan de mantenimiento**.
- Ruta directa: `/plan-mantenimiento`.

No aparece como opcion independiente en el menu lateral.

## Que ve en pantalla

- Titulo **Plan de Mantenimiento** y el texto "Planifique los mantenimientos de las senales maritimas".
- En la parte superior, las vistas **Realizados** (lleva al listado de mantenimientos) y **Plan** (la actual).
- Boton **Planificar**, para crear un plan nuevo.
- Dos pestanas: **Calendario** y **Lista**.
- Un aviso en verde o rojo despues de cada accion (por ejemplo, al guardar o eliminar).

## Estados de un plan

El estado no se elige a mano. El sistema lo calcula:

| Estado | Cuando aparece |
|---|---|
| Pendiente | Todavia no tiene fecha de cumplimiento y la fecha planificada es hoy o posterior. |
| Vencido | Todavia no tiene fecha de cumplimiento y la fecha planificada ya paso. |
| Cumplido | Tiene fecha de cumplimiento. Se marca al registrar el mantenimiento. |

## Planificar un trabajo

1. Pulse **Planificar**.
2. En la ventana **Planificar mantenimiento**, complete:
   - **Senal**: es obligatoria. Si la deja vacia, aparece "La senal es obligatoria".
   - **Tipo de mantenimiento**: elija el tipo del catalogo.
   - **Fecha planificada**.
   - **Trabajo y medios**: describa lo que hay que hacer y los medios necesarios (texto de ayuda: "Trabajo a realizar y medios necesarios").
3. Pulse **Guardar**.

Si el guardado falla, aparece "No se pudo guardar el plan" o el mensaje que devuelva el servidor.

## Editar un plan

1. En la pestana **Lista**, pulse el boton **Editar plan** de la fila.
2. O en el **Calendario**, pulse el plan dentro del dia.
3. Cambie los datos y pulse **Actualizar**.

El titulo de la ventana cambia a **Editar plan de mantenimiento**.

## Calendario

- Muestra un mes con los planes de cada dia.
- Use los botones de flecha **Mes anterior** y **Mes siguiente** para moverse entre meses.
- Pulse un plan para abrirlo y editarlo.

## Lista

Los filtros se consultan en el servidor.

| Filtro | Que hace |
|---|---|
| Estado | Pendientes y vencidos (valor inicial), Pendientes, Vencidos o Cumplidos. |
| Senal | Filtra por una senal. |
| Tipo de mantenimiento | Filtra por el tipo. |
| Fecha desde / Fecha hasta | Rango de la fecha planificada. |
| Limpiar filtros | Quita los filtros activos. El estado no cuenta como filtro. |

Las acciones de cada fila son:

- **Cumplir**: aparece en los planes que no estan cumplidos. Abre el formulario de **Nuevo Mantenimiento** con la senal y el plan ya cargados. Al guardar ese mantenimiento, el plan se marca como cumplido.
- **Editar plan**.
- **Eliminar plan**. Pide confirmacion con la ventana "Esta seguro?", que dice que el plan se eliminara y que no se puede deshacer.

Mensajes de la lista:

- **"No hay planes pendientes ni vencidos"**: con el filtro inicial no hay trabajos pendientes.
- **"No hay planes con esos filtros"**: los filtros no coinciden.

## Cumplir un plan

1. En la lista, pulse **Cumplir** en el plan.
2. Se abre **Nuevo Mantenimiento** con la senal, el tipo y el trabajo del plan.
3. Complete las fechas y los demas datos, y pulse **Guardar Mantenimiento**.
4. Si el guardado sale bien, el plan queda en estado Cumplido.

Si el plan ya estaba cumplido, el formulario muestra el aviso de que el mantenimiento se registra sin cambiar el plan.

Si el mantenimiento se guarda pero el plan no puede marcarse, aparece el aviso "No se pudo marcar el plan como cumplido.". En ese caso, revise el plan en la lista.

Tambien puede cumplir un plan desde la pestana **Mantenimientos** de la ficha de una senal, con el boton de cumplir de cada plan.

## Mensajes frecuentes

- **"La senal es obligatoria"**: elija la senal antes de guardar.
- **"No se pudo guardar el plan"**: el servidor rechazo el guardado. Revise los datos e intente de nuevo.
- Si la lista muestra un aviso con el boton **Reintentar**, pulse ese boton para cargar otra vez.
