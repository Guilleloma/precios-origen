/**
 * Trazados SVG de la línea (precio medio), la banda (mínimo–máximo) y los puntos aislados.
 * El SVG se estira al ancho disponible (`preserveAspectRatio="none"`) con trazos que no
 * escalan, así que un punto aislado es un trazo de longitud cero con remate redondo.
 */

import { dominioY, escalaLineal, type Dominio, type Escala } from './escala.ts';
import { segmentar, type Punto } from './serie.ts';
import type { Ventana } from './rango.ts';

function n(valor: number): string {
  return String(Math.round(valor * 10) / 10);
}

/** «M x y L x y …». Vacío si el tramo tiene menos de dos puntos. */
export function trazadoLinea(tramo: readonly Punto[], ex: Escala, ey: Escala): string {
  if (tramo.length < 2) return '';
  return tramo.map((p, i) => `${i === 0 ? 'M' : 'L'}${n(ex(p.t))} ${n(ey(p.medio))}`).join('');
}

/** Polígono cerrado: máximos de izquierda a derecha y mínimos de vuelta. Vacío si < 2 puntos. */
export function trazadoBanda(tramo: readonly Punto[], ex: Escala, ey: Escala): string {
  if (tramo.length < 2) return '';
  const ida = tramo.map((p, i) => `${i === 0 ? 'M' : 'L'}${n(ex(p.t))} ${n(ey(p.max))}`);
  const vuelta = [...tramo].reverse().map((p) => `L${n(ex(p.t))} ${n(ey(p.min))}`);
  return `${ida.join('')}${vuelta.join('')}Z`;
}

/** Puntos sueltos (tramos de un punto): un punto para el medio y un palito vertical para la horquilla. */
export function trazadoAislados(tramos: readonly Punto[][], ex: Escala, ey: Escala): { puntos: string; horquillas: string } {
  const sueltos = tramos.filter((tramo) => tramo.length === 1).map((tramo) => tramo[0] as Punto);
  return {
    puntos: sueltos.map((p) => `M${n(ex(p.t))} ${n(ey(p.medio))}h0`).join(''),
    horquillas: sueltos
      .filter((p) => p.max > p.min)
      .map((p) => `M${n(ex(p.t))} ${n(ey(p.max))}V${n(ey(p.min))}`)
      .join(''),
  };
}

export interface Lienzo {
  ancho: number;
  alto: number;
  /** Margen horizontal interior, para que un punto en el borde no quede cortado. */
  margenX: number;
}

export const LIENZO_GRAFICO: Lienzo = { ancho: 1000, alto: 300, margenX: 6 };
export const LIENZO_MINI: Lienzo = { ancho: 100, alto: 32, margenX: 2 };

export interface Dibujo {
  dominio: Dominio;
  ex: Escala;
  ey: Escala;
  linea: string;
  banda: string;
  aislados: { puntos: string; horquillas: string };
  tramos: number;
}

/** Todo lo que hace falta para pintar una ventana. Lo usan el build y el navegador. */
export function dibujar(ventana: Ventana, lienzo: Lienzo, soloMedio = false): Dibujo {
  const dominio = dominioY(ventana.puntos, soloMedio);
  const ex = escalaLineal({ min: ventana.inicio, max: ventana.fin }, [lienzo.margenX, lienzo.ancho - lienzo.margenX]);
  const ey = escalaLineal(dominio, [lienzo.alto, 0]);
  const tramos = segmentar(ventana.puntos);
  return {
    dominio,
    ex,
    ey,
    linea: tramos.map((t) => trazadoLinea(t, ex, ey)).join(''),
    banda: soloMedio ? '' : tramos.map((t) => trazadoBanda(t, ex, ey)).join(''),
    aislados: trazadoAislados(tramos, ex, ey),
    tramos: tramos.length,
  };
}
