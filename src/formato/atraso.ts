/**
 * Aviso de dato atrasado (sección 3 del plan). La GVA publica cada semana (lunes a domingo) el
 * miércoles siguiente, es decir, 10 días después del domingo de la última semana que ya tenemos:
 * con la semana 44 (domingo 1 nov) en la web, la 45 sale el miércoles 11 nov.
 */

import type { SemanaConLunes } from '../../scripts/ingesta/contrato.ts';
import { diasEntre, formatearFecha, sumarDias } from './fechas.ts';

/**
 * Día de publicación normal, contado desde el domingo de la última semana. Coincide a propósito
 * con `DIAS_DESFASE` de `scripts/ingesta/validar.ts` (un test lo comprueba): no se importa de allí
 * para no meter la validación de la ingesta en el JavaScript del navegador.
 */
export const DIAS_HASTA_PUBLICACION = 10;

/**
 * El aviso sale el día siguiente al de publicación (el jueves). La ingesta corre a las 16:30 UTC
 * y da el dato por desfasado ya el miércoles por la tarde; la web espera a que acabe el miércoles,
 * porque quien entra esa mañana todavía no se ha perdido nada.
 */
export const DIAS_PARA_AVISO = DIAS_HASTA_PUBLICACION + 1;

export function hayAtraso(domingoUltimaSemana: string, hoy: string): boolean {
  return diasEntre(domingoUltimaSemana, hoy) >= DIAS_PARA_AVISO;
}

/**
 * Número de la semana que falta. Si su lunes cae en otro año, es la semana 1.
 * Aproximación: en enero de 2027 la GVA puede numerar distinto (riesgo anotado en el plan).
 */
export function semanaPendiente(ultima: SemanaConLunes): number {
  const lunesSiguiente = sumarDias(ultima.lunes, 7);
  return lunesSiguiente.startsWith(String(ultima.anyo)) ? ultima.semana + 1 : 1;
}

/** Miércoles en que debía publicarse la semana que falta: lunes de la última + 16 días. */
export function publicacionPrevista(ultima: SemanaConLunes): string {
  return sumarDias(ultima.lunes, 6 + DIAS_HASTA_PUBLICACION);
}

export function textoAtraso(ultima: SemanaConLunes): string {
  const miercoles = formatearFecha(publicacionPrevista(ultima)).replace(/ \d{4}$/, ''); // «11 nov»
  return `El dato de la semana ${semanaPendiente(ultima)} se retrasa: tenía que salir el miércoles ${miercoles} y aún no se ha publicado. Ves los precios de la semana ${ultima.semana}.`;
}
