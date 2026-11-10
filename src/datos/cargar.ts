/**
 * Lectura de los JSON de la ingesta durante el build. Por defecto, la carpeta `data/`;
 * `DATOS_DIR` permite construir con otra (por ejemplo, la generada desde la muestra de los tests).
 */

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ESQUEMA, type Resumen, type SerieJson } from '../../scripts/ingesta/contrato.ts';

const carpeta = () => resolve(process.env.DATOS_DIR || 'data');

function leerJson<T>(fichero: string): T {
  const ruta = join(carpeta(), fichero);
  try {
    return JSON.parse(readFileSync(ruta, 'utf8')) as T;
  } catch (error) {
    throw new Error(`No se puede leer ${ruta}. Genera los datos con «npm run ingesta».`, { cause: error });
  }
}

let resumen: Resumen | undefined;

export function cargarResumen(): Resumen {
  if (resumen) return resumen;
  const leido = leerJson<Resumen>('resumen.json');
  if (leido.esquema !== ESQUEMA) {
    throw new Error(`El resumen tiene el esquema ${String(leido.esquema)} y la web espera el ${ESQUEMA}.`);
  }
  resumen = leido;
  return leido;
}

const SLUG_VALIDO = /^[a-z0-9-]+$/;

export function cargarSerie(slug: string): SerieJson {
  if (!SLUG_VALIDO.test(slug)) throw new Error(`Slug no válido: ${slug}`);
  const serie = leerJson<SerieJson>(join('series', `${slug}.json`));
  if (serie.slug !== slug) throw new Error(`La serie de ${slug} trae el slug ${serie.slug}.`);
  return serie;
}
