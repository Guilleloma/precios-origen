/**
 * Interacción del gráfico en el navegador: ratón, tacto y teclado señalan una semana.
 * Los paneles de cada rango ya vienen pintados del build; aquí solo se mueve el cursor
 * y se actualiza la lectura, con las mismas funciones que usó el build.
 */

import type { PuntoSerie, SemanaRef } from '../../scripts/ingesta/contrato.ts';
import { leerPunto, tiempoEnFraccion } from './lectura.ts';
import { ventanasPorRango, type ClaveRango, type Ventana } from './rango.ts';
import { indiceMasCercano, puntosDeSerie } from './serie.ts';
import { dibujar, LIENZO_GRAFICO } from './trazado.ts';

const PASO_PAGINA = 4;

interface Contexto {
  ultimaSemana: SemanaRef;
  unidad: string;
  lecturaSemana: HTMLElement;
  lecturaMedio: HTMLElement;
  lecturaHorquilla: HTMLElement;
}

interface Panel {
  mostrarUltimo: () => void;
}

function prepararPanel(panel: HTMLElement, ventana: Ventana, contexto: Contexto): Panel | null {
  const lienzo = panel.querySelector<HTMLElement>('[data-lienzo]');
  const cursor = panel.querySelector<HTMLElement>('[data-cursor]');
  const marca = panel.querySelector<HTMLElement>('[data-marca]');
  if (!lienzo || !cursor || !marca || ventana.puntos.length === 0) return null;

  const { ex, ey } = dibujar(ventana, LIENZO_GRAFICO);
  const { puntos } = ventana;
  let indice = puntos.length - 1;

  const señalar = (nuevo: number, mostrarCursor: boolean) => {
    indice = Math.min(puntos.length - 1, Math.max(0, nuevo));
    const punto = puntos[indice];
    if (!punto) return;
    const lectura = leerPunto(punto, contexto.ultimaSemana, contexto.unidad);
    contexto.lecturaSemana.textContent = lectura.semana;
    contexto.lecturaMedio.textContent = lectura.medio;
    contexto.lecturaHorquilla.textContent = lectura.horquilla;
    lienzo.setAttribute('aria-valuenow', String(indice));
    lienzo.setAttribute('aria-valuetext', lectura.frase);
    const izquierda = `${(ex(punto.t) / LIENZO_GRAFICO.ancho) * 100}%`;
    cursor.style.left = izquierda;
    marca.style.left = izquierda;
    marca.style.top = `${(ey(punto.medio) / LIENZO_GRAFICO.alto) * 100}%`;
    cursor.hidden = !mostrarCursor;
    marca.hidden = !mostrarCursor;
  };

  const señalarEnPantalla = (evento: PointerEvent) => {
    const caja = lienzo.getBoundingClientRect();
    const t = tiempoEnFraccion(ventana, LIENZO_GRAFICO, (evento.clientX - caja.left) / caja.width);
    señalar(indiceMasCercano(puntos, t), true);
  };

  lienzo.addEventListener('pointerdown', señalarEnPantalla);
  lienzo.addEventListener('pointermove', (evento) => {
    if (evento.pointerType === 'mouse' || evento.buttons > 0) señalarEnPantalla(evento);
  });
  lienzo.addEventListener('pointerleave', (evento) => {
    if (evento.pointerType === 'mouse') señalar(puntos.length - 1, false);
  });

  lienzo.addEventListener('keydown', (evento) => {
    const saltos: Record<string, number> = {
      ArrowLeft: indice - 1,
      ArrowDown: indice - 1,
      ArrowRight: indice + 1,
      ArrowUp: indice + 1,
      PageDown: indice - PASO_PAGINA,
      PageUp: indice + PASO_PAGINA,
      Home: 0,
      End: puntos.length - 1,
    };
    const destino = saltos[evento.key];
    if (destino === undefined) return;
    evento.preventDefault();
    señalar(destino, true);
  });
  lienzo.addEventListener('blur', () => señalar(indice, false));

  return { mostrarUltimo: () => señalar(puntos.length - 1, false) };
}

export function iniciarGrafico(raiz: HTMLElement): void {
  const datos = raiz.dataset;
  const lecturaSemana = raiz.querySelector<HTMLElement>('[data-lectura-semana]');
  const lecturaMedio = raiz.querySelector<HTMLElement>('[data-lectura-medio]');
  const lecturaHorquilla = raiz.querySelector<HTMLElement>('[data-lectura-horquilla]');
  if (!datos.puntos || !datos.referencia || !lecturaSemana || !lecturaMedio || !lecturaHorquilla) return;

  const puntos = puntosDeSerie(JSON.parse(datos.puntos) as PuntoSerie[]);
  const ventanas = ventanasPorRango(puntos, Number(datos.referencia));
  const contexto: Contexto = {
    ultimaSemana: { anyo: Number(datos.anyo), semana: Number(datos.semana) },
    unidad: datos.unidad ?? '',
    lecturaSemana,
    lecturaMedio,
    lecturaHorquilla,
  };

  const paneles = new Map<string, Panel | null>();
  for (const panel of raiz.querySelectorAll<HTMLElement>('[data-rango]')) {
    const clave = panel.dataset.rango as ClaveRango;
    const ventana = ventanas.get(clave);
    if (ventana) paneles.set(clave, prepararPanel(panel, ventana, contexto));
  }

  const activar = (clave: string) => {
    raiz.dataset.activo = clave;
    const panel = paneles.get(clave);
    if (panel) {
      panel.mostrarUltimo();
    } else {
      lecturaSemana.textContent = 'Sin cotizaciones en este periodo';
      lecturaMedio.textContent = '';
      lecturaHorquilla.textContent = '';
    }
  };

  for (const opcion of raiz.querySelectorAll<HTMLInputElement>('input[name="rango"]')) {
    opcion.addEventListener('change', () => activar(opcion.value));
    if (opcion.checked) activar(opcion.value);
  }
}
