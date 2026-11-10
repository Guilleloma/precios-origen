/**
 * Formato de cifras en es-ES sin depender de Intl, para que el build y el navegador
 * escriban exactamente lo mismo. Los precios de la GVA nunca pasan de 2 decimales.
 */

/** Signo menos tipográfico: los lectores de pantalla lo leen como «menos». */
export const MENOS = '−';
/** Espacio duro entre cifra y unidad, para que «0,27 €/kg» no se parta en dos líneas. */
export const ESPACIO_DURO = ' ';

export function formatearCifra(valor: number, decimales: number): string {
  const absoluto = Math.abs(valor).toFixed(decimales);
  const esCero = Number(absoluto) === 0;
  const conComa = absoluto.replace('.', ',');
  return valor < 0 && !esCero ? `${MENOS}${conComa}` : conComa;
}

/** «0,27» */
export function formatearPrecio(euros: number): string {
  return formatearCifra(euros, 2);
}

/** «0,27 €/kg» */
export function formatearPrecioConUnidad(euros: number, unidad: string): string {
  return `${formatearPrecio(euros)}${ESPACIO_DURO}${unidad}`;
}

/** «+0,01» / «−0,03» / «0,00» */
export function formatearConSigno(valor: number, decimales: number): string {
  const cifra = formatearCifra(valor, decimales);
  const esPositivo = valor > 0 && Number(Math.abs(valor).toFixed(decimales)) !== 0;
  return esPositivo ? `+${cifra}` : cifra;
}
