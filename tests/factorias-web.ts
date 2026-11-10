import type { ProductoResumen, PuntoSerie } from '../scripts/ingesta/contrato.ts';
import { sumarDias } from '../src/formato/fechas.ts';
import { puntosDeSerie, type Punto } from '../src/grafico/serie.ts';

/** Producto del resumen con los valores reales de la Navelina en la semana 44 de 2026. */
export function productoResumen(datos: Partial<ProductoResumen> = {}): ProductoResumen {
  return {
    slug: 'naranja-navelina',
    nombre: 'Naranja Navelina',
    categoria: 'citricos',
    provincia: 'Valencia',
    unidad: '€/kg',
    posicion: 'sobre árbol',
    cotizaEstaSemana: true,
    ultimo: { anyo: 2026, semana: 44, lunes: '2026-10-26', min: 0.2, medio: 0.27, max: 0.34 },
    variacion: { euros: 0.01, porcentaje: 3.8, respectoA: { anyo: 2026, semana: 43 } },
    anterior: { anyo: 2026, semana: 43, lunes: '2026-10-19' },
    ...datos,
  };
}

/** Lunes de la semana ISO `semana` de 2026. */
export const lunes2026 = (semana: number) => sumarDias('2025-12-29', (semana - 1) * 7);

/** Puntos de 2026 para las semanas dadas, con medio = 0,30 + semana/100 y horquilla de ±0,05. */
export function puntos2026(semanas: readonly number[]): Punto[] {
  const serie: PuntoSerie[] = semanas.map((semana) => {
    const medio = Math.round(30 + semana) / 100;
    return [lunes2026(semana), 2026, semana, Math.round(medio * 100 - 5) / 100, medio, Math.round(medio * 100 + 5) / 100];
  });
  return puntosDeSerie(serie);
}

export const rango = (desde: number, hasta: number) => Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i);
