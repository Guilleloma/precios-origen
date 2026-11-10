// @ts-check
import { defineConfig } from 'astro/config';

/**
 * El dominio y la ruta base vienen del entorno para no escribir en el código la dirección
 * de publicación (lleva el usuario de GitHub). Sin SITIO_URL, las etiquetas Open Graph
 * salen con rutas relativas: vale para probar en local, no para la vista previa de WhatsApp.
 */
const sitio = process.env.SITIO_URL || undefined;
const base = process.env.RUTA_BASE || '/precios-origen/';

export default defineConfig({
  site: sitio,
  base,
  trailingSlash: 'always',
  output: 'static',
  devToolbar: { enabled: false },
  build: { inlineStylesheets: 'always' },
  vite: { build: { sourcemap: false } },
});
