import { describe, expect, it } from 'vitest';
import type { Categoria, ProductoResumen } from '../scripts/ingesta/contrato.ts';
import { agruparPorCategoria, anclaCategoria, categoriaDe } from '../src/datos/categorias.ts';
import { listaCategorias, textoRecuentoCategoria, textoResumenSemana } from '../src/formato/categorias.ts';
import { productoResumen } from './factorias-web.ts';

const CATEGORIAS: Categoria[] = [
  { id: 'citricos', etiqueta: 'Cítricos' },
  { id: 'fruta', etiqueta: 'Fruta' },
  { id: 'uva', etiqueta: 'Uva de mesa' },
  { id: 'frutos-secos', etiqueta: 'Frutos secos' },
  { id: 'aceite-y-garrofa', etiqueta: 'Aceite y garrofa' },
];

const SIN_COTIZAR = {
  cotizaEstaSemana: false,
  ultimo: { anyo: 2026, semana: 20, lunes: '2026-05-11', min: 1, medio: 1.2, max: 1.4 },
  variacion: null,
} satisfies Partial<ProductoResumen>;

const producto = (slug: string, categoria: ProductoResumen['categoria'], cotiza = true) =>
  productoResumen({ slug, nombre: slug, categoria, ...(cotiza ? {} : SIN_COTIZAR) });

const slugs = (productos: ProductoResumen[]) => productos.map((p) => p.slug);

describe('agruparPorCategoria', () => {
  it('should keep the category order of the summary and the contract order inside each group', () => {
    const grupos = agruparPorCategoria({
      categorias: CATEGORIAS,
      productos: [
        producto('navelina', 'citricos'),
        producto('clemenules', 'citricos'),
        producto('caqui', 'fruta'),
        producto('garrofa', 'aceite-y-garrofa'),
      ],
    });
    expect(grupos.map((g) => g.categoria.id)).toEqual(['citricos', 'fruta', 'aceite-y-garrofa']);
    expect(slugs(grupos[0]!.cotizan)).toEqual(['navelina', 'clemenules']);
  });

  it('should put the products without price this week after the rest, keeping the order of each part', () => {
    const [citricos] = agruparPorCategoria({
      categorias: CATEGORIAS,
      productos: [
        producto('navelina', 'citricos'),
        producto('lane-late', 'citricos', false),
        producto('clemenules', 'citricos'),
        producto('salustiana', 'citricos', false),
        producto('limon-fino', 'citricos'),
      ],
    });
    expect(slugs(citricos!.cotizan)).toEqual(['navelina', 'clemenules', 'limon-fino']);
    expect(slugs(citricos!.sinCotizar)).toEqual(['lane-late', 'salustiana']);
    expect(citricos!.total).toBe(5);
  });

  it('should leave out categories without products', () => {
    const grupos = agruparPorCategoria({ categorias: CATEGORIAS, productos: [producto('garrofa', 'aceite-y-garrofa')] });
    expect(grupos).toHaveLength(1);
    expect(grupos[0]!.ancla).toBe('categoria-aceite-y-garrofa');
  });

  it('should return no groups when there are no products', () => {
    expect(agruparPorCategoria({ categorias: CATEGORIAS, productos: [] })).toEqual([]);
  });

  it('should fail when a product has a category that is not in the summary', () => {
    expect(() =>
      agruparPorCategoria({ categorias: CATEGORIAS.slice(0, 1), productos: [producto('garrofa', 'aceite-y-garrofa')] }),
    ).toThrow(/garrofa.*aceite-y-garrofa/);
  });
});

describe('anclaCategoria y categoriaDe', () => {
  it('should prefix the anchor so it does not clash with other ids of the page', () => {
    expect(anclaCategoria('frutos-secos')).toBe('categoria-frutos-secos');
  });

  it('should find the category of a product', () => {
    expect(categoriaDe({ categorias: CATEGORIAS }, producto('caqui', 'fruta')).etiqueta).toBe('Fruta');
  });

  it('should fail when the category of a product is unknown', () => {
    expect(() => categoriaDe({ categorias: [] }, producto('caqui', 'fruta'))).toThrow(/caqui/);
  });
});

describe('textos de recuento', () => {
  it('should say how many products a category has and how many have a price this week', () => {
    expect(textoRecuentoCategoria(12, 4, 44)).toBe('12 productos · 4 con precio en la sem. 44');
  });

  it('should say «todos» and «ninguno» at the edges', () => {
    expect(textoRecuentoCategoria(4, 4, 44)).toBe('4 productos · todos con precio en la sem. 44');
    expect(textoRecuentoCategoria(3, 0, 44)).toBe('3 productos · ninguno con precio en la sem. 44');
  });

  it('should use the singular with a single product', () => {
    expect(textoRecuentoCategoria(1, 1, 44)).toBe('1 producto · con precio en la sem. 44');
    expect(textoRecuentoCategoria(1, 0, 44)).toBe('1 producto · sin precio en la sem. 44');
  });

  it('should summarise the week over the whole catalogue', () => {
    expect(textoResumenSemana(36, 17, 'semana 44')).toBe('17 de 36 productos tienen precio en la semana 44.');
    expect(textoResumenSemana(36, 1, 'semana 44')).toBe('1 de 36 productos tiene precio en la semana 44.');
    expect(textoResumenSemana(36, 36, 'semana 44')).toBe('Los 36 productos tienen precio en la semana 44.');
  });

  it('should list the categories in lower case without a double «y»', () => {
    expect(listaCategorias(CATEGORIAS)).toBe('cítricos, fruta, uva de mesa, frutos secos, aceite y garrofa');
    expect(listaCategorias(CATEGORIAS.slice(0, 3))).toBe('cítricos, fruta y uva de mesa');
    expect(listaCategorias(CATEGORIAS.slice(0, 1))).toBe('cítricos');
    expect(listaCategorias([])).toBe('');
  });
});
