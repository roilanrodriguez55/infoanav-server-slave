# 12. Flota y personal

## Para que sirve

Este modulo guarda la informacion de los buques de la flota, el alistamiento mensual de cada buque y el personal. Los buques se usan despues como medio en los mantenimientos y como buque ejecutor en las operaciones de leva, mantenimiento y fondeo (LMF). El sistema tambien avisa de los certificados de los buques que vencen pronto o ya vencieron.

## Como llegar

- Menu lateral: **Flota y personal** (grupo Consulta y gestion).
- Ruta: `/flota`.
- Desde el Dashboard, la tarjeta **Certificados por vencer o vencidos**, con el enlace **Ver flota**.

La pantalla tiene tres pestanas: **Buques**, **Alistamiento** y **Personal**. Se abre en Buques.

## Pestana Buques

### Avisos de certificados

Al inicio de la pestana aparecen dos bloques:

- **Certificados vencidos (N)**: buques con certificados ya vencidos. Cada linea indica el buque, el certificado y la fecha de vencimiento.
- **Por vencer en 60 dias (N)**: certificados que vencen en los proximos 60 dias.

Los certificados que se revisan son Navegabilidad, Linea de carga, Clase y Visado.

### Listado

- Boton **Nuevo buque**.
- Buscador: "Buscar por buque o nombre".
- Tabla con los buques. Un buque marcado para baja aparece con la etiqueta **Propuesto para baja**.
- Mensajes: "No hay buques registrados." y "No se encontraron buques con esa busqueda.".

Pulse un buque para abrir su **Ficha del buque**.

### Ficha del buque

Pestanas:

- **General**: buque, nombre del buque, empresa, proyecto, numero de inventario, ano de construccion, material del casco, basificacion, entre otros.
- **Propulsion**: datos de maquinas y propulsion.
- **Plantas**: plantas del buque.
- **Medios de izaje**: izaje principal y auxiliar.
- **Certificados**: Navegabilidad, Linea de carga, Clase y Visado, con sus fechas de vencimiento.
- **Salvamento y C/I**: datos de salvamento y de C/I, con los nombres que aparecen en la pantalla.

Para guardar cambios, pulse **Guardar**. Mientras guarda, el boton dice "Guardando...". Para salir sin guardar, pulse **Cancelar**.

Para marcar un buque como propuesto para baja, use la casilla **Propuesto para baja** de la ficha (pestana General).

## Pestana Alistamiento

El alistamiento mide, mes a mes, cuantos dias un buque estuvo en mision y cuantos dias estuvo fuera de servicio (F/S). Los porcentajes y los acumulados los calcula el sistema.

### Registrar un mes

1. Pulse **Registrar mes**.
2. En la ventana **Registrar mes de alistamiento**, complete:
   - **Buque**: elija el buque en "Seleccionar buque".
   - **Mes**: elija el mes.
   - **Tipo de alistamiento**: elija el tipo del catalogo.
   - **Fecha de F/S** y **Fecha de alistamiento**.
   - **Dias de mision del mes** y **Dias F/S del mes**.
   - **Descripcion**.
3. Pulse **Registrar mes**. Mientras guarda, el boton dice "Guardando...".

La tabla muestra, por buque y mes: Dias mision, Dias F/S, % mes, Dias mision acumulados, Dias F/S acumulados y % acumulado.

## Pestana Personal

### Que ve en pantalla

- Boton **Nueva persona**.
- Botones **Activos** y **Bajas**, para elegir que personas ver. Activos es el valor inicial.
- Filtros: **Buscar** ("Buscar por nombre o apellido") y filtro por letra inicial del primer apellido.
- Tabla con las columnas Nombre completo, Cargo, Empresa, Telefono, Carne de identidad, Estado, Fecha de baja y Acciones.

Mensajes: "No hay personal registrado." y "No se encontro personal con esos filtros.".

### Registrar una persona

1. Pulse **Nueva persona**.
2. Complete los datos. El formulario incluye Nombre, Primer apellido, Segundo apellido, Cargo, Cargos anteriores, Telefono, Carne de identidad, Fecha de nacimiento, Radica en, Salario, Escolaridad, Cursos recibidos y Necesidad de cursos. La empresa se elige en el desplegable "Seleccionar empresa".
3. Pulse **Guardar**.

### Dar de baja a una persona

1. En la fila de la persona, pulse **Dar baja**.
2. En la ventana **Dar baja**, complete **Fecha de baja** y **Causa de baja** (opcional).
3. Pulse **Confirmar baja**.

La columna Fecha de baja muestra la fecha registrada y la persona pasa a la lista de bajas. Ambos roles pueden darla de baja.

### Reactivar una persona (solo administrador)

Para una persona dada de baja aparece el boton **Reactivar**, solo para el administrador. Al reactivarla, vuelve a la lista de activos.

## Mensajes frecuentes

- **"Baja registrada."** y **"Persona reactivada."**: confirmaciones de las dos acciones.
