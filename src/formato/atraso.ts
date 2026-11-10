/**
 * Aviso de dato atrasado (sección 3 del plan): la GVA publica el miércoles; si el viernes
 * (5 días después del domingo de la última semana) no hay semana nueva, se avisa.
 */

import type { SemanaConLunes } from '../../scripts/ingesta/contrato.ts';
import { diasEntre, sumarDias } from './fechas.ts';

export const DIAS_PARA_AVISO = 5;

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

export function textoAtraso(ultima: SemanaConLunes): string {
  return `El dato de la semana ${semanaPendiente(ultima)} aún no se ha publicado. Ves los precios de la semana ${ultima.semana}.`;
}
