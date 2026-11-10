/**
 * Textos de los recuentos de la portada: cuántos productos hay y cuántos tienen precio en la semana
 * de referencia. Se habla de «la semana N» y no de «esta semana» para que cuadre con el aviso de
 * dato atrasado, que dice qué semana se está viendo cuando la siguiente se retrasa.
 */

import type { Categoria } from '../../scripts/ingesta/contrato.ts';

const productos = (n: number) => `${n} ${n === 1 ? 'producto' : 'productos'}`;

/** «12 productos · 4 con precio en la sem. 44», «4 productos · todos con precio en la sem. 44». */
export function textoRecuentoCategoria(total: number, conPrecio: number, semana: number): string {
  const enSemana = `en la sem. ${semana}`;
  let precio: string;
  if (total === 1) precio = conPrecio === 1 ? `con precio ${enSemana}` : `sin precio ${enSemana}`;
  else if (conPrecio === total) precio = `todos con precio ${enSemana}`;
  else if (conPrecio === 0) precio = `ninguno con precio ${enSemana}`;
  else precio = `${conPrecio} con precio ${enSemana}`;
  return `${productos(total)} · ${precio}`;
}

/**
 * Línea de resumen de la portada: «17 de 36 productos tienen precio en la semana 44».
 * `semana` es la etiqueta ya formateada («semana 44» o «semana 44 (26 oct–1 nov 2026)»).
 */
export function textoResumenSemana(total: number, conPrecio: number, semana: string): string {
  if (conPrecio === total) return `Los ${total} productos tienen precio en la ${semana}.`;
  const verbo = conPrecio === 1 ? 'tiene' : 'tienen';
  return `${conPrecio} de ${productos(total)} ${verbo} precio en la ${semana}.`;
}

/**
 * «cítricos, fruta, uva de mesa, frutos secos, aceite y garrofa». Si la última etiqueta ya lleva
 * su propia «y», no se añade otra.
 */
export function listaCategorias(categorias: readonly Pick<Categoria, 'etiqueta'>[]): string {
  const nombres = categorias.map(({ etiqueta }) => etiqueta.charAt(0).toLowerCase() + etiqueta.slice(1));
  if (nombres.length < 2) return nombres.join('');
  const ultima = nombres.at(-1) ?? '';
  const resto = nombres.slice(0, -1).join(', ');
  return / y /.test(ultima) ? `${resto}, ${ultima}` : `${resto} y ${ultima}`;
}
