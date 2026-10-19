# 14. Estadisticas

## Para que sirve

Este modulo cuenta las senales segun los criterios que elija: empresa, estacion, tipo, color, forma, material y otros atributos. El resultado se agrupa por empresa (o por empresa y estacion) y puede exportarse a Excel o PDF. Es una pantalla de consulta: no cambia ningun dato.

## Como llegar

- Menu lateral: **Estadisticas** (grupo Consulta y gestion).
- Ruta: `/estadisticas`.

## Que ve en pantalla

- Titulo **Estadisticas** con el texto "Recuento de senales por empresa, estacion y atributos".
- Tres tarjetas de totales: **Total de senales**, **Luminicas** y **Ciegas**.
- Un bloque de criterios de filtro.
- El resultado: una tabla o un conjunto de tarjetas por grupo.
- Los botones **Exportar Excel** y **Exportar PDF**, debajo del resultado.

## Criterios de filtro

Cada criterio es un desplegable con la opcion **Todos** (o **Todas**) y los valores del catalogo correspondiente. Los criterios disponibles son:

- Empresa
- Estacion
- Tipo
- Categoria
- Complejidad
- Usuario de navegacion
- Caracteristica
- Color de luz
- Color
- Modelo
- Forma
- Material

Ademas hay un criterio de **Dimension**: elija Altura, Elevacion o Profundidad, y escriba el **Valor exacto** que busca (campo "Valor exacto").

## Opciones de presentacion

| Opcion | Que hace |
|---|---|
| Agrupar por | **Empresa**, o **Empresa y estacion**. |
| Mostrar | **Detalle** muestra las senales de cada grupo. **Resumen** muestra solo el numero de senales por grupo. |
| Incluir bajas | Casilla. Si la marca, tambien cuenta las senales dadas de baja. |

## Como se usa

1. Elija los criterios que necesite en los desplegables. Los que deje en **Todos** no filtran.
2. Elija como agrupar y como mostrar el resultado.
3. Marque **Incluir bajas** solo si necesita contar las senales retiradas.
4. Lea el resultado. Las tarjetas de totales (Total, Luminicas y Ciegas) muestran las cifras de la consulta (pendiente de confirmar si cambian con cada criterio).
5. Para exportar, pulse **Exportar Excel** o **Exportar PDF**.

Para quitar todos los criterios, use **Limpiar filtros**.

## Exportar

- **Exportar Excel**: genera un archivo .xlsx con una hoja. El nombre del archivo incluye el tipo de vista, la agrupacion y la fecha.
- **Exportar PDF**: genera un documento PDF con una tabla.

Mientras genera el archivo, el boton dice "Generando...". Los botones estan desactivados si no hay resultados para exportar.

## Mensajes frecuentes

- **"No hay senales con estos criterios."**: ningun registro cumple los filtros. Quite alguno de ellos.
- Un mensaje de error en rojo al inicio de la pantalla: la consulta no se completo. Recargue la pagina.
