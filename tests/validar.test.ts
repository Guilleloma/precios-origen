import { describe, expect, it } from 'vitest';
import { validarDesfase, validarRetroceso } from '../scripts/ingesta/validar.ts';
import { codigoDe } from './factorias.ts';

const semana44 = { anyo: 2026, semana: 44, lunes: '2026-10-26' };
const semana43 = { anyo: 2026, semana: 43, lunes: '2026-10-19' };
const puntos = (garrofa: number) => new Map([['garrofa', garrofa], ['limon-fino', 252]]);

describe('validarRetroceso', () => {
  it('should pass when nothing has been published yet', () => {
    expect(codigoDe(() => validarRetroceso({ ultimaSemana: semana43, puntos: puntos(1) }, null))).toBeUndefined();
  });

  it('should pass with the same week or a newer one', () => {
    const publicada = { ultimaSemana: semana43, puntos: puntos(350) };
    expect(codigoDe(() => validarRetroceso({ ultimaSemana: semana43, puntos: puntos(350) }, publicada))).toBeUndefined();
    expect(codigoDe(() => validarRetroceso({ ultimaSemana: semana44, puntos: puntos(351) }, publicada))).toBeUndefined();
  });

  it('should fail when the last week is older than the published one', () => {
    const publicada = { ultimaSemana: semana44, puntos: puntos(351) };
    expect(codigoDe(() => validarRetroceso({ ultimaSemana: semana43, puntos: puntos(351) }, publicada))).toBe(
      'RETROCESO_SEMANA',
    );
  });

  it('should allow losing up to 2 points and fail when a series loses more', () => {
    const publicada = { ultimaSemana: semana44, puntos: puntos(351) };
    expect(codigoDe(() => validarRetroceso({ ultimaSemana: semana44, puntos: puntos(349) }, publicada))).toBeUndefined();
    expect(codigoDe(() => validarRetroceso({ ultimaSemana: semana44, puntos: puntos(348) }, publicada))).toBe(
      'RETROCESO_SERIE',
    );
  });
});

describe('validarDesfase', () => {
  it('should pass 9 days after the Sunday of the last week', () => {
    expect(codigoDe(() => validarDesfase('2026-11-01', '2026-11-10'))).toBeUndefined();
  });

  it('should fail 10 days or more after that Sunday', () => {
    expect(codigoDe(() => validarDesfase('2026-11-01', '2026-11-11'))).toBe('DATOS_DESFASADOS');
    expect(codigoDe(() => validarDesfase('2026-11-01', '2026-12-01'))).toBe('DATOS_DESFASADOS');
  });
});
