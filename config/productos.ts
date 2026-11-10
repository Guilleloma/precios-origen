/**
 * Única lista editable de productos. Añadir una variedad es añadir una entrada.
 *
 * Cada producto es una serie del CSV de la GVA filtrada por `codigo_variedad` + `codigo_zona`.
 * `nombreEsperado` debe aparecer dentro de `variedad_castellano`: si la GVA reasigna un código,
 * la ingesta falla en lugar de publicar otra variedad con el nombre de esta.
 */

export const ZONAS = {
  '03': 'Alicante',
  '12': 'Castellón',
  '46': 'Valencia',
} as const;

export type CodigoZona = keyof typeof ZONAS;

/**
 * Conjunto cerrado de categorías, en el orden en que salen en la web. El resumen ordena los productos
 * por este orden y, dentro de cada categoría, por el orden de `PRODUCTOS`.
 */
export const CATEGORIAS = [
  { id: 'citricos', etiqueta: 'Cítricos' },
  { id: 'fruta', etiqueta: 'Fruta' },
  { id: 'uva', etiqueta: 'Uva de mesa' },
  { id: 'frutos-secos', etiqueta: 'Frutos secos' },
  { id: 'aceite-y-garrofa', etiqueta: 'Aceite y garrofa' },
] as const;

export type CategoriaId = (typeof CATEGORIAS)[number]['id'];

export interface Producto {
  slug: string;
  nombre: string;
  categoria: CategoriaId;
  codigoVariedad: string;
  codigoZona: CodigoZona;
  nombreEsperado: string;
  unidad: string;
  posicion: string;
}

/**
 * Posición comercial: dónde se fija el precio. El CSV no la trae; sale de la descripción del dataset y
 * del pie del informe semanal de la GVA. Cítricos y caqui, sobre árbol; uva de mesa, sobre cepa;
 * almendra, en grano a la entrada de la descascaradora; frutales no cítricos, aceite y garrofa, a la
 * entrada del almacén.
 */
const ARBOL = 'sobre árbol';
const CEPA = 'sobre cepa';
const DESCASCARADORA = 'grano, entrada descascaradora';
const ALMACEN = 'entrada almacén';
/**
 * Melón y sandía (que la GVA cuenta como hortalizas) y aguacate (que la descripción del dataset no nombra):
 * la GVA no dice en qué punto se fija su precio, así que no se afirma ninguno.
 */
const SIN_POSICION_PUBLICADA = 'precio en origen';

/**
 * Provincia de cada producto: la que tiene más semanas con dato en las dos últimas campañas (en empate,
 * la de más histórico), salvo los siete del MVP, que conservan la suya. Criterio y alternativas en
 * docs/inventario-productos.md.
 */
export const PRODUCTOS: readonly Producto[] = [
  {
    slug: 'naranja-navelina',
    categoria: 'citricos',
    nombre: 'Naranja Navelina',
    codigoVariedad: '85',
    codigoZona: '46',
    nombreEsperado: 'Naranja Navelina',
    unidad: '€/kg',
    posicion: ARBOL,
  },
  {
    slug: 'naranja-lane-late',
    categoria: 'citricos',
    nombre: 'Naranja Lane Late',
    codigoVariedad: '84',
    codigoZona: '12',
    nombreEsperado: 'Naranja Navel Lane Late',
    unidad: '€/kg',
    posicion: ARBOL,
  },
  {
    slug: 'naranja-salustiana',
    categoria: 'citricos',
    nombre: 'Naranja Salustiana',
    codigoVariedad: '286',
    codigoZona: '12',
    nombreEsperado: 'Salustiana',
    unidad: '€/kg',
    posicion: ARBOL,
  },
  {
    slug: 'naranja-valencia-late',
    categoria: 'citricos',
    nombre: 'Naranja Valencia Late',
    codigoVariedad: '287',
    codigoZona: '03',
    nombreEsperado: 'Valencia Late',
    unidad: '€/kg',
    posicion: ARBOL,
  },
  {
    slug: 'clementina-clemenules',
    categoria: 'citricos',
    nombre: 'Clementina Clemenules',
    codigoVariedad: '3',
    codigoZona: '12',
    nombreEsperado: 'Clementina Clemenules',
    unidad: '€/kg',
    posicion: ARBOL,
  },
  {
    slug: 'clementina-oronules',
    categoria: 'citricos',
    nombre: 'Clementina Oronules',
    codigoVariedad: '46',
    codigoZona: '12',
    nombreEsperado: 'Clementina Oronules',
    unidad: '€/kg',
    posicion: ARBOL,
  },
  {
    slug: 'satsuma-clausellina-okitsu',
    categoria: 'citricos',
    nombre: 'Satsuma Clausellina/Okitsu',
    codigoVariedad: '45',
    codigoZona: '46',
    nombreEsperado: 'Clausellina/Okitsu',
    unidad: '€/kg',
    posicion: ARBOL,
  },
  {
    slug: 'mandarina-clemenvilla',
    categoria: 'citricos',
    nombre: 'Mandarina Clemenvilla',
    codigoVariedad: '22',
    codigoZona: '03',
    nombreEsperado: 'Mandarina Clemenvilla',
    unidad: '€/kg',
    posicion: ARBOL,
  },
  {
    slug: 'mandarina-nadorcott',
    categoria: 'citricos',
    nombre: 'Mandarina Nadorcott',
    codigoVariedad: '89',
    codigoZona: '12',
    nombreEsperado: 'Mandarina Nadorcott',
    unidad: '€/kg',
    posicion: ARBOL,
  },
  {
    // Ojo: el 191 («Limón Fino/Primofiori (1corte)») y el 57 («Limón Fino Redrojo») son otras series.
    slug: 'limon-fino',
    categoria: 'citricos',
    nombre: 'Limón Fino',
    codigoVariedad: '355',
    codigoZona: '03',
    nombreEsperado: 'Limón Fino',
    unidad: '€/kg',
    posicion: ARBOL,
  },
  {
    slug: 'limon-verna',
    categoria: 'citricos',
    nombre: 'Limón Verna',
    codigoVariedad: '288',
    codigoZona: '03',
    nombreEsperado: 'Limón Verna',
    unidad: '€/kg',
    posicion: ARBOL,
  },
  {
    slug: 'pomelo-rojo',
    categoria: 'citricos',
    nombre: 'Pomelo rojo',
    codigoVariedad: '58',
    codigoZona: '03',
    nombreEsperado: 'Pomelo Rojo',
    unidad: '€/kg',
    posicion: ARBOL,
  },
  {
    slug: 'aguacate-hass',
    categoria: 'fruta',
    nombre: 'Aguacate Hass',
    codigoVariedad: '300463',
    codigoZona: '03',
    nombreEsperado: 'Hass',
    unidad: '€/kg',
    posicion: SIN_POSICION_PUBLICADA,
  },
  {
    slug: 'albaricoque-temprano',
    categoria: 'fruta',
    nombre: 'Albaricoque temprano',
    codigoVariedad: '300060',
    codigoZona: '46',
    nombreEsperado: 'Albaricoque Temprano',
    unidad: '€/kg',
    posicion: ALMACEN,
  },
  {
    slug: 'caqui-rojo-brillante',
    categoria: 'fruta',
    nombre: 'Caqui Rojo Brillante',
    codigoVariedad: '53',
    codigoZona: '46',
    nombreEsperado: 'Caqui R. Brillante',
    unidad: '€/kg',
    posicion: ARBOL,
  },
  {
    slug: 'cereza-starking',
    categoria: 'fruta',
    nombre: 'Cereza Starking',
    codigoVariedad: '109',
    codigoZona: '03',
    nombreEsperado: 'Cereza Starking',
    unidad: '€/kg',
    posicion: ALMACEN,
  },
  {
    slug: 'ciruela-black',
    categoria: 'fruta',
    nombre: 'Ciruela tipo Black',
    codigoVariedad: '71',
    codigoZona: '46',
    nombreEsperado: 'Ciruela Tipo Black',
    unidad: '€/kg',
    posicion: ALMACEN,
  },
  {
    slug: 'granada-mollar',
    categoria: 'fruta',
    nombre: 'Granada Mollar',
    codigoVariedad: '142',
    codigoZona: '03',
    nombreEsperado: 'Granada Mollar',
    unidad: '€/kg',
    posicion: ALMACEN,
  },
  {
    slug: 'higo-negro',
    categoria: 'fruta',
    nombre: 'Higo negro',
    codigoVariedad: '144',
    codigoZona: '03',
    nombreEsperado: 'Higo Negro',
    unidad: '€/kg',
    posicion: ALMACEN,
  },
  {
    slug: 'manzana-fuji',
    categoria: 'fruta',
    nombre: 'Manzana Fuji',
    codigoVariedad: '319',
    codigoZona: '03',
    nombreEsperado: 'Manzana Fuji',
    unidad: '€/kg',
    posicion: ALMACEN,
  },
  {
    slug: 'melocoton-paraguayo',
    categoria: 'fruta',
    nombre: 'Melocotón paraguayo',
    codigoVariedad: '320',
    codigoZona: '46',
    nombreEsperado: 'Melocotón Paraguayo',
    unidad: '€/kg',
    posicion: ALMACEN,
  },
  {
    slug: 'melon-piel-de-sapo',
    categoria: 'fruta',
    nombre: 'Melón piel de sapo',
    codigoVariedad: '98',
    codigoZona: '12',
    nombreEsperado: 'Melón Piel De Sapo',
    unidad: '€/kg',
    posicion: SIN_POSICION_PUBLICADA,
  },
  {
    slug: 'nectarina-amarilla',
    categoria: 'fruta',
    nombre: 'Nectarina amarilla',
    codigoVariedad: '348',
    codigoZona: '46',
    nombreEsperado: 'Nectarina Amarilla',
    unidad: '€/kg',
    posicion: ALMACEN,
  },
  {
    slug: 'nispero-algar',
    categoria: 'fruta',
    nombre: 'Níspero Algar',
    codigoVariedad: '122',
    codigoZona: '03',
    nombreEsperado: 'Níspero Algar',
    unidad: '€/kg',
    posicion: ALMACEN,
  },
  {
    slug: 'sandia-sin-pepitas',
    categoria: 'fruta',
    nombre: 'Sandía sin pepitas',
    codigoVariedad: '64',
    codigoZona: '12',
    nombreEsperado: 'Sandía sin pepitas',
    unidad: '€/kg',
    posicion: SIN_POSICION_PUBLICADA,
  },
  {
    slug: 'uva-red-globe',
    categoria: 'uva',
    nombre: 'Uva de mesa Red Globe',
    codigoVariedad: '189',
    codigoZona: '03',
    nombreEsperado: 'Uva De Mesa Red Globe',
    unidad: '€/kg',
    posicion: CEPA,
  },
  {
    slug: 'uva-dona-maria',
    categoria: 'uva',
    nombre: 'Uva de mesa Doña María',
    codigoVariedad: '188',
    codigoZona: '03',
    nombreEsperado: 'Uva De Mesa D. María',
    unidad: '€/kg',
    posicion: CEPA,
  },
  {
    slug: 'uva-moscatel-romano',
    categoria: 'uva',
    nombre: 'Uva de mesa Moscatel Romano',
    codigoVariedad: '78',
    codigoZona: '03',
    nombreEsperado: 'Uva De Mesa Moscatel Romano',
    unidad: '€/kg',
    posicion: CEPA,
  },
  {
    slug: 'almendra-comuna',
    categoria: 'frutos-secos',
    nombre: 'Almendra Comuna',
    codigoVariedad: '23',
    codigoZona: '03',
    nombreEsperado: 'Almendra Comuna',
    unidad: '€/kg',
    posicion: DESCASCARADORA,
  },
  {
    slug: 'almendra-marcona',
    categoria: 'frutos-secos',
    nombre: 'Almendra Marcona',
    codigoVariedad: '40',
    codigoZona: '03',
    nombreEsperado: 'Almendra Marcona',
    unidad: '€/kg',
    posicion: DESCASCARADORA,
  },
  {
    slug: 'almendra-largueta',
    categoria: 'frutos-secos',
    nombre: 'Almendra Largueta',
    codigoVariedad: '35',
    codigoZona: '03',
    nombreEsperado: 'Almendra Largueta',
    unidad: '€/kg',
    posicion: DESCASCARADORA,
  },
  {
    slug: 'almendra-planeta',
    categoria: 'frutos-secos',
    nombre: 'Almendra Planeta',
    codigoVariedad: '121',
    codigoZona: '03',
    nombreEsperado: 'Almendra Planeta',
    unidad: '€/kg',
    posicion: DESCASCARADORA,
  },
  {
    slug: 'aceite-virgen-extra',
    categoria: 'aceite-y-garrofa',
    nombre: 'Aceite de oliva virgen extra',
    codigoVariedad: '76',
    codigoZona: '12',
    nombreEsperado: 'Aceite Oliva Virgen Extra',
    unidad: '€/kg',
    posicion: ALMACEN,
  },
  {
    slug: 'aceite-virgen',
    categoria: 'aceite-y-garrofa',
    nombre: 'Aceite de oliva virgen',
    codigoVariedad: '75',
    codigoZona: '12',
    nombreEsperado: 'Aceite Oliva Virgen 0,8º-2º',
    unidad: '€/kg',
    posicion: ALMACEN,
  },
  {
    slug: 'aceite-lampante',
    categoria: 'aceite-y-garrofa',
    nombre: 'Aceite de oliva lampante',
    codigoVariedad: '77',
    codigoZona: '12',
    nombreEsperado: 'Aceite Oliva Lampante',
    unidad: '€/kg',
    posicion: ALMACEN,
  },
  {
    slug: 'garrofa',
    categoria: 'aceite-y-garrofa',
    nombre: 'Garrofa entera',
    codigoVariedad: '165',
    codigoZona: '12',
    nombreEsperado: 'Garrofa Entera',
    unidad: '€/kg',
    posicion: ALMACEN,
  },

];
