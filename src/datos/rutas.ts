/** Rutas internas bajo la base de publicación (GitHub Pages sirve en `/precios-origen/`). */

export function unirRuta(base: string, ruta = ''): string {
  const inicio = base.endsWith('/') ? base : `${base}/`;
  return `${inicio}${ruta.replace(/^\/+/, '')}`;
}

export function rutaProducto(base: string, slug: string): string {
  return unirRuta(base, `${slug}/`);
}
