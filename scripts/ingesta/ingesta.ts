import { readFile } from 'node:fs/promises';
import { PRODUCTOS, type Producto } from '../../config/productos.ts';
import type { Resumen } from './contrato.ts';
import { leerFilas } from './csv.ts';
import { descargarCsv, type CsvDescargado, type DependenciasDescarga } from './descarga.ts';
import { ErrorIngesta } from './errores.ts';
import { escribirPublicacion, leerPublicado, sinCambios, type Publicacion } from './publicacion.ts';
import { construirResumen, construirSerieJson } from './resumen.ts';
import { construirSeries } from './series.ts';
import { validarDesfase, validarRetroceso } from './validar.ts';

export interface OpcionesIngesta {
  url: string;
  salida: string;
  /** CSV local en lugar de descargarlo; exige `actualizadoEl`. */
  csv?: string;
  actualizadoEl?: string;
  /** Solo para trabajo local: el desfase de la fuente se avisa en lugar de fallar. */
  permitirDesfase?: boolean;
  productos?: readonly Producto[];
}

export interface DependenciasIngesta extends DependenciasDescarga {
  ahora: () => Date;
}

export interface ResultadoIngesta {
  estado: 'publicado' | 'sin-cambios';
  publicacion: Publicacion;
}

async function obtenerCsv(opciones: OpcionesIngesta, deps: DependenciasIngesta): Promise<CsvDescargado> {
  if (!opciones.csv) return descargarCsv(opciones.url, deps);

  const fecha = opciones.actualizadoEl;
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha) || new Date(`${fecha}T00:00:00Z`).toISOString().slice(0, 10) !== fecha) {
    throw new ErrorIngesta(
      'OPCION_INVALIDA',
      'Con --csv hace falta --actualizado-el AAAA-MM-DD (la fecha de actualización de la fuente que se publicará)',
    );
  }
  try {
    return { texto: await readFile(opciones.csv, 'utf8'), actualizadoEl: fecha };
  } catch (e) {
    throw new ErrorIngesta('CSV_NO_LEGIBLE', `No se puede leer ${opciones.csv}: ${(e as Error).message}`);
  }
}

/**
 * Descarga (o lee) el CSV, valida todo y solo entonces escribe la carpeta de salida.
 * Cualquier fallo lanza ErrorIngesta sin haber tocado la salida.
 */
export async function ejecutarIngesta(opciones: OpcionesIngesta, deps: DependenciasIngesta): Promise<ResultadoIngesta> {
  const productos = opciones.productos ?? PRODUCTOS;
  const { texto, actualizadoEl } = await obtenerCsv(opciones, deps);
  const construidas = construirSeries(leerFilas(texto), productos);

  const ahora = deps.ahora();
  const generadoEl = `${ahora.toISOString().slice(0, 19)}Z`;
  const resumen: Resumen = construirResumen(construidas, productos, { actualizadoEl, generadoEl });
  const series = productos.map((p) => construirSerieJson(p.slug, construidas.series.get(p.slug) ?? []));
  const publicacion = { resumen, series };

  try {
    validarDesfase(resumen.ultimaSemana.domingo, ahora.toISOString().slice(0, 10));
  } catch (e) {
    if (!(opciones.permitirDesfase && e instanceof ErrorIngesta)) throw e;
    deps.avisar(`Aviso (--permitir-desfase): ${e.message}`);
  }

  const antes = await leerPublicado(opciones.salida);
  const { anyo, semana, lunes } = resumen.ultimaSemana;
  validarRetroceso(
    { ultimaSemana: { anyo, semana, lunes }, puntos: new Map(series.map((s) => [s.slug, s.puntos.length])) },
    antes,
  );

  if (sinCambios(publicacion, antes)) return { estado: 'sin-cambios', publicacion };
  await escribirPublicacion(opciones.salida, publicacion);
  return { estado: 'publicado', publicacion };
}
