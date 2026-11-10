import { CATEGORIAS, ZONAS, type Producto } from '../../config/productos.ts';
import { ESQUEMA, URL_DATASET, type ProductoResumen, type Resumen, type SerieJson, type Variacion } from './contrato.ts';
import type { Cotizacion, SeriesConstruidas } from './series.ts';
import { diasEntre, sumarDias } from './semanas.ts';

/** A partir de este número de semanas sin dato entre dos cotizaciones no se calcula variación. */
export const HUECO_SIN_VARIACION = 4;

const aEuros = (centimos: number) => centimos / 100 || 0;

/** Redondeo a un decimal, simétrico respecto a cero. */
const redondearUnDecimal = (valor: number) => (Math.sign(valor) * Math.round(Math.abs(valor) * 10)) / 10 || 0;

/** Semanas sin cotización entre dos cotizaciones de la misma serie (0 si son consecutivas). */
export function semanasDeHueco(anterior: Cotizacion, actual: Cotizacion): number {
  return diasEntre(anterior.lunes, actual.lunes) / 7 - 1;
}

/**
 * Regla 6 del plan: variación de la última cotización en céntimos enteros contra la anterior de la
 * misma serie. Con un hueco de 1 a 3 semanas se compara igual; con 4 o más, no hay variación.
 */
export function calcularVariacion(serie: readonly Cotizacion[], cotizaEstaSemana: boolean): Variacion | null {
  const ultimo = serie.at(-1);
  const anterior = serie.at(-2);
  if (!cotizaEstaSemana || !ultimo || !anterior) return null;
  if (semanasDeHueco(anterior, ultimo) >= HUECO_SIN_VARIACION) return null;

  const diferencia = ultimo.medio - anterior.medio;
  return {
    euros: aEuros(diferencia),
    porcentaje: redondearUnDecimal((diferencia * 100) / anterior.medio),
    respectoA: { anyo: anterior.anyo, semana: anterior.semana },
  };
}

function resumirProducto(producto: Producto, serie: readonly Cotizacion[], lunesReferencia: string): ProductoResumen {
  const ultimo = serie.at(-1);
  if (!ultimo) throw new Error(`Serie vacía para ${producto.slug}`); // validarProducto lo impide antes
  const anterior = serie.at(-2);
  const cotizaEstaSemana = ultimo.lunes === lunesReferencia;
  return {
    slug: producto.slug,
    nombre: producto.nombre,
    categoria: producto.categoria,
    provincia: ZONAS[producto.codigoZona],
    unidad: producto.unidad,
    posicion: producto.posicion,
    cotizaEstaSemana,
    ultimo: {
      anyo: ultimo.anyo,
      semana: ultimo.semana,
      lunes: ultimo.lunes,
      min: aEuros(ultimo.min),
      medio: aEuros(ultimo.medio),
      max: aEuros(ultimo.max),
    },
    variacion: calcularVariacion(serie, cotizaEstaSemana),
    anterior: anterior ? { anyo: anterior.anyo, semana: anterior.semana, lunes: anterior.lunes } : null,
  };
}

const ORDEN_CATEGORIA = new Map<string, number>(CATEGORIAS.map((c, i) => [c.id, i]));

/** Agrupa por categoría en el orden de CATEGORIAS; dentro de cada una conserva el orden de entrada (sort estable). */
export function ordenarPorCategoria<T extends { categoria: string }>(productos: readonly T[]): T[] {
  const posicion = (p: T) => ORDEN_CATEGORIA.get(p.categoria) ?? CATEGORIAS.length;
  return [...productos].sort((a, b) => posicion(a) - posicion(b));
}

export function construirResumen(
  { semanas, series }: SeriesConstruidas,
  productos: readonly Producto[],
  { actualizadoEl, generadoEl }: { actualizadoEl: string; generadoEl: string },
): Resumen {
  const referencia = semanas.at(-1);
  if (!referencia) throw new Error('No hay semanas en el CSV'); // leerFilas lo impide antes
  return {
    esquema: ESQUEMA,
    generadoEl,
    fuente: { actualizadoEl, urlDataset: URL_DATASET },
    ultimaSemana: { ...referencia, domingo: sumarDias(referencia.lunes, 6) },
    categorias: CATEGORIAS.map(({ id, etiqueta }) => ({ id, etiqueta })),
    productos: ordenarPorCategoria(productos).map((p) => resumirProducto(p, series.get(p.slug) ?? [], referencia.lunes)),
  };
}

export function construirSerieJson(slug: string, serie: readonly Cotizacion[]): SerieJson {
  return {
    slug,
    puntos: serie.map((c) => [c.lunes, c.anyo, c.semana, aEuros(c.min), aEuros(c.medio), aEuros(c.max)]),
  };
}
