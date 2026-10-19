# 13. Documentacion

## Para que sirve

Este modulo lleva el registro de la biblioteca tecnica: los libros y documentos, con su ubicacion y estado, y los prestamos que se hacen de cada uno. Cada prestamo tiene un plazo de 14 dias. Si pasa ese plazo sin devolucion, el prestamo aparece como vencido en el Dashboard.

## Como llegar

- Menu lateral: **Documentacion** (grupo Consulta y gestion).
- Ruta: `/documentacion`.
- Desde el Dashboard, la tarjeta **Prestamos vencidos**, con el enlace **Ver documentacion**.

La pantalla tiene dos pestanas: **Libros** y **Prestamos**.

## Pestana Libros

### Que ve en pantalla

- Boton **Nuevo libro**.
- Filtros.
- Listado con paginacion. Al pulsar un libro se abre su **Ficha del libro**.
- Mensajes: "No hay libros registrados." y "No se encontraron libros con esos filtros.".

### Filtros

| Filtro | Que hace |
|---|---|
| Buscar | Busqueda de texto libre. |
| Estado tecnico | Filtra por el estado tecnico del libro. |
| Ubicacion | Filtra por ubicacion. |
| Ano | Ano de publicacion. Un selector permite elegir Exacto, Desde - hasta, Antes de o Despues de. En modo rango aparecen Ano desde y Ano hasta. |
| Disponibilidad | Todos, Disponible o Prestado. |
| Limpiar filtros | Quita los filtros activos. |

### Registrar o editar un libro

1. Pulse **Nuevo libro**, o en la ficha pulse **Editar**.
2. Complete el formulario. Los campos son:
   - Codigo.
   - Tipo de documento.
   - Tema, Idioma, Autor, Editorial y Pais.
   - Ano de publicacion, Paginas y Nivel.
   - Estado tecnico, Ubicacion, Precio, Tipo de portada y Fecha de compra.
   - Notas.
3. Guarde el formulario.

Los campos **Tema**, **Editorial** y **Pais** permiten crear un valor nuevo desde el mismo campo si no existe en la lista. Todos los roles pueden hacerlo. Los demas campos solo muestran los valores del catalogo.

### Ficha del libro

Muestra los datos del libro y su disponibilidad:

- **Disponible** (verde): el libro esta en la biblioteca.
- **Prestado** (ambar): el libro esta prestado. Debajo aparece a quien, y la fecha en que debe devolverse.
- **Vencido** (rojo): el prestamo supero la fecha de devolucion.

Botones de la ficha:

- **Editar**: abre el formulario.
- **Prestar**: abre la ventana de prestamo. Aparece cuando el libro no esta prestado.
- **Devolver**: abre la ventana de devolucion. Aparece cuando el libro esta prestado, en lugar del boton Prestar.

## Prestar un libro

1. Abra la ficha del libro disponible y pulse **Prestar**.
2. En la ventana **Prestar libro**, complete:
   - **A quien**: nombre de la persona que recibe el libro. Es obligatorio.
   - **Quien presta**: se llena solo con su usuario. No se puede cambiar.
   - **Devolver antes del**: se calcula solo, 14 dias despues de hoy. No se puede cambiar.
3. Pulse **Prestar**. Mientras guarda, el boton dice "Guardando...".

El boton **Prestar** queda desactivado si falta el campo "A quien".

## Devolver un libro

1. Abra la ficha del libro prestado y pulse **Devolver**.
2. En la ventana **Devolver libro**, elija el **Estado al devolver**: Bueno, Regular o Malo. Es obligatorio.
3. Pulse **Devolver**.

Despues de devolverlo, el libro vuelve a aparecer como Disponible.

## Pestana Prestamos

Lista todos los prestamos, con las columnas Libro, A quien, Quien presta, Prestamo, A devolver, Devuelto y Estado.

Filtro de estado, con tres opciones:

- **Activos**: prestamos sin devolver dentro del plazo.
- **Vencidos**: prestamos sin devolver cuya fecha ya paso.
- **Devueltos**: prestamos ya devueltos.

Los prestamos vencidos tambien aparecen como aviso en el Dashboard.

## Mensajes frecuentes

- **Boton Prestar desactivado**: falta escribir a quien se presta el libro.
- **No aparece el boton Devolver**: el libro no esta prestado. Use **Prestar** si corresponde.
- **"Guardando..."**: la accion esta en proceso. Espere antes de cerrar la ventana.
