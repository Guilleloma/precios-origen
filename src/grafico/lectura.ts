/** Lectura del punto señalado en el gráfico y conversión entre posición en pantalla y tiempo. */

import type { SemanaRef } from '../../scripts/ingesta/contrato.ts';
import { etiquetaSemana, etiquetaSemanaConFechas } from '../formato/fechas.ts';
import { formatearPrecio, formatearPrecioConUnidad } from '../formato/numeros.ts';
import type { Ventana } from './rango.ts';
import type { Punto } from './serie.ts';
import type { Lienzo } from './trazado.ts';

export interface Lectura {
  /** «semana 44 (26 oct–1 nov 2026)» para la última semana; «sem. 12 de 2021» para el histórico. */
  semana: string;
  medio: string;
  horquilla: string;
  /** Todo en una frase, para el lector de pantalla. */
  frase: string;
}

export function leerPunto(punto: Punto, ultimaSemana: SemanaRef, unidad: string): Lectura {
  const esUltima = punto.anyo === ultimaSemana.anyo && punto.semana === ultimaSemana.semana;
  const semana = esUltima ? etiquetaSemanaConFechas(punto, punto.lunes) : etiquetaSemana(punto);
  const medio = formatearPrecioConUnidad(punto.medio, unidad);
  const horquilla = `mín. ${formatearPrecio(punto.min)} · máx. ${formatearPrecio(punto.max)}`;
  const frase =
    `${semana}: precio medio ${medio}, mínimo ${formatearPrecio(punto.min)}, ` +
    `máximo ${formatearPrecioConUnidad(punto.max, unidad)}`;
  return { semana, medio, horquilla, frase };
}

/** Momento (ms) que corresponde a una fracción del ancho del gráfico (0 = borde izquierdo). */
export function tiempoEnFraccion(ventana: Ventana, lienzo: Lienzo, fraccion: number): number {
  const x = fraccion * lienzo.ancho;
  const util = lienzo.ancho - 2 * lienzo.margenX;
  const relativo = Math.min(1, Math.max(0, (x - lienzo.margenX) / util));
  return ventana.inicio + relativo * (ventana.fin - ventana.inicio);
}
