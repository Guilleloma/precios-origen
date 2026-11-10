import { ErrorIngesta } from './errores.ts';

export const COLUMNAS = [
  'anyo_precio',
  'semana_precio',
  'codigo_grupo_producto',
  'grupo_producto_castellano',
  'grupo_producto_valenciano',
  'codigo_producto',
  'producto_castellano',
  'producto_valenciano',
  'codigo_variedad',
  'variedad_castellano',
  'variedad_valenciano',
  'codigo_zona',
  'zona_castellano',
  'zona_valenciano',
  'precio_minimo',
  'precio_medio',
  'precio_maximo',
] as const;

/** Fila del CSV con los campos que usa la ingesta. Los precios se guardan en bruto («0,27»). */
export interface FilaCsv {
  linea: number;
  anyo: number;
  semana: number;
  codigoVariedad: string;
  variedadCastellano: string;
  codigoZona: string;
  precioMinimo: string;
  precioMedio: string;
  precioMaximo: string;
}

const SEPARADOR = ';';
const COMILLA = '"';

/**
 * Parte un texto CSV en registros. Admite campos entre comillas con separadores,
 * comas, saltos de línea y comillas dobladas ("") dentro. Ignora líneas vacías.
 */
export function parsearCsv(texto: string): string[][] {
  const registros: string[][] = [];
  let registro: string[] = [];
  let campo = '';
  let entreComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (entreComillas) {
      if (c !== COMILLA) campo += c;
      else if (texto[i + 1] === COMILLA) {
        campo += COMILLA;
        i++;
      } else entreComillas = false;
    } else if (c === COMILLA) entreComillas = true;
    else if (c === SEPARADOR) {
      registro.push(campo);
      campo = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      registro.push(campo);
      if (registro.length > 1 || registro[0] !== '') registros.push(registro);
      registro = [];
      campo = '';
    } else campo += c;
  }
  if (entreComillas) throw new ErrorIngesta('CSV_MAL_FORMADO', 'El CSV termina con unas comillas sin cerrar');
  registro.push(campo);
  if (registro.length > 1 || registro[0] !== '') registros.push(registro);
  return registros;
}

function parsearEntero(valor: string, min: number, max: number, campo: string, linea: number): number {
  if (!/^\d+$/.test(valor) || Number(valor) < min || Number(valor) > max) {
    throw new ErrorIngesta('CSV_FORMATO_INESPERADO', `Línea ${linea}: «${campo}» no es válido («${valor}»)`);
  }
  return Number(valor);
}

/** Lee el CSV de la GVA: exige exactamente las 17 columnas esperadas y 17 campos por fila. */
export function leerFilas(texto: string): FilaCsv[] {
  const registros = parsearCsv(texto.replace(/^﻿/, ''));
  const [cabecera, ...resto] = registros;
  if (!cabecera || cabecera.join(SEPARADOR) !== COLUMNAS.join(SEPARADOR)) {
    throw new ErrorIngesta(
      'CSV_CABECERA_INESPERADA',
      `La cabecera no son las ${COLUMNAS.length} columnas esperadas: «${(cabecera ?? []).join(SEPARADOR).slice(0, 300)}»`,
    );
  }
  if (resto.length === 0) throw new ErrorIngesta('CSV_VACIO', 'El CSV no tiene filas de datos');

  return resto.map((campos, i) => {
    const linea = i + 2;
    if (campos.length !== COLUMNAS.length) {
      throw new ErrorIngesta(
        'CSV_FORMATO_INESPERADO',
        `Línea ${linea}: tiene ${campos.length} campos y se esperaban ${COLUMNAS.length}`,
      );
    }
    const valor = (columna: (typeof COLUMNAS)[number]) => campos[COLUMNAS.indexOf(columna)] as string;
    return {
      linea,
      anyo: parsearEntero(valor('anyo_precio'), 2000, 2100, 'anyo_precio', linea),
      semana: parsearEntero(valor('semana_precio'), 1, 53, 'semana_precio', linea),
      codigoVariedad: valor('codigo_variedad'),
      variedadCastellano: valor('variedad_castellano'),
      codigoZona: valor('codigo_zona'),
      precioMinimo: valor('precio_minimo'),
      precioMedio: valor('precio_medio'),
      precioMaximo: valor('precio_maximo'),
    };
  });
}

const PRECIO = /^(\d+),(\d{2})$/;

/** Convierte un precio de la GVA («0,27») a céntimos enteros. Exige coma y dos decimales. */
export function precioACentimos(valor: string): number {
  const m = PRECIO.exec(valor);
  if (!m) throw new ErrorIngesta('PRECIO_FORMATO_INESPERADO', `Precio con formato inesperado: «${valor}»`);
  return Number(m[1]) * 100 + Number(m[2]);
}
