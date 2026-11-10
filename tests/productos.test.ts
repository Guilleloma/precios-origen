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
});
