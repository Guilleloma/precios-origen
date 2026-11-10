import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Resumen, SerieJson } from './contrato.ts';
import { ErrorIngesta } from './errores.ts';
import type { SemanaPublicada } from './validar.ts';

export interface Publicacion {
  resumen: Resumen;
  series: SerieJson[];
}

export interface PublicadoAntes {
  resumen: Resumen;
  ultimaSemana: SemanaPublicada;
  puntos: Map<string, number>;
  /** Contenido actual de cada fichero, por ruta relativa a la carpeta de salida. */
  ficheros: Map<string, string>;
}

const RESUMEN = 'resumen.json';
const SERIES = 'series';

const aTexto = (valor: unknown) => `${JSON.stringify(valor, null, 2)}\n`;

/** Una semana por línea: legible y con diffs pequeños en la rama `datos`. */
const serieATexto = ({ slug, puntos }: SerieJson) =>
  `{\n  "slug": ${JSON.stringify(slug)},\n  "puntos": [\n${puntos.map((p) => `    ${JSON.stringify(p)}`).join(',\n')}\n  ]\n}\n`;

async function leerSiExiste(ruta: string): Promise<string | null> {
  try {
    return await readFile(ruta, 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw e;
  }
}

/** Lee lo ya publicado en la carpeta de salida (null si aún no hay nada). */
export async function leerPublicado(salida: string): Promise<PublicadoAntes | null> {
  const textoResumen = await leerSiExiste(join(salida, RESUMEN));
  if (textoResumen === null) return null;

  const ficheros = new Map([[RESUMEN, textoResumen]]);
  const puntos = new Map<string, number>();
  try {
    const resumen = JSON.parse(textoResumen) as Resumen;
    for (const { slug } of resumen.productos) {
      const texto = await leerSiExiste(join(salida, SERIES, `${slug}.json`));
      if (texto === null) continue;
      ficheros.set(`${SERIES}/${slug}.json`, texto);
      puntos.set(slug, (JSON.parse(texto) as SerieJson).puntos.length);
    }
    const { anyo, semana, lunes } = resumen.ultimaSemana;
    return { resumen, ultimaSemana: { anyo, semana, lunes }, puntos, ficheros };
  } catch (e) {
    throw new ErrorIngesta('PUBLICADO_ILEGIBLE', `No se pueden leer los datos ya publicados en ${salida}: ${(e as Error).message}`);
  }
}

/** Ficheros que hay que escribir, por ruta relativa, con su contenido final. */
export function serializar({ resumen, series }: Publicacion): Map<string, string> {
  const ficheros = new Map<string, string>();
  for (const serie of series) ficheros.set(`${SERIES}/${serie.slug}.json`, serieATexto(serie));
  ficheros.set(RESUMEN, aTexto(resumen)); // el último: es el que da por buena la publicación
  return ficheros;
}

/** Igual a lo publicado salvo, como mucho, `generadoEl`. */
export function sinCambios(publicacion: Publicacion, antes: PublicadoAntes | null): boolean {
  if (!antes) return false;
  const conFechaAnterior = { ...publicacion, resumen: { ...publicacion.resumen, generadoEl: antes.resumen.generadoEl } };
  const nuevos = serializar(conFechaAnterior);
  return nuevos.size === antes.ficheros.size && [...nuevos].every(([ruta, texto]) => antes.ficheros.get(ruta) === texto);
}

/**
 * Escribe cada fichero en un temporal y lo renombra encima del definitivo, con el resumen al final.
 * Borra las series de productos que ya no están en la configuración. No toca nada más de la carpeta
 * (puede ser la copia de trabajo de la rama `datos`).
 */
export async function escribirPublicacion(salida: string, publicacion: Publicacion): Promise<void> {
  await mkdir(join(salida, SERIES), { recursive: true });
  const ficheros = serializar(publicacion);
  for (const [ruta, texto] of ficheros) {
    const destino = join(salida, ruta);
    const temporal = `${destino}.tmp-${process.pid}`;
    await writeFile(temporal, texto, 'utf8');
    await rename(temporal, destino);
  }
  for (const nombre of await readdir(join(salida, SERIES))) {
    if (nombre.endsWith('.json') && !ficheros.has(`${SERIES}/${nombre}`)) await rm(join(salida, SERIES, nombre));
  }
}
