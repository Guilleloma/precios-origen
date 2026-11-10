import type { Producto } from '../../config/productos.ts';
import { precioACentimos, type FilaCsv } from './csv.ts';
import { ErrorIngesta } from './errores.ts';
import { diasEntre } from './semanas.ts';

/** Días desde el domingo de la última semana a partir de los cuales la fuente se da por parada. */
export const DIAS_DESFASE = 10;
/** Puntos que una serie puede perder respecto a lo ya publicado (revisiones de la GVA). */
export const PUNTOS_PERDIDOS_MAX = 2;

export interface PreciosCentimos {
  min: number;
  medio: number;
  max: number;
}

/** El producto tiene filas y todas llevan el nombre esperado (detecta códigos reasignados). */
export function validarProducto(filas: readonly FilaCsv[], producto: Producto): void {
  if (filas.length === 0) {
    throw new ErrorIngesta(
      'PRODUCTO_SIN_FILAS',
      `No hay filas para ${producto.slug} (variedad ${producto.codigoVariedad}, zona ${producto.codigoZona})`,
    );
  }
  const ajena = filas.find((f) => !f.variedadCastellano.includes(producto.nombreEsperado));
  if (ajena) {
    throw new ErrorIngesta(
      'PRODUCTO_NOMBRE_INESPERADO',
      `Línea ${ajena.linea}: la variedad ${producto.codigoVariedad} se llama «${ajena.variedadCastellano}» y se esperaba «${producto.nombreEsperado}» (${producto.slug})`,
    );
  }
}

/** Precios con coma y dos decimales, mayores que cero y con mínimo ≤ medio ≤ máximo. */
export function validarPrecios(fila: FilaCsv, producto: Producto): PreciosCentimos {
  let precios: PreciosCentimos;
  try {
    precios = {
      min: precioACentimos(fila.precioMinimo),
      medio: precioACentimos(fila.precioMedio),
      max: precioACentimos(fila.precioMaximo),
    };
  } catch (e) {
    if (e instanceof ErrorIngesta) throw new ErrorIngesta(e.codigo, `Línea ${fila.linea} (${producto.slug}): ${e.message}`);
    throw e;
  }
  if (precios.min <= 0 || precios.min > precios.medio || precios.medio > precios.max) {
    throw new ErrorIngesta(
      'PRECIO_INCOHERENTE',
      `Línea ${fila.linea} (${producto.slug}): mínimo ${fila.precioMinimo}, medio ${fila.precioMedio}, máximo ${fila.precioMaximo}`,
    );
  }
  return precios;
}

export interface SemanaPublicada {
  anyo: number;
  semana: number;
  lunes: string;
}

/** La última semana no retrocede y ninguna serie pierde más de 2 puntos respecto a lo publicado. */
export function validarRetroceso(
  nueva: { ultimaSemana: SemanaPublicada; puntos: ReadonlyMap<string, number> },
  publicada: { ultimaSemana: SemanaPublicada; puntos: ReadonlyMap<string, number> } | null,
): void {
  if (!publicada) return;
  if (nueva.ultimaSemana.lunes < publicada.ultimaSemana.lunes) {
    throw new ErrorIngesta(
      'RETROCESO_SEMANA',
      `La última semana del CSV (${nueva.ultimaSemana.semana}/${nueva.ultimaSemana.anyo}) es anterior a la publicada (${publicada.ultimaSemana.semana}/${publicada.ultimaSemana.anyo})`,
    );
  }
  for (const [slug, antes] of publicada.puntos) {
    const ahora = nueva.puntos.get(slug);
    if (ahora === undefined) continue; // producto retirado de la configuración a propósito
    if (antes - ahora > PUNTOS_PERDIDOS_MAX) {
      throw new ErrorIngesta(
        'RETROCESO_SERIE',
        `La serie ${slug} pasa de ${antes} a ${ahora} semanas con dato (máximo ${PUNTOS_PERDIDOS_MAX} menos)`,
      );
    }
  }
}

/** Falla si han pasado 10 días o más desde el domingo de la última semana. */
export function validarDesfase(domingoUltimaSemana: string, hoy: string): void {
  const dias = diasEntre(domingoUltimaSemana, hoy);
  if (dias >= DIAS_DESFASE) {
    throw new ErrorIngesta(
      'DATOS_DESFASADOS',
      `Han pasado ${dias} días desde el domingo de la última semana (${domingoUltimaSemana}): la fuente no se ha actualizado`,
    );
  }
}
