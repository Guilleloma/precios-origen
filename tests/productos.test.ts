import { describe, expect, it } from 'vitest';
import { PRODUCTOS, ZONAS } from '../config/productos.ts';

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
});
