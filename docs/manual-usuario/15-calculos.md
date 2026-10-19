# 15. Calculos

## Para que sirve

Esta calculadora obtiene el alcance o la intensidad luminosa de una ayuda visual (una senal luminica), segun la ley de Allard. Sirve para comprobar si una senal se ve a la distancia que necesita, o que intensidad necesita para llegar a una distancia determinada.

Es una herramienta de calculo. No guarda resultados ni modifica datos de las senales. Los resultados se pierden al cerrar o recargar la pantalla.

## Como llegar

- Menu lateral: **Calculos** (grupo Consulta y gestion).
- Ruta: `/calculos`.

## Que ve en pantalla

- Una tarjeta **Calculadora** con el texto "Elige la magnitud a calcular y la condicion de iluminacion".
- Una tarjeta **Resultado**, que aparece despues de calcular.

## Como se usa

1. En **Magnitud**, elija lo que quiere calcular:
   - **Alcance**: calcula la distancia a la que se ve la senal.
   - **Intensidad**: calcula la intensidad luminosa necesaria.
2. En **Condicion**, elija **Nocturno** o **Diurno**.
3. Complete los campos. Los campos cambian segun las opciones elegidas (ver la tabla siguiente).
4. Pulse **Calcular**.
5. Lea el resultado en la tarjeta **Resultado**.

### Campos segun la magnitud y la condicion

| Campo | Cuando aparece |
|---|---|
| Intensidad optica (cd) | Si la magnitud es Alcance. Es el dato de partida. |
| Alcance operacional (millas nauticas) | Si la magnitud es Intensidad. Es el dato de partida. |
| Factor de acristalamiento | Siempre. |
| Factor de color | Siempre. |
| Factor de servicio | Siempre. |
| Iluminacion de fondo | Si la condicion es Nocturno. Se elige un nivel de la lista (cada uno indica su umbral en µlx). |
| Luminancia del cielo | Si la condicion es Diurno. Se elige un codigo de la lista (cada uno indica su valor en cd/m²). |
| Visibilidad (millas nauticas) | Siempre. |

Todos los campos numericos deben tener un numero mayor que 0. Si no lo tienen, el campo muestra el mensaje "Ingresa un numero mayor que 0." y el calculo no se hace.

## Resultado

El resultado muestra el alcance o la intensidad calculados, con su titulo (por ejemplo "Alcance nocturno" o "Intensidad diurno"), y el detalle de los datos usados:

- Si calculo alcance: Alcance operacional y Alcance nominal, ademas de la Intensidad optica, los factores, la iluminacion de fondo o la luminancia del cielo, y la visibilidad.
- Si calculo intensidad: Intensidad optica y Alcance nominal, con los mismos datos de entrada.

Las unidades son cd (candela) para la intensidad y millas nauticas para el alcance.

## Mensajes frecuentes

- **"Ingresa un numero mayor que 0."**: el campo esta vacio, es cero o es negativo. Corrija el valor.
- Al cambiar la magnitud, la condicion o cualquier valor, el resultado anterior desaparece. Vuelva a pulsar **Calcular** para obtener uno nuevo.
