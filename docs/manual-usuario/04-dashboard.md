# 4. Dashboard

## Para que sirve

El Dashboard es la pantalla de inicio. Resume el estado de las senales, las fallas abiertas, los mantenimientos de los proximos dias y las alertas de los demas modulos. Sirve para saber que requiere atencion antes de entrar a un modulo.

## Como llegar

- Se abre al entrar al sistema.
- Desde el menu lateral, pulse **Dashboard** (primera opcion).

## Que ve en pantalla

De arriba hacia abajo:

1. **Encabezado**: titulo "Panel operacional" y el subtitulo "Senales maritimas · Actualizado ahora". A la derecha aparece el indicador **En vivo** y el boton **Exportar reporte**.
2. **Situacion ahora mismo**: cuatro tarjetas.
   - Senales totales.
   - Fuera de servicio. Si hay senales en esa situacion, el texto dice "Requieren atencion inmediata".
   - Fallas abiertas. Si hay, el texto dice "Pendientes de resolucion".
   - Mantenimientos prox. 7 dias. Si hay, el texto dice "Programados proximamente".
3. **Senales que requieren accion**: lista con tres pestanas, Criticas, Degradadas y Sin senal. Cada una muestra las senales que caen en esa categoria y un enlace **Ver todas ↗** que lleva al listado de senales.
4. **Mantenimientos proximos**: los mantenimientos programados en los proximos 7 dias.
5. **Fallas este mes**: grafico de fallas por semana del mes, con el tiempo medio de resolucion de la ultima semana y la lista de **Fallas abiertas**.
6. **Tarjetas de alerta**: avisos de otros modulos (ver la seccion siguiente).

Mientras carga, cada bloque muestra "Cargando...".

## Como se clasifican las senales

El Dashboard no tiene un campo propio de criticidad. Clasifica cada senal segun el nombre de su estado:

| Categoria | Estados que la producen (segun el texto del nombre) |
|---|---|
| Criticas | Fuera de servicio, pendiente de reparacion, critico |
| Sin senal | Sin senal, offline, sin comunicacion, sin respuesta |
| Degradadas | Cualquier otro estado distinto de "operativa" |

Las senales con estado "operativa" o sin estado no aparecen en la lista. Si un estado nuevo no coincide con estas palabras, la senal queda en Degradadas. Revise el nombre de los estados en el catalogo si una senal aparece en la categoria que no corresponde (pendiente de confirmar el criterio con el administrador).

## Tarjetas de alerta

Cada tarjeta muestra un aviso y un enlace a la pantalla donde se resuelve.

| Aviso | Enlace | Pantalla |
|---|---|---|
| Senales fuera de servicio | Ver fallas | Fallas |
| Planes de mantenimiento vencidos | Ver plan de mantenimiento | Plan de Mantenimiento |
| Equipos con vida util cumplida | Ver alertas de equipamiento | Equipamiento, pestana Alertas |
| Hechos pendientes | Ver hechos | Hechos extraordinarios |
| Certificados por vencer o vencidos | Ver flota | Flota y personal |
| Prestamos vencidos | Ver documentacion | Documentacion |

## Como se usa

1. Entre al Dashboard y revise primero las tarjetas de situacion.
2. Si hay senales en Criticas, pulse **Ver todas ↗** para abrir el listado de senales y buscar la que corresponda (pendiente de confirmar si cada fila del Dashboard enlaza a su ficha).
3. Revise las tarjetas de alerta y pulse el enlace de la que corresponda.
4. Para ver cambios recientes, recargue la pagina del navegador. No se encontro en el codigo una actualizacion automatica de los datos (pendiente de confirmar). El indicador **En vivo** es visual.

## Exportar reporte

1. Pulse **Exportar reporte**.
2. En la ventana, elija el periodo en el campo **Periodo**: Hoy, Ultimos 7 dias o Este mes.
3. Pulse **Generar reporte** para continuar, o **Cancelar** para cerrar la ventana sin hacer nada.
4. El sistema muestra el aviso "Reporte generado — descargando…".

En el codigo revisado, este boton solo muestra el aviso. No se encontro ninguna descarga de archivo asociada, asi que el reporte no se genera en la version revisada (pendiente de confirmar). Para exportar datos, use el boton Exportar Excel o Exportar PDF de Estadisticas.

## Mensajes frecuentes

- **"Error al cargar los datos del dashboard"**: no se pudo consultar la informacion. Recargue la pagina. Si el error continua, avise al administrador.
- **"Algunas metricas no pudieron cargarse; el resto se muestra con datos disponibles."**: una parte de la informacion fallo. Los bloques que llegaron se muestran normalmente. Recargue para intentar de nuevo.
- **"No hay senales en esta categoria"**, **"No hay mantenimientos programados en los proximos 7 dias"**: no hay registros que cumplan la condicion. No es un error.
