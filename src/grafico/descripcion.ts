/** Texto alternativo del gráfico: resume la serie visible en una o dos frases. */

import { etiquetaSemana } from '../formato/fechas.ts';
import { formatearPrecio, formatearPrecioConUnidad } from '../formato/numeros.ts';
import type { Ventana } from './rango.ts';
import { segmentar } from './serie.ts';

export function describirVentana(ventana: Ventana, unidad: string): string {
  const { puntos } = ventana;
  const primero = puntos[0];
  const ultimo = puntos.at(-1);
  if (!primero || !ultimo) return 'Sin cotizaciones en este periodo.';

  const medios = puntos.map((p) => p.medio);
  const bajo = formatearPrecio(Math.min(...medios));
  const alto = formatearPrecioConUnidad(Math.max(...medios), unidad);
  const cortes = segmentar(puntos).length - 1;
  const semanas = puntos.length === 1 ? '1 semana con cotización' : `${puntos.length} semanas con cotización`;
  const huecos = cortes === 0 ? 'sin huecos' : cortes === 1 ? '1 periodo sin cotización' : `${cortes} periodos sin cotización`;

  return (
    `Precio medio semanal desde la ${etiquetaSemana(primero)} hasta la ${etiquetaSemana(ultimo)}: ` +
    `entre ${bajo} y ${alto}; el último, ${formatearPrecioConUnidad(ultimo.medio, unidad)}. ` +
    `${semanas}, ${huecos}.`
  );
}
