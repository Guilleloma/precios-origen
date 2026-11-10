import { describe, expect, it } from 'vitest';
import { CATEGORIAS, PRODUCTOS, ZONAS } from '../config/productos.ts';

describe('config/productos', () => {
  it('should not repeat slugs', () => {
    const slugs = PRODUCTOS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('should not repeat a variedad + zona pair', () => {
    const pares = PRODUCTOS.map((p) => `${p.codigoVariedad}|${p.codigoZona}`);
    expect(new Set(pares).size).toBe(pares.length);
  });

  it('should use kebab-case slugs that are safe as file names', () => {
    for (const p of PRODUCTOS) expect(p.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('should only use known zones and numeric variety codes', () => {
    for (const p of PRODUCTOS) {
      expect(Object.keys(ZONAS)).toContain(p.codigoZona);
      expect(p.codigoVariedad).toMatch(/^\d+$/);
      expect(p.nombreEsperado.length).toBeGreaterThan(0);
    }
  });

  it('should assign every product to one of the closed set of categories', () => {
    const ids = CATEGORIAS.map((c) => c.id);
    for (const p of PRODUCTOS) expect(ids, p.slug).toContain(p.categoria);
  });

  it('should define categories with unique ids, kebab-case and a non-empty Spanish label', () => {
    expect(new Set(CATEGORIAS.map((c) => c.id)).size).toBe(CATEGORIAS.length);
    expect(new Set(CATEGORIAS.map((c) => c.etiqueta)).size).toBe(CATEGORIAS.length);
    for (const c of CATEGORIAS) {
      expect(c.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
      expect(c.etiqueta.trim().length).toBeGreaterThan(0);
    }
  });

  it('should have at least one product in every category', () => {
    for (const { id } of CATEGORIAS) expect(PRODUCTOS.some((p) => p.categoria === id), id).toBe(true);
  });

  it('should not repeat display names', () => {
    const nombres = PRODUCTOS.map((p) => p.nombre);
    expect(new Set(nombres).size).toBe(nombres.length);
  });

  it('should give the same expected name to every product that shares a variety code', () => {
    const porCodigo = new Map<string, string>();
    for (const p of PRODUCTOS) {
      expect(porCodigo.get(p.codigoVariedad) ?? p.nombreEsperado, p.slug).toBe(p.nombreEsperado);
      porCodigo.set(p.codigoVariedad, p.nombreEsperado);
    }
  });

  it('should use one of the commercial positions published by the GVA, in €/kg', () => {
    const posiciones = ['sobre árbol', 'sobre cepa', 'grano, entrada descascaradora', 'entrada almacén'];
    for (const p of PRODUCTOS) {
      expect(posiciones, p.slug).toContain(p.posicion);
      expect(p.unidad).toBe('€/kg');
    }
  });

  it('should quote citrus and persimmon on the tree, table grapes on the vine and almonds at the sheller', () => {
    const posicionDe = (slug: string) => PRODUCTOS.find((p) => p.slug === slug)?.posicion;
    for (const p of PRODUCTOS.filter((p) => p.categoria === 'citricos')) expect(p.posicion, p.slug).toBe('sobre árbol');
    for (const p of PRODUCTOS.filter((p) => p.categoria === 'uva')) expect(p.posicion, p.slug).toBe('sobre cepa');
    for (const p of PRODUCTOS.filter((p) => p.categoria === 'frutos-secos')) {
      expect(p.posicion, p.slug).toBe('grano, entrada descascaradora');
    }
    expect(posicionDe('caqui-rojo-brillante')).toBe('sobre árbol');
    expect(posicionDe('granada-mollar')).toBe('entrada almacén');
  });

  it('should keep the province of the seven MVP products', () => {
    const zonas = Object.fromEntries(PRODUCTOS.map((p) => [p.slug, p.codigoZona]));
    expect(zonas).toMatchObject({
      'naranja-navelina': '46',
      'clementina-clemenules': '12',
      'almendra-comuna': '03',
      'almendra-marcona': '03',
      garrofa: '12',
      'aceite-virgen-extra': '12',
      'limon-fino': '03',
    });
  });
});
