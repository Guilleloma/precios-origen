import { describe, expect, it } from 'vitest';
import { PRODUCTOS } from '../config/productos.ts';
import { leerFilas } from '../scripts/ingesta/csv.ts';
import { construirSerie, construirSeries, resolverDuplicado, seleccionarFilas } from '../scripts/ingesta/series.ts';
import { PRODUCTO_GARROFA, codigoDe, filaCsv, leerMuestra } from './factorias.ts';

const lunesFijo = () => '2026-09-14';
const filasMuestra = leerFilas(leerMuestra());
const producto = (slug: string) => PRODUCTOS.find((p) => p.slug === slug)!;

describe('seleccionarFilas', () => {
  it('should filter by variety code and zone, not by product name', () => {
    const navelina = seleccionarFilas(filasMuestra, producto('naranja-navelina'));
    expect(navelina).toHaveLength(18);
    expect(new Set(navelina.map((f) => f.codigoZona))).toEqual(new Set(['46']));
    // En la muestra hay Navelina de Alicante (85/03) y de Castellón (85/12) que no deben entrar.
    expect(filasMuestra.filter((f) => f.codigoVariedad === '85').length).toBeGreaterThan(18);
  });
});

describe('resolverDuplicado', () => {
  it('should keep one row when the duplicates are identical', () => {
    const p = { min: 68, medio: 69, max: 69 };
    expect(resolverDuplicado([p, { ...p }, { ...p }], 'garrofa')).toEqual(p);
  });

  it('should keep the row whose range contains the others (garrofa, week 38 of 2026)', () => {
    const ancha = { min: 43, medio: 44, max: 45 };
    expect(resolverDuplicado([{ min: 45, medio: 45, max: 45 }, ancha], 'garrofa')).toEqual(ancha);
  });

  it('should keep the containing row among three (Navelina in Castellón, week 42 of 2026)', () => {
    const ancha = { min: 25, medio: 27, max: 30 };
    const estrecha = { min: 25, medio: 25, max: 25 };
    expect(resolverDuplicado([estrecha, ancha, estrecha], 'navelina')).toEqual(ancha);
  });

  it('should fail when no row contains the others', () => {
    // Valores reales de la variedad 225 en Castellón, semana 50 de 2022.
    const filas = [
      { min: 150, medio: 160, max: 170 },
      { min: 75, medio: 112, max: 149 },
    ];
    expect(codigoDe(() => resolverDuplicado(filas, 'x'))).toBe('DUPLICADO_SIN_CONTENEDORA');
  });

  it('should fail when several rows share the widest range with a different mean', () => {
    const filas = [
      { min: 25, medio: 27, max: 30 },
      { min: 25, medio: 28, max: 30 },
    ];
    expect(codigoDe(() => resolverDuplicado(filas, 'x'))).toBe('DUPLICADO_AMBIGUO');
  });
});

describe('construirSerie', () => {
  it('should return one point per week in cents, sorted by date', () => {
    const filas = [
      filaCsv({ semana: 39, precioMinimo: '0,45', precioMedio: '0,46', precioMaximo: '0,47' }),
      filaCsv({ semana: 38 }),
      filaCsv({ semana: 38, precioMinimo: '0,45', precioMedio: '0,45', precioMaximo: '0,45' }),
    ];
    const lunes = ({ semana }: { semana: number }) => (semana === 38 ? '2026-09-14' : '2026-09-21');
    expect(construirSerie(filas, PRODUCTO_GARROFA, lunes)).toEqual([
      { anyo: 2026, semana: 38, lunes: '2026-09-14', min: 43, medio: 44, max: 45 },
      { anyo: 2026, semana: 39, lunes: '2026-09-21', min: 45, medio: 46, max: 47 },
    ]);
  });

  it('should fail when the configured product has no rows', () => {
    const otraZona = filaCsv({ codigoZona: '46' });
    expect(codigoDe(() => construirSerie([otraZona], PRODUCTO_GARROFA, lunesFijo))).toBe('PRODUCTO_SIN_FILAS');
  });

  it('should fail when the variety name does not match (reassigned code)', () => {
    const renombrada = filaCsv({ variedadCastellano: 'Garrofa Troceada' });
    expect(codigoDe(() => construirSerie([filaCsv(), renombrada], PRODUCTO_GARROFA, lunesFijo))).toBe(
      'PRODUCTO_NOMBRE_INESPERADO',
    );
  });

  it('should fail when a price has an unexpected format', () => {
    const conPunto = filaCsv({ precioMedio: '0.44' });
    expect(codigoDe(() => construirSerie([conPunto], PRODUCTO_GARROFA, lunesFijo))).toBe(
      'PRECIO_FORMATO_INESPERADO',
    );
  });

  it('should fail when min > mean, mean > max or a price is zero', () => {
    for (const precios of [
      { precioMinimo: '0,50', precioMedio: '0,44', precioMaximo: '0,55' },
      { precioMinimo: '0,40', precioMedio: '0,60', precioMaximo: '0,55' },
      { precioMinimo: '0,00', precioMedio: '0,00', precioMaximo: '0,00' },
    ]) {
      expect(codigoDe(() => construirSerie([filaCsv(precios)], PRODUCTO_GARROFA, lunesFijo))).toBe(
        'PRECIO_INCOHERENTE',
      );
    }
  });

  it('should not validate prices of products that are not configured', () => {
    const ajena = filaCsv({ codigoVariedad: '225', precioMinimo: '1,50', precioMedio: '1,12', precioMaximo: '1,49' });
    expect(construirSerie([filaCsv(), ajena], PRODUCTO_GARROFA, lunesFijo)).toHaveLength(1);
  });
});

describe('construirSeries con la muestra real', () => {
  const { semanas, series } = construirSeries(filasMuestra, PRODUCTOS);

  it('should cover the 2020–2021 change without jumps', () => {
    expect(semanas[0]).toEqual({ anyo: 2020, semana: 36, lunes: '2020-08-31' });
    expect(semanas.at(-1)).toEqual({ anyo: 2021, semana: 20, lunes: '2021-05-10' });
    expect(semanas).toHaveLength(17 + 20);
  });

  it('should date week 1 of 2021 on 28 Dec 2020', () => {
    const navelina = series.get('naranja-navelina')!;
    expect(navelina.at(-1)).toMatchObject({ anyo: 2021, semana: 1, lunes: '2020-12-28' });
  });

  it('should remove identical duplicates (garrofa 2020-37 and 2021-20, limón 2021-14)', () => {
    expect(series.get('garrofa')).toHaveLength(37);
    expect(series.get('limon-fino')).toHaveLength(28);
    expect(series.get('garrofa')!.find((c) => c.anyo === 2020 && c.semana === 37)).toMatchObject({
      min: 68,
      medio: 69,
      max: 69,
    });
  });

  it('should build the seven configured series', () => {
    expect([...series.keys()]).toEqual(PRODUCTOS.map((p) => p.slug));
    for (const serie of series.values()) {
      const fechas = serie.map((c) => c.lunes);
      expect(fechas).toEqual([...fechas].sort());
      expect(new Set(fechas).size).toBe(fechas.length);
    }
  });

  it('should fail when a week is missing from the global calendar', () => {
    const sinSemana = filasMuestra.filter((f) => !(f.anyo === 2021 && f.semana === 5));
    expect(codigoDe(() => construirSeries(sinSemana, PRODUCTOS))).toBe('CALENDARIO_SALTO');
  });
});
