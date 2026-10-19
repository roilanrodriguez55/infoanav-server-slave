# 11. Radioelectricas (RACON)

## Para que sirve

Este modulo registra los RACON instalados en las senales maritimas. Un RACON es un respondedor radar que se instala en una senal. El registro guarda su identificacion, banda, frecuencia, alcance, antena, caracteristicas fisicas y vigencia.

Cada RACON pertenece a una senal. Puede consultarlo desde este modulo o desde la ficha de la senal.

## Como llegar

- Desde el modulo **Senales**, con el boton **Radioelectricas** de la parte superior del listado.
- Ruta: `/radioelectricas`.
- Desde la ficha de una senal, pestana **Radioelectrico**, que muestra solo los RACON de esa senal y permite agregar uno con **Agregar RACON**.

No aparece como opcion independiente en el menu lateral.

## Listado de RACON

### Que ve en pantalla

- Titulo con el texto "Equipos RACON instalados en las senales maritimas".
- Botones **Actualizar** y **Nuevo RACON**.
- Filtros.
- Tabla con las columnas Senal, Nombre, Banda, Frecuencia, Alcance, Empresa y Estacion.

### Filtros

| Filtro | Que hace |
|---|---|
| Buscar | Busca por nombre o numero de orden. |
| Empresa | Filtra por empresa. |
| Estacion | Filtra por estacion. |
| Limpiar filtros | Quita los filtros activos. |

### Mensajes del listado

- **"No hay RACON registrados."**: no hay registros.
- **"No se encontraron RACON con esos filtros."**: los filtros no coinciden.

## Registrar un RACON nuevo

1. Pulse **Nuevo RACON**.
2. En la ventana **Nuevo RACON**, elija la senal donde esta instalado el equipo en el campo "Seleccione una senal". Puede buscar por codigo o nombre.
3. Pulse **Continuar**. El boton solo se activa cuando hay una senal elegida.
4. Complete el formulario.
5. Pulse **Guardar**.

Desde la ficha de una senal, el paso 2 se omite porque la senal ya esta elegida.

### Campos del formulario

El formulario se divide en grupos:

- **Identificacion**: numero de orden, nombre, tipo, empresa y estacion. Empresa y estacion se eligen de un desplegable.
- **Radio**: banda, frecuencia, barrido, supresion de lobulo lateral, pulso, modo de servicio, identificador, largo del identificador, alcance, sensibilidad y retardo de pulso.
- **Antena**: tipo de antena, ganancia, directividad y polarizacion.
- **Fisico**: dimensiones, peso, color, energia y consumo.
- **Vigencia**: fecha de inicio y fecha de baja. Ambas son fechas.


### Botones del formulario

- **Guardar**: guarda los cambios.
- **Cancelar**: cierra sin guardar.
- **Eliminar**: aparece en un RACON existente. Pide confirmacion con el texto "El RACON ... se eliminara del sistema.".

## Editar o eliminar un RACON

1. Pulse el RACON en el listado para abrir su edicion en el panel lateral.
2. Cambie lo necesario y pulse **Guardar**.
3. Para eliminarlo, pulse **Eliminar** dentro del formulario y confirme.

Mensajes:

- Si el guardado falla, aparece el mensaje que devuelve el servidor y el registro no se modifica.
- Si la lista no carga, aparece el aviso con el boton **Reintentar**.
- **"No se pudieron cargar las empresas y las estaciones"**: los desplegables del formulario no cargaron. Recargue la pagina.

## Mensajes frecuentes

- **"Nuevo RACON"** con el boton **Continuar** deshabilitado: falta elegir la senal.
- **"Guardando..."**: el guardado esta en proceso. Espere antes de cerrar.
