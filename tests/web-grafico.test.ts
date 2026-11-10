import { describe, expect, it } from 'vitest';
import { fechaAMs, MS_SEMANA } from '../src/formato/fechas.ts';
import { describirVentana } from '../src/grafico/descripcion.ts';
import { dominioY, escalaLineal, marcasX, marcasY } from '../src/grafico/escala.ts';
import { leerPunto, tiempoEnFraccion } from '../src/grafico/lectura.ts';
import { filtrarRango, RANGO_POR_DEFECTO, RANGOS, ventanasPorRango } from '../src/grafico/rango.ts';
import { indiceMasCercano, segmentar } from '../src/grafico/serie.ts';
import { dibujar, LIENZO_GRAFICO, trazadoAislados, trazadoBanda, trazadoLinea } from '../src/grafico/trazado.ts';
import { lunes2026, puntos2026, rango } from './factorias-web.ts';

const identidad = (v: number) => v;
const centimos = (v: number) => v * 100;

describe('segmentar', () => {
  it('should keep a continuous series in a single segment', () => {
    expect(segmentar(puntos2026(rango(1, 10)))).toHaveLength(1);
  });

  it('should cut the series where a week is missing', () => {
    const tramos = segmentar(puntos2026([1, 2, 3, 5, 6]));
    expect(tramos.map((t) => t.map((p) => p.semana))).toEqual([[1, 2, 3], [5, 6]]);
  });

  it('should leave an isolated point as a segment of one', () => {
    const tramos = segmentar(puntos2026([1, 2, 4, 6, 7]));
    expect(tramos.map((t) => t.length)).toEqual([2, 1, 2]);
  });

  it('should cut when Mondays are not exactly 7 days apart, even with consecutive GVA week numbers', () => {
    const puntos = puntos2026([1, 2]);
    const segundo = puntos[1];
    if (!segundo) throw new Error('falta el segundo punto');
    segundo.t += 86_400_000;
    expect(segmentar(puntos)).toHaveLength(2);
  });

  it('should return no segments for an empty series', () => {
    expect(segmentar([])).toEqual([]);
  });
});

describe('trazados', () => {
  const [tramo] = segmentar(puntos2026([1, 2, 3]));

  it('should draw the line through the mean prices', () => {
    const ex = (t: number) => (t - fechaAMs(lunes2026(1))) / MS_SEMANA;
    expect(trazadoLinea(tramo ?? [], ex, centimos)).toBe('M0 31L1 32L2 33');
  });

  it('should close the band going along the maximums and back along the minimums', () => {
    const ex = (t: number) => (t - fechaAMs(lunes2026(1))) / MS_SEMANA;
    expect(trazadoBanda(tramo ?? [], ex, centimos)).toBe('M0 36L1 37L2 38L2 28L1 27L0 26Z');
  });

  it('should not draw a line or band for a single point, but a dot and its range', () => {
    const solo = segmentar(puntos2026([5]));
    expect(trazadoLinea(solo[0] ?? [], identidad, identidad)).toBe('');
    expect(trazadoBanda(solo[0] ?? [], identidad, identidad)).toBe('');
    const ex = () => 10;
    const ey = (v: number) => v * 100;
    expect(trazadoAislados(solo, ex, ey)).toEqual({ puntos: 'M10 35h0', horquillas: 'M10 40V30' });
  });

  it('should skip the range mark of an isolated point when minimum equals maximum', () => {
    const [punto] = puntos2026([5]);
    if (!punto) throw new Error('falta el punto');
    const plano = { ...punto, min: 0.35, max: 0.35 };
    expect(trazadoAislados([[plano]], identidad, identidad).horquillas).toBe('');
  });
});

describe('escalas', () => {
  it('should fit the Y axis to the visible minimum and maximum with a margin, not from zero', () => {
    const dominio = dominioY(puntos2026([10, 20]));
    expect(dominio.min).toBeCloseTo(0.35 - 0.02);
    expect(dominio.max).toBeCloseTo(0.55 + 0.02);
  });

  it('should open a flat series when minimum equals maximum so the line is not on the edge', () => {
    const [punto] = puntos2026([5]);
    if (!punto) throw new Error('falta el punto');
    const dominio = dominioY([{ ...punto, min: 5.15, medio: 5.15, max: 5.15 }]);
    expect(dominio.min).toBeLessThan(5.15);
    expect(dominio.max).toBeGreaterThan(5.15);
    const ey = escalaLineal(dominio, [300, 0]);
    expect(ey(5.15)).toBeCloseTo(150);
  });

  it('should use only mean prices for the mini chart', () => {
    const dominio = dominioY(puntos2026([10, 20]), true);
    expect(dominio.min).toBeCloseTo(0.4 - 0.01);
    expect(dominio.max).toBeCloseTo(0.5 + 0.01);
  });

  it('should map to the centre when the domain has no width', () => {
    expect(escalaLineal({ min: 3, max: 3 }, [0, 100])(3)).toBe(50);
  });

  it('should place Y ticks on round values inside the domain', () => {
    expect(marcasY({ min: 0.18, max: 0.47 })).toEqual([0.2, 0.3, 0.4]);
  });

  it('should mark months for one year and label January with the year', () => {
    const marcas = marcasX(fechaAMs('2025-11-03'), fechaAMs('2026-10-26'));
    expect(marcas.map((m) => m.etiqueta)).toEqual(['dic', 'feb', 'abr', 'jun', 'ago', 'oct']);
    const seis = marcasX(fechaAMs('2026-05-04'), fechaAMs('2026-10-26'));
    expect(seis.map((m) => m.etiqueta)).toEqual(['jun', 'jul', 'ago', 'sept', 'oct']);
  });

  it('should mark years, at most six, for long ranges', () => {
    const marcas = marcasX(fechaAMs('2017-11-06'), fechaAMs('2026-10-26'));
    expect(marcas.map((m) => m.etiqueta)).toEqual(['2018', '2020', '2022', '2024', '2026']);
  });
});

describe('rangos', () => {
  const referencia = fechaAMs(lunes2026(44));

  it('should offer 6 months, 1 year, 3 years and all, with 1 year by default', () => {
    expect(RANGOS.map((r) => r.etiqueta)).toEqual(['6 meses', '1 año', '3 años', 'Todo']);
    expect(RANGO_POR_DEFECTO).toBe('1a');
  });

  it('should count the weeks back from the reference week, including it', () => {
    const ventana = filtrarRango(puntos2026(rango(1, 44)), referencia, 26);
    expect(ventana.puntos.map((p) => p.semana)).toEqual(rango(19, 44));
    expect(ventana.fin).toBe(referencia);
    expect(ventana.inicio).toBe(fechaAMs(lunes2026(19)));
  });

  it('should keep the empty space on the right for a product out of season', () => {
    const ventana = filtrarRango(puntos2026(rango(1, 20)), referencia, 26);
    expect(ventana.puntos.map((p) => p.semana)).toEqual([19, 20]);
    expect(ventana.fin).toBe(referencia);
  });

  it('should return an empty window when the range has no quotations', () => {
    const ventana = filtrarRango(puntos2026(rango(1, 10)), referencia, 26);
    expect(ventana.puntos).toEqual([]);
    expect(describirVentana(ventana, '€/kg')).toBe('Sin cotizaciones en este periodo.');
  });

  it('should start "all" at the first quotation', () => {
    const ventana = filtrarRango(puntos2026(rango(3, 44)), referencia, null);
    expect(ventana.inicio).toBe(fechaAMs(lunes2026(3)));
    expect(ventana.puntos).toHaveLength(42);
  });

  it('should build one window per range for the selector', () => {
    const ventanas = ventanasPorRango(puntos2026(rango(1, 44)), referencia);
    expect([...ventanas.keys()]).toEqual(['6m', '1a', '3a', 'todo']);
    expect(ventanas.get('6m')?.puntos).toHaveLength(26);
    expect(ventanas.get('todo')?.puntos).toHaveLength(44);
  });
});

describe('indiceMasCercano', () => {
  const puntos = puntos2026([1, 2, 3, 10]);
  const en = (semana: number, dias = 0) => fechaAMs(lunes2026(semana)) + dias * 86_400_000;

  it('should find the exact week and the nearest one in between', () => {
    expect(indiceMasCercano(puntos, en(2))).toBe(1);
    expect(indiceMasCercano(puntos, en(2, 2))).toBe(1);
    expect(indiceMasCercano(puntos, en(2, 5))).toBe(2);
  });

  it('should clamp to the first and last points and jump across gaps', () => {
    expect(indiceMasCercano(puntos, en(1, -30))).toBe(0);
    expect(indiceMasCercano(puntos, en(10, 30))).toBe(3);
    expect(indiceMasCercano(puntos, en(8))).toBe(3);
  });

  it('should return -1 without points', () => {
    expect(indiceMasCercano([], 0)).toBe(-1);
  });
});

describe('dibujar y describir', () => {
  it('should draw a series with a gap as two pieces of line and band', () => {
    const ventana = filtrarRango(puntos2026([1, 2, 3, 6, 7]), fechaAMs(lunes2026(7)), null);
    const dibujo = dibujar(ventana, LIENZO_GRAFICO);
    expect(dibujo.tramos).toBe(2);
    expect(dibujo.linea.match(/M/g)).toHaveLength(2);
    expect(dibujo.banda.match(/Z/g)).toHaveLength(2);
    expect(dibujo.aislados.puntos).toBe('');
  });

  it('should summarise the visible series for screen readers', () => {
    const ventana = filtrarRango(puntos2026([1, 2, 3, 6]), fechaAMs(lunes2026(6)), null);
    expect(describirVentana(ventana, '€/kg')).toBe(
      'Precio medio semanal desde la sem. 1 de 2026 hasta la sem. 6 de 2026: entre 0,31 y 0,36 €/kg; ' +
        'el último, 0,36 €/kg. 4 semanas con cotización, 1 periodo sin cotización.',
    );
  });
});

describe('lectura del punto señalado', () => {
  const [punto] = puntos2026([44]);
  if (!punto) throw new Error('falta el punto');

  it('should label the latest week with its dates and give mean, minimum and maximum', () => {
    expect(leerPunto(punto, { anyo: 2026, semana: 44 }, '€/kg')).toEqual({
      semana: 'semana 44 (26 oct–1 nov 2026)',
      medio: '0,74 €/kg',
      horquilla: 'mín. 0,69 · máx. 0,79',
      frase: 'semana 44 (26 oct–1 nov 2026): precio medio 0,74 €/kg, mínimo 0,69, máximo 0,79 €/kg',
    });
  });

  it('should label historic weeks with the GVA week number', () => {
    expect(leerPunto(punto, { anyo: 2026, semana: 45 }, '€/kg').semana).toBe('sem. 44 de 2026');
  });

  it('should turn a horizontal position into time, clamped to the window', () => {
    const ventana = { inicio: 0, fin: 1000, puntos: [] };
    const lienzo = { ancho: 1000, alto: 300, margenX: 100 };
    expect(tiempoEnFraccion(ventana, lienzo, 0.5)).toBe(500);
    expect(tiempoEnFraccion(ventana, lienzo, 0.1)).toBe(0);
    expect(tiempoEnFraccion(ventana, lienzo, 0)).toBe(0);
    expect(tiempoEnFraccion(ventana, lienzo, 1)).toBe(1000);
  });
});
