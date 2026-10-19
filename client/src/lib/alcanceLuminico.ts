// Port literal de las funciones VBA de Sarisma (ley de Allard).
// Los resultados se calculan en doble precision; el original usaba Single (32 bits) y no se emula.

export const C = 0.05;
export const CF = 1852;
export const V_NOMINAL = 10;
export const E_NOMINAL_NOCTURNO = 0.0000002;
export const E_NOMINAL_DIURNO = 0.001;

const MAX_ITERACIONES = 200;

/** LuminanceValue: codigo de luminancia de cielo a cd/m2. Cualquier codigo no listado (incluido 5) devuelve 10000. */
export function luminanceValue(x: number): number {
  switch (x) {
    case 1:
      return 100;
    case 2:
      return 200;
    case 3:
      return 1000;
    case 4:
      return 5000;
    case 6:
      return 20000;
    case 7:
      return 50000;
    default:
      return 10000;
  }
}

/** NightThreshold: umbral de iluminancia nocturna en microlux. */
export function nightThreshold(x: number): number {
  switch (x) {
    case 2:
      return 2;
    case 3:
      return 20;
    default:
      return 0.2;
  }
}

/** DayThreshold: umbral de iluminancia diurna a partir del codigo de luminancia de cielo. */
export function dayThreshold(skyLuminance: number): number {
  const L = luminanceValue(skyLuminance);
  return 0.242 * Math.pow(1 + Math.pow(0.4 * L, 0.5), 2);
}

/** Intensity: intensidad necesaria para alcanzar el rango X con visibilidad V. */
export function intensity(x: number | null, c: number, e: number, v: number | null, cf: number): number {
  if (x === null || v === null || x <= 0 || v <= 0) return 0;
  return (e * Math.pow(x, 2) * Math.pow(cf, 2)) / Math.pow(c, x / v);
}

/**
 * LuminousRange: busqueda por bisección del rango luminoso para una intensidad I.
 * Devuelve NaN si se agota el tope de iteraciones o si CalcI == LastI (division por cero).
 */
export function luminousRange(i: number | null, c: number, e: number, v: number | null, cf: number): number {
  if (i === null || v === null || i <= 0 || v <= 0) return 0;

  let D = 8;
  let S = 4;
  const L = 0.001;
  let CalcI = 0;
  let LastI = 0;
  let LastD = D;

  for (let iter = 0; ; iter++) {
    if (iter >= MAX_ITERACIONES) return NaN;

    LastI = CalcI;
    LastD = D;
    CalcI = (e * Math.pow(D, 2) * Math.pow(cf, 2)) / Math.pow(c, D / v);

    if (CalcI > i) {
      D = D - S;
      if (S < L) break;
      S = S / 2;
    } else {
      D = D + S;
    }
  }

  if (CalcI === LastI) return NaN;

  const P = (i - LastI) / (CalcI - LastI);
  return D + (LastD - D) * P;
}

/** Calcula el rango nominal y operacional a partir de la intensidad de ayuda. */
function alcancesDesde(intensidadAyuda: number, umbral: number, eNominal: number, visibilidad: number) {
  return {
    alcanceNominal: luminousRange(intensidadAyuda, C, eNominal, V_NOMINAL, CF),
    alcanceOperacional: luminousRange(intensidadAyuda, C, umbral / 1000000, visibilidad, CF),
  };
}

export interface AlcanceNocturnoEntrada {
  intensidadOptica: number;
  factorAcristalamiento: number;
  factorColor: number;
  factorServicio: number;
  nivelFondo: number;
  visibilidad: number;
}

export interface AlcanceDiurnoEntrada {
  intensidadOptica: number;
  factorAcristalamiento: number;
  factorColor: number;
  factorServicio: number;
  codigoLuminancia: number;
  visibilidad: number;
}

export interface IntensidadNocturnaEntrada {
  alcanceOperacional: number;
  factorAcristalamiento: number;
  factorColor: number;
  factorServicio: number;
  nivelFondo: number;
  visibilidad: number;
}

export interface IntensidadDiurnaEntrada {
  alcanceOperacional: number;
  factorAcristalamiento: number;
  factorColor: number;
  factorServicio: number;
  codigoLuminancia: number;
  visibilidad: number;
}

export interface AlcanceResultado {
  intensidadAyuda: number;
  umbralIluminancia: number;
  alcanceNominal: number;
  alcanceOperacional: number;
}

export interface IntensidadResultado {
  intensidadAyuda: number;
  umbralIluminancia: number;
  intensidadOptica: number;
  alcanceNominal: number;
}

/** Form1: alcance nocturno. */
export function calcularAlcanceNocturno(e: AlcanceNocturnoEntrada): AlcanceResultado {
  const intensidadAyuda = (e.intensidadOptica * e.factorAcristalamiento * e.factorColor * e.factorServicio) / 1000000;
  const umbralIluminancia = nightThreshold(e.nivelFondo);
  return {
    intensidadAyuda,
    umbralIluminancia,
    ...alcancesDesde(intensidadAyuda, umbralIluminancia, E_NOMINAL_NOCTURNO, e.visibilidad),
  };
}

/** Form2: alcance diurno. */
export function calcularAlcanceDiurno(e: AlcanceDiurnoEntrada): AlcanceResultado {
  const intensidadAyuda = (e.intensidadOptica * e.factorAcristalamiento * e.factorColor * e.factorServicio) / 1000000;
  const umbralIluminancia = dayThreshold(e.codigoLuminancia);
  return {
    intensidadAyuda,
    umbralIluminancia,
    ...alcancesDesde(intensidadAyuda, umbralIluminancia, E_NOMINAL_DIURNO, e.visibilidad),
  };
}

/** Form3: intensidad nocturna. */
export function calcularIntensidadNocturna(e: IntensidadNocturnaEntrada): IntensidadResultado {
  const umbralIluminancia = nightThreshold(e.nivelFondo);
  const intensidadAyuda = intensity(
    e.alcanceOperacional,
    C,
    umbralIluminancia / 1000000,
    e.visibilidad,
    CF
  );
  const intensidadOptica = (intensidadAyuda / e.factorAcristalamiento / e.factorColor / e.factorServicio) * 1000000;
  return {
    intensidadAyuda,
    umbralIluminancia,
    intensidadOptica,
    alcanceNominal: luminousRange(intensidadAyuda, C, E_NOMINAL_NOCTURNO, V_NOMINAL, CF),
  };
}

/** Form4: intensidad diurna. */
export function calcularIntensidadDiurna(e: IntensidadDiurnaEntrada): IntensidadResultado {
  const umbralIluminancia = dayThreshold(e.codigoLuminancia);
  const intensidadAyuda = intensity(
    e.alcanceOperacional,
    C,
    umbralIluminancia / 1000000,
    e.visibilidad,
    CF
  );
  const intensidadOptica = (intensidadAyuda / e.factorAcristalamiento / e.factorColor / e.factorServicio) * 1000000;
  return {
    intensidadAyuda,
    umbralIluminancia,
    intensidadOptica,
    alcanceNominal: luminousRange(intensidadAyuda, C, E_NOMINAL_DIURNO, V_NOMINAL, CF),
  };
}
