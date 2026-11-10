import { describe, expect, it } from 'vitest';
import { ErrorIngesta } from '../scripts/ingesta/errores.ts';
import { comprobarCalendario, crearCalendario, semanasIsoDelAnyo, type Semana } from '../scripts/ingesta/semanas.ts';

/** Semanas de la GVA como en el CSV real: 2020 sin semana 53 y 2021 de la 1 a la 53. */
function semanasGva(): Semana[] {
  const semanas: Semana[] = [];
  for (let s = 1; s <= 52; s++) semanas.push({ anyo: 2020, semana: s });
  for (let s = 1; s <= 53; s++) semanas.push({ anyo: 2021, semana: s });
  for (let s = 1; s <= 52; s++) semanas.push({ anyo: 2022, semana: s });
  for (let s = 1; s <= 44; s++) semanas.push({ anyo: 2026, semana: s });
  return semanas;
}

function codigoDe(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (e) {
    return e instanceof ErrorIngesta ? e.codigo : 'OTRO';
  }
  return undefined;
}

describe('semanasIsoDelAnyo', () => {
  it('should know which years have 53 ISO weeks', () => {
    expect(semanasIsoDelAnyo(2020)).toBe(53);
    expect(semanasIsoDelAnyo(2026)).toBe(53);
    expect(semanasIsoDelAnyo(2021)).toBe(52);
    expect(semanasIsoDelAnyo(2025)).toBe(52);
  });
});

describe('crearCalendario', () => {
  const lunes = crearCalendario(semanasGva());

  it('should shift 2021 one week back because the CSV has no week 53 of 2020', () => {
    expect(lunes({ anyo: 2021, semana: 1 })).toBe('2020-12-28');
    expect(lunes({ anyo: 2021, semana: 53 })).toBe('2021-12-27');
  });

  it('should go back to ISO weeks in 2022', () => {
    expect(lunes({ anyo: 2022, semana: 1 })).toBe('2022-01-03');
  });

  it('should use the ISO Monday in 2026', () => {
    expect(lunes({ anyo: 2026, semana: 44 })).toBe('2026-10-26');
  });

  it('should use the ISO Monday in a normal year', () => {
    expect(lunes({ anyo: 2022, semana: 52 })).toBe('2022-12-26');
    expect(lunes({ anyo: 2018, semana: 1 })).toBe('2018-01-01');
    expect(lunes({ anyo: 2017, semana: 45 })).toBe('2017-11-06');
  });

  it('should not shift the next year when the 53rd week is in the CSV', () => {
    const conSemana53 = crearCalendario([
      { anyo: 2026, semana: 53 },
      { anyo: 2027, semana: 1 },
    ]);
    expect(conSemana53({ anyo: 2026, semana: 53 })).toBe('2026-12-28');
    expect(conSemana53({ anyo: 2027, semana: 1 })).toBe('2027-01-04');
  });

  it('should shift 2027 when the CSV skips week 53 of 2026', () => {
    const sinSemana53 = crearCalendario([
      { anyo: 2026, semana: 52 },
      { anyo: 2027, semana: 1 },
    ]);
    expect(sinSemana53({ anyo: 2027, semana: 1 })).toBe('2026-12-28');
  });
});

describe('comprobarCalendario', () => {
  it('should return the weeks sorted by Monday when there are no jumps', () => {
    const tramo = semanasGva().filter((s) => s.anyo !== 2026);
    const semanas = comprobarCalendario([...tramo].reverse());
    expect(semanas).toHaveLength(52 + 53 + 52);
    expect(semanas[0]).toEqual({ anyo: 2020, semana: 1, lunes: '2019-12-30' });
    expect(semanas.at(-1)).toEqual({ anyo: 2022, semana: 52, lunes: '2022-12-26' });
  });

  it('should ignore repeated (year, week) pairs coming from several rows', () => {
    expect(comprobarCalendario([{ anyo: 2022, semana: 1 }, { anyo: 2022, semana: 1 }])).toHaveLength(1);
  });

  it('should fail when a week is missing', () => {
    const conHueco = semanasGva().filter((s) => !(s.anyo === 2022 && s.semana === 10));
    expect(codigoDe(() => comprobarCalendario(conHueco))).toBe('CALENDARIO_SALTO');
  });

  it('should fail when two weeks fall on the same Monday', () => {
    // 2022 no tiene semana 53 ISO: la 53 de 2022 coincide con la 1 de 2023.
    const repetida = [
      { anyo: 2022, semana: 52 },
      { anyo: 2022, semana: 53 },
      { anyo: 2023, semana: 1 },
    ];
    expect(codigoDe(() => comprobarCalendario(repetida))).toBe('CALENDARIO_SEMANA_REPETIDA');
  });
});
