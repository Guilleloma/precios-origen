import { describe, expect, it } from 'vitest';
import type { Resumen } from '../scripts/ingesta/contrato.ts';
import { hayAtraso, semanaPendiente, textoAtraso } from '../src/formato/atraso.ts';
import { descripcionPortada, descripcionProducto, tituloProducto } from '../src/formato/compartir.ts';
import {
  etiquetaSemana,
  etiquetaSemanaConFechas,
  fechaLocal,
  formatearFecha,
  formatearMesAnyo,
  formatearRango,
} from '../src/formato/fechas.ts';
import { formatearConSigno, formatearPrecio, formatearPrecioConUnidad } from '../src/formato/numeros.ts';
import { estadoFila, formatearVariacion } from '../src/formato/variacion.ts';
import { productoResumen } from './factorias-web.ts';

const NB = ' ';

describe('formatearPrecio', () => {
  it('should always show two decimals with a decimal comma', () => {
    expect(formatearPrecio(0.27)).toBe('0,27');
    expect(formatearPrecio(5.9)).toBe('5,90');
    expect(formatearPrecio(1)).toBe('1,00');
    expect(formatearPrecio(0)).toBe('0,00');
  });

  it('should join price and unit with a non-breaking space', () => {
    expect(formatearPrecioConUnidad(0.27, '€/kg')).toBe(`0,27${NB}€/kg`);
  });
});

describe('formatearConSigno', () => {
  it('should prefix a plus sign to positive values and a typographic minus to negative ones', () => {
    expect(formatearConSigno(0.01, 2)).toBe('+0,01');
    expect(formatearConSigno(-0.03, 2)).toBe('−0,03');
    expect(formatearConSigno(-7.9, 1)).toBe('−7,9');
  });

  it('should show zero without sign, also when rounding hides a tiny value', () => {
    expect(formatearConSigno(0, 2)).toBe('0,00');
    expect(formatearConSigno(-0.001, 2)).toBe('0,00');
    expect(formatearConSigno(0.001, 2)).toBe('0,00');
  });
});

describe('formatearVariacion', () => {
  it('should format a rise with arrow, sign, euros and percentage', () => {
    expect(formatearVariacion({ euros: 0.01, porcentaje: 3.8, respectoA: { anyo: 2026, semana: 43 } })).toEqual({
      sentido: 'sube',
      flecha: '▲',
      palabra: 'Sube',
      texto: `+0,01${NB}€ (+3,8${NB}%)`,
    });
  });

  it('should format a fall with a down arrow and minus signs', () => {
    const variacion = formatearVariacion({ euros: -0.03, porcentaje: -7.9, respectoA: { anyo: 2026, semana: 43 } });
    expect(variacion.sentido).toBe('baja');
    expect(variacion.flecha).toBe('▼');
    expect(variacion.texto).toBe(`−0,03${NB}€ (−7,9${NB}%)`);
  });

  it('should mark an unchanged price as such, not as a rise', () => {
    const variacion = formatearVariacion({ euros: 0, porcentaje: 0, respectoA: { anyo: 2026, semana: 43 } });
    expect(variacion).toMatchObject({ sentido: 'igual', flecha: '=', palabra: 'Sin cambios' });
    expect(variacion.texto).toBe(`0,00${NB}€ (0,0${NB}%)`);
  });
});

describe('fechas', () => {
  it('should format a single date in Spanish with short month', () => {
    expect(formatearFecha('2026-11-04')).toBe('4 nov 2026');
    expect(formatearFecha('2026-09-07')).toBe('7 sept 2026');
  });

  it('should format a week range within a month, across months and across years', () => {
    expect(formatearRango('2026-11-02', '2026-11-08')).toBe('2–8 nov 2026');
    expect(formatearRango('2026-10-26', '2026-11-01')).toBe('26 oct–1 nov 2026');
    expect(formatearRango('2025-12-29', '2026-01-04')).toBe('29 dic 2025–4 ene 2026');
  });

  it('should label the reference week with its dates and historic weeks with the GVA number', () => {
    expect(etiquetaSemanaConFechas({ anyo: 2026, semana: 44 }, '2026-10-26')).toBe('semana 44 (26 oct–1 nov 2026)');
    expect(etiquetaSemana({ anyo: 2021, semana: 12 })).toBe('sem. 12 de 2021');
  });

  it('should write month and year in full', () => {
    expect(formatearMesAnyo('2020-12-28')).toBe('diciembre de 2020');
  });

  it('should take the local calendar day of the device', () => {
    expect(fechaLocal(new Date(2026, 10, 6, 23, 59))).toBe('2026-11-06');
  });
});

describe('estadoFila', () => {
  it('should show the weekly change when the previous week has a quotation', () => {
    const estado = estadoFila(productoResumen());
    expect(estado).toMatchObject({ tipo: 'variacion', respectoA: null });
  });

  it('should name the compared week after a gap of 1 to 3 weeks', () => {
    const estado = estadoFila(
      productoResumen({
        variacion: { euros: 0.02, porcentaje: 8, respectoA: { anyo: 2026, semana: 41 } },
        anterior: { anyo: 2026, semana: 41, lunes: '2026-10-05' },
      }),
    );
    expect(estado).toMatchObject({ tipo: 'variacion', respectoA: 'respecto a la sem. 41' });
  });

  it('should add the year to the compared week when it belongs to the previous year', () => {
    const estado = estadoFila(
      productoResumen({
        ultimo: { anyo: 2026, semana: 2, lunes: '2026-01-05', min: 0.2, medio: 0.27, max: 0.34 },
        variacion: { euros: 0.02, porcentaje: 8, respectoA: { anyo: 2025, semana: 51 } },
        anterior: { anyo: 2025, semana: 51, lunes: '2025-12-15' },
      }),
    );
    expect(estado).toMatchObject({ respectoA: 'respecto a la sem. 51 de 2025' });
  });

  it('should announce the first quotation after a gap of 4 weeks or more', () => {
    const estado = estadoFila(
      productoResumen({ variacion: null, anterior: { anyo: 2026, semana: 22, lunes: '2026-05-25' } }),
    );
    expect(estado).toEqual({ tipo: 'primeraTrasHueco', texto: 'Primera cotización desde la sem. 22' });
  });

  it('should show no change for the first quotation of a series', () => {
    expect(estadoFila(productoResumen({ variacion: null, anterior: null }))).toEqual({ tipo: 'primeraDeLaSerie' });
  });

  it('should say since when a product has no quotation, with month and year', () => {
    const estado = estadoFila(
      productoResumen({
        cotizaEstaSemana: false,
        ultimo: { anyo: 2021, semana: 14, lunes: '2021-03-29', min: 0.12, medio: 0.16, max: 0.2 },
        variacion: null,
        anterior: { anyo: 2021, semana: 13, lunes: '2021-03-22' },
      }),
    );
    expect(estado).toEqual({ tipo: 'sinCotizacion', texto: 'Sin cotización desde la sem. 14 (marzo de 2021)' });
  });
});

describe('aviso de dato atrasado', () => {
  const ultima = { anyo: 2026, semana: 44, lunes: '2026-10-26' };

  it('should not warn 4 days after the last Sunday', () => {
    expect(hayAtraso('2026-11-01', '2026-11-05')).toBe(false);
  });

  it('should warn from 5 days after the last Sunday', () => {
    expect(hayAtraso('2026-11-01', '2026-11-06')).toBe(true);
    expect(hayAtraso('2026-11-01', '2026-11-20')).toBe(true);
  });

  it('should name the missing week', () => {
    expect(semanaPendiente(ultima)).toBe(45);
    expect(textoAtraso(ultima)).toBe(
      'El dato de la semana 45 aún no se ha publicado. Ves los precios de la semana 44.',
    );
  });

  it('should keep week 53 in a year with 53 weeks and restart at 1 when the Monday changes year', () => {
    expect(semanaPendiente({ anyo: 2026, semana: 52, lunes: '2026-12-21' })).toBe(53);
    expect(semanaPendiente({ anyo: 2026, semana: 53, lunes: '2026-12-28' })).toBe(1);
  });
});

describe('vista previa al compartir', () => {
  const resumen: Resumen = {
    esquema: 1,
    generadoEl: '2026-11-04T16:31:10Z',
    fuente: { actualizadoEl: '2026-11-04', urlDataset: 'https://dadesobertes.gva.es/es/dataset/agr-obs-pre-origen' },
    ultimaSemana: { anyo: 2026, semana: 44, lunes: '2026-10-26', domingo: '2026-11-01' },
    productos: [
      productoResumen(),
      productoResumen({ slug: 'garrofa', nombre: 'Garrofa entera', ultimo: { anyo: 2026, semana: 44, lunes: '2026-10-26', min: 0.45, medio: 0.51, max: 0.56 } }),
    ],
  };

  it('should list every product price of the week on the home page', () => {
    expect(descripcionPortada(resumen)).toBe(
      'Precio medio en origen, semana 44 (26 oct–1 nov 2026), en €/kg: Naranja Navelina 0,27 · Garrofa entera 0,51. ' +
        'Fuente: Generalitat Valenciana (datos abiertos, CC BY 4.0).',
    );
  });

  it('should put the latest price in the product title', () => {
    expect(tituloProducto(productoResumen())).toBe(`Naranja Navelina: 0,27${NB}€/kg · Precios en origen`);
  });

  it('should describe province, week, change and range of a product', () => {
    expect(descripcionProducto(productoResumen())).toBe(
      `Valencia, sobre árbol. Semana 44 (26 oct–1 nov 2026): ▲ +0,01${NB}€ (+3,8${NB}%) respecto a la semana anterior. ` +
        `Horquilla 0,20–0,34${NB}€/kg. Fuente: Generalitat Valenciana (datos abiertos, CC BY 4.0).`,
    );
  });

  it('should say since when a product has no quotation instead of a change', () => {
    const producto = productoResumen({
      cotizaEstaSemana: false,
      ultimo: { anyo: 2021, semana: 14, lunes: '2021-03-29', min: 0.12, medio: 0.16, max: 0.2 },
      variacion: null,
    });
    expect(descripcionProducto(producto)).toContain(
      `Sin cotización desde la sem. 14 (marzo de 2021). Último precio medio: 0,16${NB}€/kg.`,
    );
  });
});
