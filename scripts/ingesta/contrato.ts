/**
 * Contrato de los JSON que genera la ingesta y consume la web (documentado en README.md).
 * Precios en €/kg con dos decimales como mucho. Fechas en ISO 8601 (AAAA-MM-DD).
 * `anyo` y `semana` son siempre los que publica la GVA; `lunes` es la fecha calculada.
 */

import type { CategoriaId } from '../../config/productos.ts';

export type { CategoriaId };

export const ESQUEMA = 1;
export const URL_DATASET = 'https://dadesobertes.gva.es/es/dataset/agr-obs-pre-origen';

export interface SemanaRef {
  anyo: number;
  semana: number;
}

export interface SemanaConLunes extends SemanaRef {
  lunes: string;
}

export interface Variacion {
  /** Diferencia del precio medio, en euros con dos decimales (+0.01, -0.03). */
  euros: number;
  /** Diferencia en porcentaje con un decimal (3.8, -1.2). */
  porcentaje: number;
  /** Cotización con la que se compara: la semana anterior o, si hay un hueco de 1 a 3 semanas, la última cotización. */
  respectoA: SemanaRef;
}

export interface Categoria {
  id: CategoriaId;
  /** Etiqueta legible en español («Frutos secos»). */
  etiqueta: string;
}

export interface ProductoResumen {
  slug: string;
  nombre: string;
  /** `id` de una de las `categorias` del resumen. Añadido en la ampliación de productos (compatible). */
  categoria: CategoriaId;
  provincia: string;
  unidad: string;
  posicion: string;
  /** Tiene fila en `ultimaSemana`. */
  cotizaEstaSemana: boolean;
  /** Última cotización de la serie (de esta semana o de antes, si no cotiza). */
  ultimo: SemanaConLunes & { min: number; medio: number; max: number };
  /** null si no cotiza esta semana, si es su primera cotización o si hay un hueco de 4 semanas o más. */
  variacion: Variacion | null;
  /** Cotización anterior a `ultimo` (null si no hay). Añadido al contrato del plan: ver README. */
  anterior: SemanaConLunes | null;
}

export interface Resumen {
  esquema: typeof ESQUEMA;
  /** Momento en que se generó, UTC sin milisegundos (2026-11-04T16:31:10Z). */
  generadoEl: string;
  fuente: { actualizadoEl: string; urlDataset: string };
  /** Semana de referencia: la última del CSV para cualquier producto. */
  ultimaSemana: SemanaConLunes & { domingo: string };
  /** Todas las categorías, en el orden en que se muestran (aunque alguna se quedara sin productos). */
  categorias: Categoria[];
  /** Agrupados por categoría, en el orden de `categorias`, y dentro de cada una en el orden de la configuración. */
  productos: ProductoResumen[];
}

/** [lunes, año, semana, mínimo, medio, máximo] */
export type PuntoSerie = [string, number, number, number, number, number];

export interface SerieJson {
  slug: string;
  /** Ordenados por fecha y solo con las semanas que tienen cotización. */
  puntos: PuntoSerie[];
}
