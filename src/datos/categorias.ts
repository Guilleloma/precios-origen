/**
 * Agrupación de la portada por categoría. El resumen ya trae los productos en el orden de las
 * categorías y de la configuración; aquí solo se separan, sin reordenar, los que tienen precio
 * en la semana de referencia de los que no (fuera de campaña), que van al final de su grupo.
 */

import type { Categoria, ProductoResumen, Resumen } from '../../scripts/ingesta/contrato.ts';

export interface GrupoCategoria {
  categoria: Categoria;
  /** `id` del encabezado de la sección, para enlazar a ella desde la navegación y el detalle. */
  ancla: string;
  /** Con precio en la semana de referencia, en el orden del contrato. */
  cotizan: ProductoResumen[];
  /** Sin precio en la semana de referencia, en el orden del contrato. */
  sinCotizar: ProductoResumen[];
  total: number;
}

const PREFIJO_ANCLA = 'categoria-';

/** `categoria-frutos-secos`: con prefijo para no chocar con otros `id` de la página. */
export function anclaCategoria(id: string): string {
  return `${PREFIJO_ANCLA}${id}`;
}

/**
 * Grupos en el orden de `resumen.categorias`. Las categorías sin productos no salen. Un producto
 * con una categoría que no está en la lista rompe el build en vez de desaparecer de la web.
 */
export function agruparPorCategoria(resumen: Pick<Resumen, 'categorias' | 'productos'>): GrupoCategoria[] {
  const conocidas = new Set(resumen.categorias.map((categoria) => categoria.id));
  const huerfano = resumen.productos.find((producto) => !conocidas.has(producto.categoria));
  if (huerfano) {
    throw new Error(`El producto ${huerfano.slug} tiene la categoría ${huerfano.categoria}, que no está en el resumen.`);
  }

  return resumen.categorias
    .map((categoria) => {
      const productos = resumen.productos.filter((producto) => producto.categoria === categoria.id);
      return {
        categoria,
        ancla: anclaCategoria(categoria.id),
        cotizan: productos.filter((producto) => producto.cotizaEstaSemana),
        sinCotizar: productos.filter((producto) => !producto.cotizaEstaSemana),
        total: productos.length,
      };
    })
    .filter((grupo) => grupo.total > 0);
}

/** Categoría de un producto, para el detalle. */
export function categoriaDe(resumen: Pick<Resumen, 'categorias'>, producto: ProductoResumen): Categoria {
  const categoria = resumen.categorias.find((candidata) => candidata.id === producto.categoria);
  if (!categoria) throw new Error(`El producto ${producto.slug} tiene la categoría ${producto.categoria}, que no está en el resumen.`);
  return categoria;
}
