/**
 * Título y descripción de la vista previa del enlace (WhatsApp y similares). Texto plano:
 * flechas y signos en lugar de color.
 */

import type { ProductoResumen, Resumen } from '../../scripts/ingesta/contrato.ts';
import { etiquetaSemanaConFechas, formatearRango, sumarDias } from './fechas.ts';
import { formatearPrecio, formatearPrecioConUnidad } from './numeros.ts';
import { estadoFila } from './variacion.ts';

const FUENTE_CORTA = 'Fuente: Generalitat Valenciana (datos abiertos, CC BY 4.0).';

export function descripcionPortada(resumen: Resumen): string {
  const { ultimaSemana } = resumen;
  const precios = resumen.productos.map((p) => `${p.nombre} ${formatearPrecio(p.ultimo.medio)}`).join(' · ');
  const semana = etiquetaSemanaConFechas(ultimaSemana, ultimaSemana.lunes);
  return `Precio medio en origen, ${semana}, en €/kg: ${precios}. ${FUENTE_CORTA}`;
}

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
