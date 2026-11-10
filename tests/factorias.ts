import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Producto } from '../config/productos.ts';
import { COLUMNAS, type FilaCsv } from '../scripts/ingesta/csv.ts';
import { ErrorIngesta } from '../scripts/ingesta/errores.ts';

export const RUTA_MUESTRA = fileURLToPath(new URL('./fixtures/muestra.csv', import.meta.url));
export const leerMuestra = () => readFileSync(RUTA_MUESTRA, 'utf8');
export const CABECERA = COLUMNAS.join(';');

export const PRODUCTO_GARROFA: Producto = {
  slug: 'garrofa',
  nombre: 'Garrofa entera',
  codigoVariedad: '165',
  codigoZona: '12',
  nombreEsperado: 'Garrofa Entera',
  unidad: '€/kg',
  posicion: 'entrada almacén',
};

let linea = 1;

/** Fila del CSV ya leída, con valores reales de la garrofa por defecto. */
export function filaCsv(datos: Partial<FilaCsv> = {}): FilaCsv {
  linea++;
  return {
    linea,
    anyo: 2026,
    semana: 38,
    codigoVariedad: '165',
    variedadCastellano: 'Garrofa Entera',
    codigoZona: '12',
    precioMinimo: '0,43',
    precioMedio: '0,44',
    precioMaximo: '0,45',
    ...datos,
  };
}

/** Código del ErrorIngesta que lanza `fn`, o undefined si no lanza. */
export function codigoDe(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (e) {
    return e instanceof ErrorIngesta ? e.codigo : 'OTRO';
  }
  return undefined;
}
