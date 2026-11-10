import { ErrorIngesta } from './errores.ts';

export const URL_CSV =
  'https://dadesobertes.gva.es/dataset/19178f38-7694-4dbc-9f10-a5c3f2248786/resource/1e89904a-358a-4fe1-8b47-322d7b9c79a6/download/precios-agrarios-de-origen-de-la-comunitat-valenciana.csv';

export const TAMANO_MINIMO = 1_000_000;
const TIEMPO_MAXIMO_MS = 60_000;
/** Esperas antes de cada reintento: 3 reintentos con espera creciente. */
export const ESPERAS_REINTENTO_MS = [5_000, 15_000, 45_000];

export interface CsvDescargado {
  texto: string;
  /** Fecha (AAAA-MM-DD, UTC) de la cabecera Last-Modified: «actualizado el» de la fuente. */
  actualizadoEl: string;
}

export interface DependenciasDescarga {
  fetch: typeof globalThis.fetch;
  esperar: (ms: number) => Promise<void>;
  avisar: (mensaje: string) => void;
}

async function intentarDescarga(url: string, fetch: typeof globalThis.fetch): Promise<CsvDescargado> {
  const respuesta = await fetch(url, { signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS) });
  if (respuesta.status !== 200) {
    throw new ErrorIngesta('DESCARGA_HTTP', `La descarga respondió HTTP ${respuesta.status}`);
  }
  const ultimaModificacion = Date.parse(respuesta.headers.get('last-modified') ?? '');
  if (Number.isNaN(ultimaModificacion)) {
    throw new ErrorIngesta('DESCARGA_SIN_FECHA', 'La respuesta no trae una cabecera Last-Modified válida');
  }
  const bytes = new Uint8Array(await respuesta.arrayBuffer());
  if (bytes.byteLength < TAMANO_MINIMO) {
    throw new ErrorIngesta('DESCARGA_INCOMPLETA', `El CSV ocupa ${bytes.byteLength} bytes (mínimo ${TAMANO_MINIMO})`);
  }
  const texto = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  return { texto, actualizadoEl: new Date(ultimaModificacion).toISOString().slice(0, 10) };
}

/** Motivo legible de un fallo. `fetch` esconde la causa de red (DNS, conexión rechazada, TLS...) en `cause`. */
function motivoDeFallo(e: unknown): string {
  if (!(e instanceof Error)) return String(e);
  if (!(e.cause instanceof Error)) return e.message;
  const codigo = (e.cause as NodeJS.ErrnoException).code;
  return `${e.message} (${codigo ? `${codigo}: ` : ''}${e.cause.message})`;
}

/** Descarga el CSV con hasta 3 reintentos. Lanza ErrorIngesta con el último fallo si no lo consigue. */
export async function descargarCsv(url: string, deps: DependenciasDescarga): Promise<CsvDescargado> {
  for (let intento = 0; ; intento++) {
    try {
      return await intentarDescarga(url, deps.fetch);
    } catch (e) {
      const motivo = motivoDeFallo(e);
      const espera = ESPERAS_REINTENTO_MS[intento];
      if (espera === undefined) {
        throw new ErrorIngesta('DESCARGA_FALLIDA', `No se pudo descargar el CSV tras ${intento + 1} intentos: ${motivo}`);
      }
      deps.avisar(`Intento ${intento + 1} fallido (${motivo}); reintento en ${espera / 1000} s`);
      await deps.esperar(espera);
    }
  }
}
