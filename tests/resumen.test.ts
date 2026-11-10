import { describe, expect, it } from 'vitest';
import { CATEGORIAS, PRODUCTOS } from '../config/productos.ts';
import { calcularVariacion, construirResumen, construirSerieJson, ordenarPorCategoria } from '../scripts/ingesta/resumen.ts';
import type { Cotizacion } from '../scripts/ingesta/series.ts';
import { sumarDias } from '../scripts/ingesta/semanas.ts';

/** Cotización de la semana `semana` de 2026 (lunes ISO) con precio medio en céntimos. */
function cotizacion(semana: number, medio: number): Cotizacion {
  return { anyo: 2026, semana, lunes: sumarDias('2025-12-29', (semana - 1) * 7), min: medio - 5, medio, max: medio + 5 };
}

describe('calcularVariacion', () => {
  it('should compare with the previous week when it has a quotation', () => {
    expect(calcularVariacion([cotizacion(43, 26), cotizacion(44, 27)], true)).toEqual({
      euros: 0.01,
      porcentaje: 3.8,
      respectoA: { anyo: 2026, semana: 43 },
    });
  });

  it('should round negative changes symmetrically and keep two decimals in euros', () => {
    expect(calcularVariacion([cotizacion(43, 38), cotizacion(44, 35)], true)).toEqual({
      euros: -0.03,
      porcentaje: -7.9,
      respectoA: { anyo: 2026, semana: 43 },
    });
  });

  it('should return zero, not minus zero, when the price does not change', () => {
    const variacion = calcularVariacion([cotizacion(43, 27), cotizacion(44, 27)], true);
    expect(Object.is(variacion?.euros, 0)).toBe(true);
    expect(Object.is(variacion?.porcentaje, 0)).toBe(true);
  });

  it('should compare with the last quotation across a gap of 1 to 3 weeks', () => {
    expect(calcularVariacion([cotizacion(42, 30), cotizacion(44, 33)], true)?.respectoA).toEqual({
      anyo: 2026,
      semana: 42,
    });
    expect(calcularVariacion([cotizacion(40, 30), cotizacion(44, 33)], true)).toEqual({
      euros: 0.03,
      porcentaje: 10,
      respectoA: { anyo: 2026, semana: 40 },
    });
  });

  it('should not compute a change after a gap of 4 weeks or more', () => {
    expect(calcularVariacion([cotizacion(39, 30), cotizacion(44, 33)], true)).toBeNull();
    expect(calcularVariacion([cotizacion(10, 30), cotizacion(44, 33)], true)).toBeNull();
  });

  it('should not compute a change for a product that does not quote this week', () => {
    expect(calcularVariacion([cotizacion(42, 30), cotizacion(43, 33)], false)).toBeNull();
  });

  it('should not compute a change for the first quotation of a series', () => {
    expect(calcularVariacion([cotizacion(44, 33)], true)).toBeNull();
  });

  it('should compute in whole cents without floating point drift', () => {
    expect(calcularVariacion([cotizacion(43, 110), cotizacion(44, 120)], true)?.euros).toBe(0.1);
    expect(calcularVariacion([cotizacion(43, 29), cotizacion(44, 58)], true)?.euros).toBe(0.29);
  });
});

describe('construirResumen', () => {
  const navelina = PRODUCTOS[0]!;
  const semanas = [41, 42, 43, 44].map((s) => ({ anyo: 2026, semana: s, lunes: cotizacion(s, 1).lunes }));
  const resumir = (serie: Cotizacion[]) =>
    construirResumen({ semanas, series: new Map([[navelina.slug, serie]]) }, [navelina], {
      actualizadoEl: '2026-11-04',
      generadoEl: '2026-11-04T16:31:10Z',
    });

  it('should describe the reference week with its Monday and Sunday', () => {
    expect(resumir([cotizacion(44, 27)]).ultimaSemana).toEqual({
      anyo: 2026,
      semana: 44,
      lunes: '2026-10-26',
      domingo: '2026-11-01',
    });
  });

  it('should mark a product without a row in the reference week and keep its last price', () => {
    const [producto] = resumir([cotizacion(41, 30), cotizacion(42, 33)]).productos;
    expect(producto).toMatchObject({
      cotizaEstaSemana: false,
      ultimo: { anyo: 2026, semana: 42, lunes: '2026-10-12', min: 0.28, medio: 0.33, max: 0.38 },
      variacion: null,
      anterior: { anyo: 2026, semana: 41, lunes: '2026-10-05' },
    });
  });

  it('should fill the product fields from the configuration', () => {
    const [producto] = resumir([cotizacion(44, 27)]).productos;
    expect(producto).toMatchObject({
      slug: 'naranja-navelina',
      nombre: 'Naranja Navelina',
      categoria: 'citricos',
      provincia: 'Valencia',
      unidad: '€/kg',
      posicion: 'sobre árbol',
      anterior: null,
    });
  });
});

describe('categorías en el resumen', () => {
  const semanas = [{ anyo: 2026, semana: 44, lunes: '2026-10-26' }];
  const resumirTodos = () =>
    construirResumen(
      { semanas, series: new Map(PRODUCTOS.map((p) => [p.slug, [cotizacion(44, 27)]])) },
      PRODUCTOS,
      { actualizadoEl: '2026-11-04', generadoEl: '2026-11-04T16:31:10Z' },
    );

  it('should list every category with its label in the fixed order', () => {
    expect(resumirTodos().categorias).toEqual(CATEGORIAS.map(({ id, etiqueta }) => ({ id, etiqueta })));
  });

  it('should group the products by category in that order and keep the configuration order inside each one', () => {
    const { productos } = resumirTodos();
    expect(productos).toHaveLength(PRODUCTOS.length);
    const orden = CATEGORIAS.map((c) => c.id);
    const indices = productos.map((p) => orden.indexOf(p.categoria));
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
    for (const { id } of CATEGORIAS) {
      const enResumen = productos.filter((p) => p.categoria === id).map((p) => p.slug);
      const enConfig = PRODUCTOS.filter((p) => p.categoria === id).map((p) => p.slug);
      expect(enResumen).toEqual(enConfig);
    }
  });

  it('should sort a mixed list by category without reordering products of the same category', () => {
    const lista = [
      { slug: 'a', categoria: 'aceite-y-garrofa' },
      { slug: 'b', categoria: 'citricos' },
      { slug: 'c', categoria: 'frutos-secos' },
      { slug: 'd', categoria: 'citricos' },
      { slug: 'e', categoria: 'fruta' },
    ];
    expect(ordenarPorCategoria(lista).map((p) => p.slug)).toEqual(['b', 'd', 'e', 'c', 'a']);
  });
});

describe('construirSerieJson', () => {
  it('should write [lunes, año, semana, mín, medio, máx] in euros', () => {
    expect(construirSerieJson('garrofa', [cotizacion(44, 51)])).toEqual({
      slug: 'garrofa',
      puntos: [['2026-10-26', 2026, 44, 0.46, 0.51, 0.56]],
    });
  });
});
