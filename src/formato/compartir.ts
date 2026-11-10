/**
 * Título y descripción de la vista previa del enlace (WhatsApp y similares). Texto plano:
 * flechas y signos en lugar de color.
 */

import type { ProductoResumen, Resumen } from '../../scripts/ingesta/contrato.ts';
import { listaCategorias, textoResumenSemana } from './categorias.ts';
import { etiquetaSemanaConFechas, formatearRango, sumarDias } from './fechas.ts';
import { formatearPrecio, formatearPrecioConUnidad } from './numeros.ts';
import { estadoFila } from './variacion.ts';

const FUENTE_CORTA = 'Fuente: Generalitat Valenciana (datos abiertos, CC BY 4.0).';

/** «Precios en origen de 36 productos · Comunitat Valenciana» */
export function tituloPortada(resumen: Pick<Resumen, 'productos'>): string {
  return `Precios en origen de ${resumen.productos.length} productos · Comunitat Valenciana`;
}

/**
 * Con 36 productos ya no caben todos los precios: se dicen las categorías y cuántos tienen precio
 * en la semana, que es lo que cambia de una semana a otra.
 */
export function descripcionPortada(resumen: Resumen): string {
  const { ultimaSemana, productos } = resumen;
  const conPrecio = productos.filter((producto) => producto.cotizaEstaSemana).length;
  const categorias = listaCategorias(resumen.categorias);
  const semana = etiquetaSemanaConFechas(ultimaSemana, ultimaSemana.lunes);
  const recuento = textoResumenSemana(productos.length, conPrecio, semana);
  return `${mayuscula(categorias)}: precio medio semanal en origen, en €/kg. ${recuento} ${FUENTE_CORTA}`;
}

const mayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

export function tituloProducto(producto: ProductoResumen): string {
  return `${producto.nombre}: ${formatearPrecioConUnidad(producto.ultimo.medio, producto.unidad)} · Precios en origen`;
}

export function descripcionProducto(producto: ProductoResumen): string {
  const { ultimo } = producto;
  const lugar = `${producto.provincia}, ${producto.posicion}.`;
  const horquilla = `Horquilla ${formatearPrecio(ultimo.min)}–${formatearPrecioConUnidad(ultimo.max, producto.unidad)}.`;
  const estado = estadoFila(producto);

  let situacion: string;
  if (estado.tipo === 'sinCotizacion') {
    situacion = `${estado.texto}. Último precio medio: ${formatearPrecioConUnidad(ultimo.medio, producto.unidad)}.`;
  } else {
    const fechas = formatearRango(ultimo.lunes, sumarDias(ultimo.lunes, 6));
    const cambio =
      estado.tipo === 'variacion'
        ? `${estado.variacion.flecha} ${estado.variacion.texto} ${estado.respectoA ?? 'respecto a la semana anterior'}`
        : estado.tipo === 'primeraTrasHueco'
          ? estado.texto
          : 'primera cotización';
    situacion = `Semana ${ultimo.semana} (${fechas}): ${cambio}.`;
  }

  return `${lugar} ${situacion} ${horquilla} ${FUENTE_CORTA}`;
}
