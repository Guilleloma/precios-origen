/**
 * Puntos de una serie y cortes por semanas sin dato (regla 8 del plan): dos puntos solo se
 * unen si sus lunes están a 7 días exactos. No se interpola nunca.
 */

import type { PuntoSerie } from '../../scripts/ingesta/contrato.ts';
import { fechaAMs, MS_SEMANA } from '../formato/fechas.ts';

export interface Punto {
  /** Lunes de la semana en milisegundos UTC (eje X). */
  t: number;
  lunes: string;
  anyo: number;
  semana: number;
  min: number;
  medio: number;
  max: number;
}

export function puntosDeSerie(puntos: readonly PuntoSerie[]): Punto[] {
  return puntos.map(([lunes, anyo, semana, min, medio, max]) => ({
    t: fechaAMs(lunes),
    lunes,
    anyo,
    semana,
    min,
    medio,
    max,
  }));
}

/** Tramos de semanas consecutivas. Un tramo de un solo punto es un punto aislado. */
export function segmentar(puntos: readonly Punto[]): Punto[][] {
  const tramos: Punto[][] = [];
  let actual: Punto[] = [];
  for (const punto of puntos) {
    const previo = actual.at(-1);
    if (previo && punto.t - previo.t !== MS_SEMANA) {
      tramos.push(actual);
      actual = [];
    }
    actual.push(punto);
  }
  if (actual.length > 0) tramos.push(actual);
  return tramos;
}

/** Índice del punto cuyo lunes está más cerca de `t` (−1 si no hay puntos). Búsqueda binaria. */
export function indiceMasCercano(puntos: readonly Punto[], t: number): number {
  if (puntos.length === 0) return -1;
  let bajo = 0;
  let alto = puntos.length - 1;
  while (bajo < alto) {
    const medio = (bajo + alto) >> 1;
    if ((puntos[medio] as Punto).t < t) bajo = medio + 1;
    else alto = medio;
  }
  const previo = puntos[bajo - 1];
  const candidato = puntos[bajo] as Punto;
  if (previo && t - previo.t <= candidato.t - t) return bajo - 1;
  return bajo;
}
