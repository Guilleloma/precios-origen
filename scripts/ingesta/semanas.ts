import { ErrorIngesta } from './errores.ts';

export interface Semana {
  anyo: number;
  semana: number;
}

const DIA_MS = 86_400_000;
const SEMANA_MS = 7 * DIA_MS;

/** Lunes de la semana ISO 1: el de la semana que contiene el 4 de enero. */
function lunesSemanaUnoMs(anyo: number): number {
  const cuatroEnero = Date.UTC(anyo, 0, 4);
  const diaIso = (new Date(cuatroEnero).getUTCDay() + 6) % 7; // 0 = lunes
  return cuatroEnero - diaIso * DIA_MS;
}

/** Número de semanas ISO de un año (52 o 53). */
export function semanasIsoDelAnyo(anyo: number): number {
  return (lunesSemanaUnoMs(anyo + 1) - lunesSemanaUnoMs(anyo)) / SEMANA_MS;
}

export function fechaIso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function sumarDias(fecha: string, dias: number): string {
  return fechaIso(Date.parse(`${fecha}T00:00:00Z`) + dias * DIA_MS);
}

export function diasEntre(desde: string, hasta: string): number {
  return Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / DIA_MS);
}

const clave = (s: Semana) => `${s.anyo}-${s.semana}`;

/**
 * Calendario de semanas de la GVA (regla 1 del plan). Lunes ISO de (año, semana), salvo que el año
 * anterior tenga 53 semanas ISO y el CSV no traiga su semana 53: entonces a todo el año se le resta
 * una semana (caso de 2021, y quizá de 2027).
 */
export function crearCalendario(presentes: Iterable<Semana>): (s: Semana) => string {
  const claves = new Set<string>();
  for (const s of presentes) claves.add(clave(s));

  return ({ anyo, semana }) => {
    const desplazado = semanasIsoDelAnyo(anyo - 1) === 53 && !claves.has(clave({ anyo: anyo - 1, semana: 53 }));
    const lunes = lunesSemanaUnoMs(anyo) + (semana - 1 - (desplazado ? 1 : 0)) * SEMANA_MS;
    return fechaIso(lunes);
  };
}

/**
 * Comprueba que el calendario global no tiene semanas repetidas (dos semanas de la GVA en el mismo
 * lunes) ni saltos (dos semanas consecutivas a más de 7 días). Devuelve las semanas ordenadas.
 */
export function comprobarCalendario(presentes: Iterable<Semana>): Array<Semana & { lunes: string }> {
  const unicas = new Map<string, Semana>();
  for (const s of presentes) unicas.set(clave(s), { anyo: s.anyo, semana: s.semana });
  const lunesDe = crearCalendario(unicas.values());
  const semanas = [...unicas.values()]
    .map((s) => ({ ...s, lunes: lunesDe(s) }))
    .sort((a, b) => a.lunes.localeCompare(b.lunes));

  for (let i = 1; i < semanas.length; i++) {
    const anterior = semanas[i - 1]!;
    const actual = semanas[i]!;
    const dias = diasEntre(anterior.lunes, actual.lunes);
    if (dias === 0) {
      throw new ErrorIngesta(
        'CALENDARIO_SEMANA_REPETIDA',
        `Las semanas ${anterior.semana}/${anterior.anyo} y ${actual.semana}/${actual.anyo} caen en el mismo lunes (${actual.lunes})`,
      );
    }
    if (dias !== 7) {
      throw new ErrorIngesta(
        'CALENDARIO_SALTO',
        `Salto en el calendario: de la semana ${anterior.semana}/${anterior.anyo} (${anterior.lunes}) a la ${actual.semana}/${actual.anyo} (${actual.lunes})`,
      );
    }
  }
  return semanas;
}
