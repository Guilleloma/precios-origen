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

export interface Producto {
  slug: string;
  nombre: string;
  codigoVariedad: string;
  codigoZona: CodigoZona;
  nombreEsperado: string;
  unidad: string;
  posicion: string;
}

export const PRODUCTOS: readonly Producto[] = [
  {
    slug: 'naranja-navelina',
    nombre: 'Naranja Navelina',
    codigoVariedad: '85',
    codigoZona: '46',
    nombreEsperado: 'Naranja Navelina',
    unidad: '€/kg',
    posicion: 'sobre árbol',
  },
  {
    slug: 'clementina-clemenules',
    nombre: 'Clementina Clemenules',
    codigoVariedad: '3',
    codigoZona: '12',
    nombreEsperado: 'Clementina Clemenules',
    unidad: '€/kg',
    posicion: 'sobre árbol',
  },
  {
    slug: 'almendra-comuna',
    nombre: 'Almendra Comuna',
    codigoVariedad: '23',
    codigoZona: '03',
    nombreEsperado: 'Almendra Comuna',
    unidad: '€/kg',
    posicion: 'grano, entrada descascaradora',
  },
  {
    slug: 'almendra-marcona',
    nombre: 'Almendra Marcona',
    codigoVariedad: '40',
    codigoZona: '03',
    nombreEsperado: 'Almendra Marcona',
    unidad: '€/kg',
    posicion: 'grano, entrada descascaradora',
  },
  {
    slug: 'garrofa',
    nombre: 'Garrofa entera',
    codigoVariedad: '165',
    codigoZona: '12',
    nombreEsperado: 'Garrofa Entera',
    unidad: '€/kg',
    posicion: 'entrada almacén',
  },
  {
    slug: 'aceite-virgen-extra',
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
    nombre: 'Limón Fino',
    codigoVariedad: '355',
    codigoZona: '03',
    nombreEsperado: 'Limón Fino',
    unidad: '€/kg',
    posicion: 'sobre árbol',
  },
];
