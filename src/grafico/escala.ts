/**
 * Escalas y marcas de los ejes. El eje Y se ajusta a lo visible con margen y no empieza
 * en cero; el eje X es tiempo continuo, así que los huecos ocupan su sitio.
 */

import { MESES_CORTOS, MS_SEMANA } from '../formato/fechas.ts';
import type { Punto } from './serie.ts';

export interface Dominio {
  min: number;
  max: number;
}

const MARGEN_RELATIVO = 0.1;
/** Si mínimo = máximo, el eje se abre un 5 % (al menos un céntimo) para que la línea no quede pegada. */
const MARGEN_PLANO_RELATIVO = 0.05;
const MARGEN_PLANO_MINIMO = 0.01;

/** `soloMedio`: la minigráfica no dibuja la banda y aprovecha toda la altura. */
export function dominioY(puntos: readonly Punto[], soloMedio = false): Dominio {
  if (puntos.length === 0) return { min: 0, max: 1 };
  const bajos = puntos.map((p) => (soloMedio ? p.medio : p.min));
  const altos = puntos.map((p) => (soloMedio ? p.medio : p.max));
  const bajo = Math.min(...bajos);
  const alto = Math.max(...altos);
  const amplitud = alto - bajo;
  const margen = amplitud > 0 ? amplitud * MARGEN_RELATIVO : Math.max(alto * MARGEN_PLANO_RELATIVO, MARGEN_PLANO_MINIMO);
  return { min: Math.max(0, bajo - margen), max: alto + margen };
}

export type Escala = (valor: number) => number;

/** Escala lineal. Con dominio de amplitud cero, todo cae en el centro de la salida. */
export function escalaLineal(dominio: Dominio, salida: readonly [number, number]): Escala {
  const [desde, hasta] = salida;
  const amplitud = dominio.max - dominio.min;
  if (amplitud === 0) return () => (desde + hasta) / 2;
  return (valor) => desde + ((valor - dominio.min) / amplitud) * (hasta - desde);
}

function pasoRedondo(aproximado: number): number {
  const potencia = 10 ** Math.floor(Math.log10(aproximado));
  const relativo = aproximado / potencia;
  const opcion = [1, 2, 2.5, 5, 10].find((o) => relativo <= o) ?? 10;
  return opcion * potencia;
}

/** Unas 4 marcas en valores redondos dentro del dominio. */
export function marcasY(dominio: Dominio, objetivo = 4): number[] {
  const amplitud = dominio.max - dominio.min;
  if (amplitud <= 0) return [dominio.min];
  const paso = pasoRedondo(amplitud / objetivo);
  const marcas: number[] = [];
  for (let valor = Math.ceil(dominio.min / paso) * paso; valor <= dominio.max + 1e-9; valor += paso) {
    marcas.push(Math.round(valor * 1e6) / 1e6);
  }
  return marcas;
}

export interface MarcaX {
  t: number;
  etiqueta: string;
}

const MAX_MARCAS_X = 6;
const SEMANAS_PARA_MARCAR_ANYOS = 60;

/**
 * Hasta 6 marcas: meses (enero se rotula con el año) si el rango cabe en un año y poco;
 * años si es más largo.
 */
export function marcasX(inicio: number, fin: number): MarcaX[] {
  if (fin <= inicio) return [];
  const desde = new Date(inicio);
  const marcas: MarcaX[] = [];

  if ((fin - inicio) / MS_SEMANA <= SEMANAS_PARA_MARCAR_ANYOS) {
    const meses = (fin - inicio) / (MS_SEMANA * 4.35);
    const salto = Math.max(1, Math.ceil(meses / MAX_MARCAS_X));
    let anyo = desde.getUTCFullYear();
    let mes = desde.getUTCMonth() + 1; // el primer día de mes posterior al inicio
    for (;;) {
      if (mes > 11) {
        anyo += Math.floor(mes / 12);
        mes %= 12;
      }
      const t = Date.UTC(anyo, mes, 1);
      if (t > fin) break;
      if (t >= inicio) marcas.push({ t, etiqueta: mes === 0 ? String(anyo) : (MESES_CORTOS[mes] ?? '') });
      mes += salto;
    }
    return marcas;
  }

  const primero = desde.getUTCFullYear() + 1;
  const ultimo = new Date(fin).getUTCFullYear();
  const salto = Math.max(1, Math.ceil((ultimo - primero + 1) / MAX_MARCAS_X));
  for (let anyo = primero; anyo <= ultimo; anyo += salto) {
    marcas.push({ t: Date.UTC(anyo, 0, 1), etiqueta: String(anyo) });
  }
  return marcas;
}
