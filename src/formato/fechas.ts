/**
 * Fechas en español. Se trabaja con cadenas AAAA-MM-DD y milisegundos UTC para que
 * la zona horaria del navegador no mueva ningún día.
 */

import type { SemanaRef } from '../../scripts/ingesta/contrato.ts';

export const MS_DIA = 86_400_000;
export const MS_SEMANA = 7 * MS_DIA;

export const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'] as const;
export const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
] as const;

interface Partes {
  anyo: number;
  mes: number; // 1–12
  dia: number;
}

function partes(fechaIso: string): Partes {
  const [anyo, mes, dia] = fechaIso.split('-').map(Number);
  if (!anyo || !mes || !dia) throw new Error(`Fecha no válida: ${fechaIso}`);
  return { anyo, mes, dia };
}

export function fechaAMs(fechaIso: string): number {
  const { anyo, mes, dia } = partes(fechaIso);
  return Date.UTC(anyo, mes - 1, dia);
}

export function msAFecha(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function sumarDias(fechaIso: string, dias: number): string {
  return msAFecha(fechaAMs(fechaIso) + dias * MS_DIA);
}

export function diasEntre(desde: string, hasta: string): number {
  return Math.round((fechaAMs(hasta) - fechaAMs(desde)) / MS_DIA);
}

function mesCorto(mes: number): string {
  return MESES_CORTOS[mes - 1] ?? '';
}

/** «4 nov 2026» */
export function formatearFecha(fechaIso: string): string {
  const { anyo, mes, dia } = partes(fechaIso);
  return `${dia} ${mesCorto(mes)} ${anyo}`;
}

/** «26 oct–1 nov 2026», «2–8 nov 2026», «29 dic 2025–4 ene 2026» */
export function formatearRango(desde: string, hasta: string): string {
  const a = partes(desde);
  const b = partes(hasta);
  const final = `${b.dia} ${mesCorto(b.mes)} ${b.anyo}`;
  if (a.anyo !== b.anyo) return `${a.dia} ${mesCorto(a.mes)} ${a.anyo}–${final}`;
  if (a.mes !== b.mes) return `${a.dia} ${mesCorto(a.mes)}–${final}`;
  return `${a.dia}–${final}`;
}

/** «diciembre de 2020» */
export function formatearMesAnyo(fechaIso: string): string {
  const { anyo, mes } = partes(fechaIso);
  return `${MESES[mes - 1]} de ${anyo}`;
}

/** «diciembre» */
export function formatearMes(fechaIso: string): string {
  return MESES[partes(fechaIso).mes - 1] ?? '';
}

/** Semana del histórico tal como la numera la GVA: «sem. 12 de 2021». */
export function etiquetaSemana(semana: SemanaRef): string {
  return `sem. ${semana.semana} de ${semana.anyo}`;
}

/** Semana de referencia con sus días: «semana 44 (26 oct–1 nov 2026)». */
export function etiquetaSemanaConFechas(semana: SemanaRef, lunes: string): string {
  return `semana ${semana.semana} (${formatearRango(lunes, sumarDias(lunes, 6))})`;
}

/** Fecha local del dispositivo en AAAA-MM-DD (para comparar con las fechas de los datos). */
export function fechaLocal(momento: Date): string {
  const mes = String(momento.getMonth() + 1).padStart(2, '0');
  const dia = String(momento.getDate()).padStart(2, '0');
  return `${momento.getFullYear()}-${mes}-${dia}`;
}
