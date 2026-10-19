# 16. Catalogos

## Para que sirve

Los catalogos son las listas de valores que aparecen en los desplegables de los formularios: tipos de senal, zonas, estados, empresas, estaciones, tipos de falla, tipos de mantenimiento, temas de documentacion y otros. Este modulo permite agregar, renombrar y dar de baja esos valores.

Solo el administrador ve este modulo. Los demas roles usan los valores que cargo el administrador (ver el archivo 03).

## Como llegar

- Menu lateral: **Catalogos**, en el grupo Administracion. Solo lo ve el administrador.
- Ruta: `/catalogos`. Si un usuario sin ese rol intenta abrirla, la aplicacion lo lleva al Dashboard.

## Que ve en pantalla

- Titulo con el texto "Administra los valores de las listas desplegables del sistema."
- Una lista de catalogos disponibles (con el aria "Catalogos disponibles"). Pulse uno para ver sus valores. Hay 30 catalogos.
- Para el catalogo elegido: un campo **Nuevo registro** con el boton **Anadir**, un buscador "Buscar en este catalogo" y la lista de valores.

## Catalogos disponibles

Son 30 catalogos. Los nombres que aparecen en la pantalla son:

Caracteristicas, Categorias, Colores, Colores de luz, Complejidades, Editoriales, Empresas, Energias, Estaciones, Estados de senal (mantenimiento), Estados de senal (operativos), Formas, Idiomas, Marcas de tope, Mares, Materiales, Misiones de buque, Modelos de senal, Origenes de falla, Paises, Temas de documentacion, Tipos de alistamiento, Tipos de documento, Tipos de equipamiento, Tipos de falla, Tipos de mantenimiento, Tipos de senal, Ubicaciones del medio, Usuarios de navegacion y Zonas.

## Agregar un valor

1. Elija el catalogo.
2. En **Nuevo registro**, escriba el nombre. El texto de ayuda dice "Nombre de" seguido del nombre del catalogo.
3. Pulse **Anadir**. El boton esta desactivado mientras el campo este vacio o se este guardando.
4. El valor aparece en la lista y ya puede elegirse en los formularios.

Los formularios no crean valores nuevos, salvo los de Documentacion que se indican en el archivo 13. Por eso, cada valor nuevo debe agregarse aqui antes de usarlo.

## Renombrar un valor

1. En la fila del valor, pulse el boton de editar (su nombre accesible es "Editar" seguido del nombre del valor).
2. Cambie el texto en el campo "Nuevo nombre para ...".
3. Pulse el boton **Guardar cambios** para confirmar, o **Cancelar edicion** para salir sin cambios.

Si deja el nombre vacio, aparece el aviso "El nombre no puede estar vacio".

## Dar de baja un valor

1. En la fila del valor, pulse el boton de eliminar (su nombre accesible es "Eliminar" seguido del nombre del valor).
2. En la ventana **Eliminar registro?**, lea el texto: se dara de baja el valor, y si esta en uso el sistema lo impedira.
3. Pulse **Eliminar** para confirmar, o cancele.

Un valor dado de baja deja de aparecer en la lista y en los desplegables. La ventana indica que, si el valor esta en uso, el sistema no permitira la baja. El texto exacto del aviso en ese caso depende del servidor (pendiente de confirmar).

## Buscar en un catalogo

Escriba en el campo "Buscar en este catalogo" para filtrar la lista por nombre.

Mensajes de la lista:

- **"Este catalogo no tiene registros todavia."**: el catalogo esta vacio.
- **"Ningun registro coincide con la busqueda."**: la busqueda no encontro valores.
- Si la carga falla, aparece el aviso con el boton **Reintentar**.

## Catalogos abiertos

Los catalogos de Temas de documentacion, Paises y Editoriales son abiertos: los roles Usuario pueden crear valores nuevos desde el formulario de Documentacion. Solo el administrador puede renombrarlos o darlos de baja desde esta pantalla.
