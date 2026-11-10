/**
 * Variación semanal (cálculo propio, regla 6 del plan) y estado de cada fila de la lista
 * (tabla de estados del README). El color nunca va solo: siempre lleva flecha y signo.
 */

import type { ProductoResumen, Variacion } from '../../scripts/ingesta/contrato.ts';
import { diasEntre, etiquetaSemana, formatearMes } from './fechas.ts';
import { ESPACIO_DURO, formatearConSigno } from './numeros.ts';

export type Sentido = 'sube' | 'baja' | 'igual';

export interface VariacionFormateada {
  sentido: Sentido;
  /** Flecha visible; los lectores de pantalla leen `palabra` en su lugar. */
  flecha: '▲' | '▼' | '=';
  palabra: 'Sube' | 'Baja' | 'Sin cambios';
  /** «+0,01 € (+3,8 %)» */
  texto: string;
}

export function formatearVariacion(variacion: Variacion): VariacionFormateada {
  const sentido: Sentido = variacion.euros > 0 ? 'sube' : variacion.euros < 0 ? 'baja' : 'igual';
  const euros = formatearConSigno(variacion.euros, 2);
  const porcentaje = formatearConSigno(variacion.porcentaje, 1);
  const texto = `${euros}${ESPACIO_DURO}€ (${porcentaje}${ESPACIO_DURO}%)`;
  if (sentido === 'sube') return { sentido, flecha: '▲', palabra: 'Sube', texto };
  if (sentido === 'baja') return { sentido, flecha: '▼', palabra: 'Baja', texto };
  return { sentido, flecha: '=', palabra: 'Sin cambios', texto };
}

export type EstadoFila =
  | { tipo: 'variacion'; variacion: VariacionFormateada; respectoA: string | null }
  | { tipo: 'primeraTrasHueco'; texto: string }
  | { tipo: 'primeraDeLaSerie' }
  | { tipo: 'sinCotizacion'; texto: string };

/**
 * Las semanas citadas llevan siempre el año de la GVA («sem. 1 de 2026»): nunca son la inmediatamente
 * anterior, y sin año «sem. 1» puede leerse como de cualquier campaña. El mes de «Sin cotización» es el
 * del lunes de esa semana, así que la sem. 1 de 2026 puede ser de diciembre.
 */
export function estadoFila(producto: ProductoResumen): EstadoFila {
  const { ultimo, anterior, variacion } = producto;

  if (!producto.cotizaEstaSemana) {
    return {
      tipo: 'sinCotizacion',
      texto: `Sin cotización desde la ${etiquetaSemana(ultimo)} (${formatearMes(ultimo.lunes)})`,
    };
  }

  if (variacion) {
    const hayHueco = anterior !== null && diasEntre(anterior.lunes, ultimo.lunes) > 7;
    const respectoA = hayHueco ? `respecto a la ${etiquetaSemana(variacion.respectoA)}` : null;
    return { tipo: 'variacion', variacion: formatearVariacion(variacion), respectoA };
  }

  if (anterior) {
    return {
      tipo: 'primeraTrasHueco',
      texto: `Primera cotización desde la ${etiquetaSemana(anterior)}`,
    };
  }

  return { tipo: 'primeraDeLaSerie' };
}
