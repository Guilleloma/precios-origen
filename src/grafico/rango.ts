/**
 * Rangos del gráfico, contados desde la semana de referencia (regla 8 del plan): un producto
 * fuera de campaña enseña el vacío a la derecha.
 */

import { MS_SEMANA } from '../formato/fechas.ts';
import type { Punto } from './serie.ts';

export type ClaveRango = '6m' | '1a' | '3a' | 'todo';

export interface Rango {
  clave: ClaveRango;
  etiqueta: string;
  /** Semanas que abarca, contando la de referencia. `null` = toda la serie. */
  semanas: number | null;
}

export const RANGOS: readonly Rango[] = [
  { clave: '6m', etiqueta: '6 meses', semanas: 26 },
  { clave: '1a', etiqueta: '1 año', semanas: 52 },
  { clave: '3a', etiqueta: '3 años', semanas: 156 },
  { clave: 'todo', etiqueta: 'Todo', semanas: null },
];

export const RANGO_POR_DEFECTO: ClaveRango = '1a';

export interface Ventana {
  /** Inicio y fin del eje X en milisegundos UTC. */
  inicio: number;
  fin: number;
  puntos: Punto[];
}

/** `referencia` es el lunes (en ms) de la última semana publicada. */
export function filtrarRango(puntos: readonly Punto[], referencia: number, semanas: number | null): Ventana {
  if (semanas === null) {
    const inicio = puntos[0]?.t ?? referencia;
    return { inicio: Math.min(inicio, referencia), fin: referencia, puntos: puntos.filter((p) => p.t <= referencia) };
  }
  const inicio = referencia - (semanas - 1) * MS_SEMANA;
  return { inicio, fin: referencia, puntos: puntos.filter((p) => p.t >= inicio && p.t <= referencia) };
}

export function ventanasPorRango(puntos: readonly Punto[], referencia: number): Map<ClaveRango, Ventana> {
  return new Map(RANGOS.map((rango) => [rango.clave, filtrarRango(puntos, referencia, rango.semanas)]));
}
