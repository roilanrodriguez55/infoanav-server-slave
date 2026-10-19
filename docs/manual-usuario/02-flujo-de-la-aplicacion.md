# 2. Flujo de la aplicacion

Este archivo muestra como se relacionan los modulos de INFOANAV y en que orden conviene usarlos. Sirve como mapa. El detalle de cada pantalla esta en los archivos 04 a 18.

## La idea general

Todo gira alrededor de la **senal**. Una senal es una ayuda a la navegacion maritima con su codigo LSM, su tipo, su ubicacion y su estado. Las demas informaciones cuelgan de ella:

- Sus equipos (grupos electrogenos, baterias, luminarias y otros equipos instalados).
- Las fallas que presenta.
- Los mantenimientos que se le hacen, sean planificados o no.
- Los hechos extraordinarios que la afectan (por ejemplo, vandalismo).
- Los RACON instalados en ella.
- Su pronostico de disponibilidad, si es luminica.
- Su fondeo y la operacion de leva, mantenimiento y fondeo (LMF), si es una boya.

Los catalogos (tipos, estados, zonas, empresas, estaciones y otros) son las listas que aparecen en los desplegables de los formularios. Se cargan antes de empezar a registrar, porque sin ellos los formularios no tienen opciones para elegir.

## Orden recomendado de trabajo

### Etapa 1. Preparar los catalogos (administrador)

1. Revise que existan los valores que va a usar: tipos de senal, estados, zonas, empresas, estaciones, tipos de falla, tipos de mantenimiento, modelos de senal y otros.
2. Si falta un valor, agreguelo en el modulo **Catalogos**. Solo el administrador puede hacerlo en los catalogos cerrados.
3. Los temas, paises y editoriales de Documentacion se pueden crear desde el propio formulario de libro, aunque el catalogo sea abierto.

Si una lista no muestra el valor que necesita, no lo registre con otro nombre. Pida al administrador que lo agregue.

### Etapa 2. Registrar las senales y sus equipos

1. Entre a **Senales** y pulse **Nueva Senal**.
2. Complete los datos generales, geograficos y luminicos, segun corresponda. Las pestanas Luminicos, Equipamiento y Pronostico solo se activan si la senal es luminica. La pestana Sistema de Fondeo solo aplica a boyas.
3. Guarde la senal. A partir de ese momento aparece en las listas y puede asociarle fallas, mantenimientos, hechos y otros registros.
4. Registre los equipos en **Equipamiento**, en la pestana Inventario, indicando la senal donde estan instalados (LSM inicial). Si un equipo se mueve, use la opcion de cambiar ubicacion para que quede el historial.

### Etapa 3. Registrar lo que ocurre: fallas y hechos

1. Cuando una senal deja de funcionar, registre una **falla** desde **Fallas** o desde la ficha de la senal. Una falla siempre pertenece a una senal.
2. Si ocurre un hecho extraordinario (por ejemplo, un dano por terceros), registrelo en **Hechos extraordinarios** o en la pestana Hechos de la senal.
3. Cuando la senal vuelve a funcionar, **restablezca** la falla desde su ficha. Al hacerlo se calcula la duracion de la falla y se guarda la fecha de restablecimiento.
4. Desde ese mismo paso puede pasar directo a registrar el mantenimiento que corrigio la falla. El formulario de mantenimiento llega con la senal, la falla y la fecha de fin ya cargadas.

### Etapa 4. Planificar y registrar los mantenimientos

1. En **Plan de Mantenimiento** planifique los trabajos periodicos: elija la senal, el tipo de mantenimiento y la fecha planificada. Un plan puede estar pendiente, vencido o cumplido, segun la fecha.
2. Cuando el trabajo se hace, registre el mantenimiento desde el plan. Al guardarlo, el plan se marca como cumplido y queda vinculado al mantenimiento creado.
3. Los mantenimientos que no estaban planificados se registran directamente en **Mantenimientos**, con el boton **Nuevo Mantenimiento**.
4. El mantenimiento guarda el trabajo realizado, las fechas, el tiempo empleado, los costos y los responsables.

### Etapa 5. Controlar equipos, flota, personal y documentacion

- **Equipamiento**: revise la pestana Alertas. Muestra los equipos cuya vida util se cumplio o que estan fuera de servicio. La pestana Grupos electrogenos registra las plantas de energia y sus fallas.
- **Flota y personal**: registre los buques con su ficha tecnica y sus certificados. El sistema avisa de los certificados vencidos o que vencen en los proximos 60 dias. Registre el alistamiento mensual de cada buque y mantenga al dia el personal, incluidas las bajas.
- **Documentacion**: registre los libros y controle los prestamos. Cada prestamo tiene un plazo de 14 dias.

### Etapa 6. Consultar y analizar

- **Dashboard**: muestra el estado general de las senales, las fallas abiertas, los mantenimientos de los proximos 7 dias y las alertas de otros modulos. Es la primera pantalla que ve al entrar.
- **Estadisticas**: cuenta las senales segun los criterios que elija (empresa, estacion, tipo y otros) y permite exportar el resultado a Excel o PDF.
- **Calculos**: calcula el alcance o la intensidad de una ayuda visual. Es una herramienta independiente, no guarda datos en el sistema.
- **Radioelectricas**: consulta los RACON instalados.

## Como se relacionan los modulos

| Modulo | Depende de | Alimenta a |
|---|---|---|
| Catalogos | Nada (lo administra el administrador) | Formularios de senales, fallas, mantenimientos, equipos, hechos y documentacion |
| Senales | Catalogos | Fallas, mantenimientos, hechos, equipos, RACON, LMF, pronostico y estadisticas |
| Equipamiento | Senales, Catalogos (modelos y tipos de equipo) | Alertas de equipamiento, Dashboard |
| Fallas | Senales | Restablecimiento, mantenimientos, Dashboard, estadisticas |
| Mantenimientos | Senales, Fallas (opcional), Plan de Mantenimiento (opcional), Flota (buques como medio) | Plan de Mantenimiento, Dashboard, estadisticas |
| Plan de Mantenimiento | Senales, Catalogos (tipos de mantenimiento) | Mantenimientos (al cumplir el plan) |
| Hechos extraordinarios | Senales | Dashboard |
| Radioelectricas (RACON) | Senales, Catalogos | Consulta |
| Flota y personal | Catalogos (empresas, tipos de alistamiento) | Mantenimientos y LMF (buque ejecutor), alertas del Dashboard |
| Documentacion | Catalogos (temas, idiomas, editoriales, paises) y el usuario que presta | Alertas del Dashboard (prestamos vencidos) |
| Estadisticas | Senales y catalogos | Nada (solo lectura) |
| Calculos | Nada | Nada (no guarda) |
| Usuarios | Nada | Define quien puede entrar y con que rol |

## Que hace el usuario en cada etapa

- Antes de registrar, verifique que los catalogos tengan lo que necesita.
- Registre la senal antes que sus fallas, mantenimientos o equipos. Si la senal no existe, el formulario de falla o de mantenimiento no tiene de donde elegir.
- No cierre una falla sin fecha de restablecimiento. Si ya volvio a funcionar, restablezcala para que la duracion quede calculada.
- Cuando planifique un mantenimiento, parta del plan siempre que exista. Asi el sistema marca el plan como cumplido.
- Si una senal se da de baja, sus fallas abiertas no se cierran solas. El aviso de la baja lo recuerda, y el usuario debe revisarlas.
- Revise el Dashboard al empezar la jornada. Muestra lo que requiere atencion.

## Que no hace el sistema solo

- Las fallas abiertas no se cierran al dar de baja la senal.
- El sistema no crea mantenimientos a partir de las fallas. Hay que registrarlos, aunque el formulario llegue con los datos cargados desde la falla.
- Los valores de los catalogos no se crean desde los formularios de senal, falla o mantenimiento, salvo los catalogos abiertos indicados en la etapa 1.
