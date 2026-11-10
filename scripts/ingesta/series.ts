import type { Producto } from '../../config/productos.ts';
import type { FilaCsv } from './csv.ts';
import { ErrorIngesta } from './errores.ts';
import { comprobarCalendario, type Semana } from './semanas.ts';
import { validarPrecios, validarProducto, type PreciosCentimos } from './validar.ts';

/** Una semana con cotización. Precios en céntimos enteros. */
export interface Cotizacion extends PreciosCentimos {
  anyo: number;
  semana: number;
  lunes: string;
}

export interface SeriesConstruidas {
  /** Todas las semanas del CSV (de cualquier producto), ordenadas. */
  semanas: Array<Semana & { lunes: string }>;
  series: Map<string, Cotizacion[]>;
}

export function seleccionarFilas(filas: readonly FilaCsv[], producto: Producto): FilaCsv[] {
  return filas.filter((f) => f.codigoVariedad === producto.codigoVariedad && f.codigoZona === producto.codigoZona);
}

const mismaHorquilla = (a: PreciosCentimos, b: PreciosCentimos) =>
  a.min === b.min && a.medio === b.medio && a.max === b.max;
const contiene = (a: PreciosCentimos, b: PreciosCentimos) => a.min <= b.min && a.max >= b.max;

/**
 * Regla 3 del plan. Filas idénticas: se queda una. Filas distintas: la que contiene la horquilla de
 * todas las demás. Si ninguna las contiene, o varias distintas lo hacen, falla: nunca se promedia.
 */
export function resolverDuplicado(precios: readonly PreciosCentimos[], descripcion: string): PreciosCentimos {
  const contenedoras = precios.filter((p) => precios.every((otro) => contiene(p, otro)));
  const [elegida] = contenedoras;
  if (!elegida) {
    throw new ErrorIngesta(
      'DUPLICADO_SIN_CONTENEDORA',
      `${descripcion}: filas duplicadas con valores distintos y ninguna horquilla contiene a las demás`,
    );
  }
  if (contenedoras.some((p) => !mismaHorquilla(p, elegida))) {
    throw new ErrorIngesta(
      'DUPLICADO_AMBIGUO',
      `${descripcion}: varias filas duplicadas con la misma horquilla y distinto precio medio`,
    );
  }
  return elegida;
}

/** Serie de un producto: una cotización por semana, validada, sin duplicados y ordenada por fecha. */
export function construirSerie(
  filas: readonly FilaCsv[],
  producto: Producto,
  lunesDe: (s: Semana) => string,
): Cotizacion[] {
  const propias = seleccionarFilas(filas, producto);
  validarProducto(propias, producto);

  const porSemana = new Map<string, { anyo: number; semana: number; precios: PreciosCentimos[] }>();
  for (const fila of propias) {
    const clave = `${fila.anyo}-${fila.semana}`;
    const grupo = porSemana.get(clave) ?? { anyo: fila.anyo, semana: fila.semana, precios: [] };
    grupo.precios.push(validarPrecios(fila, producto));
    porSemana.set(clave, grupo);
  }

  return [...porSemana.values()]
    .map(({ anyo, semana, precios }) => ({
      anyo,
      semana,
      lunes: lunesDe({ anyo, semana }),
      ...resolverDuplicado(precios, `${producto.slug}, semana ${semana}/${anyo}`),
    }))
    .sort((a, b) => a.lunes.localeCompare(b.lunes));
}

/** Comprueba el calendario global y construye las series de todos los productos configurados. */
export function construirSeries(filas: readonly FilaCsv[], productos: readonly Producto[]): SeriesConstruidas {
  const semanas = comprobarCalendario(filas);
  const lunesPorClave = new Map(semanas.map((s) => [`${s.anyo}-${s.semana}`, s.lunes]));
  const lunesDe = (s: Semana) => lunesPorClave.get(`${s.anyo}-${s.semana}`) as string;

  const series = new Map<string, Cotizacion[]>();
  for (const producto of productos) series.set(producto.slug, construirSerie(filas, producto, lunesDe));
  return { semanas, series };
}
