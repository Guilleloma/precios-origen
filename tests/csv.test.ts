import { describe, expect, it } from 'vitest';
import { COLUMNAS, leerFilas, parsearCsv, precioACentimos } from '../scripts/ingesta/csv.ts';
import { ErrorIngesta } from '../scripts/ingesta/errores.ts';

const CABECERA = COLUMNAS.join(';');
const FILA_NAVELINA =
  '2026;44;1;"01 Cítricos";"01 Citrics";70;"04- Naranjas Navel";"04- Taronges Navel";85;"Naranja Navelina";"Taronja Navelina";"46";"Valencia";"València";0,20;0,27;0,34';

function codigoDe(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (e) {
    return e instanceof ErrorIngesta ? e.codigo : 'OTRO';
  }
  return undefined;
}

describe('parsearCsv', () => {
  it('should keep separators and commas inside quoted fields', () => {
    expect(parsearCsv('"a;b";"1,5";c\n')).toEqual([['a;b', '1,5', 'c']]);
  });

  it('should unescape doubled quotes and keep line breaks inside quotes', () => {
    expect(parsearCsv('"di ""hola""";"x\ny"\n')).toEqual([['di "hola"', 'x\ny']]);
  });

  it('should accept CRLF and a missing final newline, and skip empty lines', () => {
    expect(parsearCsv('a;b\r\n\r\nc;d')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('should keep empty fields', () => {
    expect(parsearCsv('a;;c\n')).toEqual([['a', '', 'c']]);
  });

  it('should fail when quotes are not closed', () => {
    expect(codigoDe(() => parsearCsv('"abc;d\n'))).toBe('CSV_MAL_FORMADO');
  });
});

describe('leerFilas', () => {
  it('should read the fields used by the ingestion from a real row', () => {
    const [fila] = leerFilas(`${CABECERA}\n${FILA_NAVELINA}\n`);
    expect(fila).toEqual({
      linea: 2,
      anyo: 2026,
      semana: 44,
      codigoVariedad: '85',
      variedadCastellano: 'Naranja Navelina',
      codigoZona: '46',
      precioMinimo: '0,20',
      precioMedio: '0,27',
      precioMaximo: '0,34',
    });
  });

  it('should ignore a UTF-8 BOM', () => {
    expect(leerFilas(`﻿${CABECERA}\n${FILA_NAVELINA}\n`)).toHaveLength(1);
  });

  it('should fail when a column is missing from the header', () => {
    const cabecera = COLUMNAS.slice(0, -1).join(';');
    expect(codigoDe(() => leerFilas(`${cabecera}\n${FILA_NAVELINA}\n`))).toBe('CSV_CABECERA_INESPERADA');
  });

  it('should fail when the columns are renamed or reordered', () => {
    const renombrada = CABECERA.replace('precio_medio', 'precio_promedio');
    expect(codigoDe(() => leerFilas(`${renombrada}\n${FILA_NAVELINA}\n`))).toBe('CSV_CABECERA_INESPERADA');
    const reordenada = [...COLUMNAS].reverse().join(';');
    expect(codigoDe(() => leerFilas(`${reordenada}\n${FILA_NAVELINA}\n`))).toBe('CSV_CABECERA_INESPERADA');
  });

  it('should fail when the separator changes', () => {
    const conComas = COLUMNAS.join(',');
    expect(codigoDe(() => leerFilas(`${conComas}\n${FILA_NAVELINA}\n`))).toBe('CSV_CABECERA_INESPERADA');
  });

  it('should fail on an HTML page instead of a CSV', () => {
    expect(codigoDe(() => leerFilas('<!DOCTYPE html><html><body>Error</body></html>'))).toBe(
      'CSV_CABECERA_INESPERADA',
    );
  });

  it('should fail when there are no data rows', () => {
    expect(codigoDe(() => leerFilas(`${CABECERA}\n`))).toBe('CSV_VACIO');
  });

  it('should fail when a row has a different number of fields', () => {
    expect(codigoDe(() => leerFilas(`${CABECERA}\n${FILA_NAVELINA};0,40\n`))).toBe('CSV_FORMATO_INESPERADO');
  });

  it('should fail when the year or week is not a valid number', () => {
    expect(codigoDe(() => leerFilas(`${CABECERA}\n${FILA_NAVELINA.replace('2026;44', '2026;54')}\n`))).toBe(
      'CSV_FORMATO_INESPERADO',
    );
    expect(codigoDe(() => leerFilas(`${CABECERA}\n${FILA_NAVELINA.replace('2026;44', '2026;s44')}\n`))).toBe(
      'CSV_FORMATO_INESPERADO',
    );
  });
});

describe('precioACentimos', () => {
  it('should parse a decimal comma with two decimals into integer cents', () => {
    expect(precioACentimos('0,27')).toBe(27);
    expect(precioACentimos('5,15')).toBe(515);
    expect(precioACentimos('12,05')).toBe(1205);
  });

  it('should fail on a decimal point, one decimal, thousands separator or empty value', () => {
    for (const valor of ['0.27', '0,2', '1.234,56', '', ' 0,27', '-0,10']) {
      expect(codigoDe(() => precioACentimos(valor))).toBe('PRECIO_FORMATO_INESPERADO');
    }
  });
});
