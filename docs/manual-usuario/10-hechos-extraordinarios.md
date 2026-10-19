# 10. Hechos extraordinarios

## Para que sirve

Un hecho extraordinario es un suceso que afecta a una senal y que no es una falla tecnica normal. Por ejemplo, un dano por terceros o un hecho vandalico. El modulo registra que paso, quien lo reporto, las perdidas, los costos y las medidas tomadas, y lleva el hecho hasta su conclusion.

## Como llegar

- Menu lateral: **Hechos extraordinarios** (grupo Modulos principales).
- Ruta: `/hechos`.
- Desde el Dashboard, la tarjeta **Hechos pendientes**, con el enlace **Ver hechos**.
- Desde la ficha de una senal, pestana **Hechos**, con el boton **Agregar hecho**. En ese caso la senal ya viene elegida.

## Listado de hechos

### Que ve en pantalla

- Titulo **Hechos extraordinarios** y el texto "Hechos ocurridos en las senales maritimas".
- Botones **Actualizar** y **Nuevo hecho**.
- Filtros.
- Tabla con las columnas Empresa, Fecha, Hecho, Reporta, Senal, Vandalico y Estado.

En la columna **Estado**, un hecho aparece como **Pendiente** (sin concluir) o **Concluido**.

### Filtros

| Filtro | Que hace |
|---|---|
| Buscar | Busca por el texto del hecho, quien reporta y el OGO. |
| Empresa | Filtra por empresa. |
| Senal | Filtra por una senal (buscador "Buscar por codigo o nombre..."). |
| Vandalico | Si, No o Todos. |
| Estado | Pendientes, Concluidos o Todos. |
| Ano | Ano del hecho (por ejemplo, 2026). |
| Desde / Hasta | Rango de fechas. |
| Limpiar filtros | Quita los filtros activos. |

### Mensajes del listado

- **"No hay hechos registrados."**: no hay registros.
- **"No se encontraron hechos con esos filtros."**: los filtros no coinciden.
- Si la carga falla, aparece el aviso con el boton **Reintentar**.

## Registrar un hecho

1. Pulse **Nuevo hecho**, o use **Agregar hecho** en la pestana Hechos de una senal.
2. Si entro desde el listado, elija la senal. Si no la elige, aparece "Seleccione la senal del hecho".
3. Complete las secciones del formulario.
4. Pulse **Guardar**.

### Secciones del formulario

| Seccion | Campos |
|---|---|
| Identificacion | Fecha, Hora, Reporta, OGO y RG. |
| Hecho | Hecho (descripcion), Perdidas y la casilla **Vandalico**. |
| Costos | Costo (MN) y Costo (MLC). |
| Seguimiento | Medidas, Fecha pronosticada de conclusion y Observaciones. |

Los campos de texto largo son areas de texto. Los costos aceptan numeros.

## Concluir un hecho

Un hecho se concluye cuando ya se resolvio. En el codigo revisado no se encontro una opcion para reabrir un hecho concluido (pendiente de confirmar).

1. Abra el hecho y pulse **Concluir**.
2. En la ventana **Concluir hecho**, complete:
   - **Fecha de conclusion**.
   - **Medidas**: las medidas adoptadas.
   - **Observaciones**.
3. Pulse el boton verde de confirmacion de la ventana.

La ventana dice "Registre la fecha de conclusion y, si corresponde, las medidas adoptadas." Despues de concluir, la columna Estado muestra **Concluido**.

## Eliminar un hecho

1. Abra el hecho y pulse el boton para eliminarlo.
2. En la ventana **Esta seguro?**, confirme. El texto dice "El hecho se eliminara del sistema."

Use esta opcion solo si el hecho se cargo por error. Para un hecho real, conviene dejarlo registrado y concluirlo.

## Mensajes frecuentes

- **"Seleccione la senal del hecho"**: falta elegir la senal antes de guardar.
- **"Error al guardar"** o el mensaje del servidor: el hecho no se guardo. Revise los datos.
- **"Reintentar"** en el listado: la lista no pudo cargarse. Pulse el boton para volver a intentarlo.
