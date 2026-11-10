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

export const PRODUCTOS: readonly Producto[] = [
  {
    slug: 'naranja-navelina',
    categoria: 'citricos',
    nombre: 'Naranja Navelina',
    codigoVariedad: '85',
    codigoZona: '46',
    nombreEsperado: 'Naranja Navelina',
    unidad: '€/kg',
    posicion: 'sobre árbol',
  },
  {
    slug: 'clementina-clemenules',
    categoria: 'citricos',
    nombre: 'Clementina Clemenules',
    codigoVariedad: '3',
    codigoZona: '12',
    nombreEsperado: 'Clementina Clemenules',
    unidad: '€/kg',
    posicion: 'sobre árbol',
  },
  {
    slug: 'almendra-comuna',
    categoria: 'frutos-secos',
    nombre: 'Almendra Comuna',
    codigoVariedad: '23',
    codigoZona: '03',
    nombreEsperado: 'Almendra Comuna',
    unidad: '€/kg',
    posicion: 'grano, entrada descascaradora',
  },
  {
    slug: 'almendra-marcona',
    categoria: 'frutos-secos',
    nombre: 'Almendra Marcona',
    codigoVariedad: '40',
    codigoZona: '03',
    nombreEsperado: 'Almendra Marcona',
    unidad: '€/kg',
    posicion: 'grano, entrada descascaradora',
  },
  {
    slug: 'garrofa',
    categoria: 'aceite-y-garrofa',
    nombre: 'Garrofa entera',
    codigoVariedad: '165',
    codigoZona: '12',
    nombreEsperado: 'Garrofa Entera',
    unidad: '€/kg',
    posicion: 'entrada almacén',
  },
  {
    slug: 'aceite-virgen-extra',
    categoria: 'aceite-y-garrofa',
    nombre: 'Aceite de oliva virgen extra',
    codigoVariedad: '76',
    codigoZona: '12',
    nombreEsperado: 'Aceite Oliva Virgen Extra',
    unidad: '€/kg',
    posicion: 'entrada almacén',
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
    posicion: 'sobre árbol',
  },
];
