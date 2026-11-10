import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorIngesta } from '../scripts/ingesta/errores.ts';
import { ejecutarIngesta, type DependenciasIngesta } from '../scripts/ingesta/ingesta.ts';
import { main } from '../scripts/ingesta/main.ts';
import { CABECERA, RUTA_MUESTRA, leerMuestra } from './factorias.ts';

const AHORA_MUESTRA = new Date('2021-05-19T16:31:10Z');
const LAST_MODIFIED = 'Wed, 19 May 2021 12:21:40 GMT';
const RELLENO = '\n'.repeat(1_000_000); // el parser ignora líneas vacías; supera el tamaño mínimo

let salida: string;

function dependencias(datos: Partial<DependenciasIngesta> = {}): DependenciasIngesta {
  return {
    fetch: vi.fn(async () => new Response('', { status: 500 })),
    esperar: vi.fn(async () => {}),
    avisar: vi.fn(),
    ahora: () => AHORA_MUESTRA,
    ...datos,
  };
}

const respuestaCsv = (texto: string, cabeceras: Record<string, string> = { 'last-modified': LAST_MODIFIED }) =>
  vi.fn(async () => new Response(texto, { status: 200, headers: cabeceras }));

/** Contenido de cada fichero de la carpeta de salida, para comprobar que no cambia. */
function instantanea(carpeta: string): Record<string, string> {
  if (!existsSync(carpeta)) return {};
  const ficheros: Record<string, string> = {};
  for (const ruta of readdirSync(carpeta, { recursive: true }) as string[]) {
    const completa = join(carpeta, ruta);
    if (ruta.endsWith('.json') || ruta.includes('.tmp-')) ficheros[ruta] = readFileSync(completa, 'utf8');
  }
  return ficheros;
}

async function publicarMuestra(): Promise<Record<string, string>> {
  await ejecutarIngesta(
    { url: 'x', salida, csv: RUTA_MUESTRA, actualizadoEl: '2021-05-19' },
    dependencias(),
  );
  return instantanea(salida);
}

async function codigoDe(promesa: Promise<unknown>): Promise<string | undefined> {
  try {
    await promesa;
  } catch (e) {
    return e instanceof ErrorIngesta ? e.codigo : 'OTRO';
  }
  return undefined;
}

beforeEach(() => {
  salida = join(mkdtempSync(join(tmpdir(), 'precios-origen-test-')), 'data');
});

afterEach(() => {
  rmSync(join(salida, '..'), { recursive: true, force: true });
});

describe('ejecutarIngesta con la muestra real', () => {
  it('should generate the expected JSON (snapshot)', async () => {
    const ficheros = await publicarMuestra();
    expect(Object.keys(ficheros).sort()).toEqual([
      'resumen.json',
      'series/aceite-virgen-extra.json',
      'series/almendra-comuna.json',
      'series/almendra-marcona.json',
      'series/clementina-clemenules.json',
      'series/garrofa.json',
      'series/limon-fino.json',
      'series/naranja-navelina.json',
    ]);
    await expect(ficheros['resumen.json']).toMatchFileSnapshot('./__snapshots__/resumen-muestra.json');
    await expect(ficheros['series/naranja-navelina.json']).toMatchFileSnapshot(
      './__snapshots__/serie-naranja-navelina-muestra.json',
    );
  });

  it('should not rewrite anything when only the generation time would change', async () => {
    const antes = await publicarMuestra();
    const resultado = await ejecutarIngesta(
      { url: 'x', salida, csv: RUTA_MUESTRA, actualizadoEl: '2021-05-19' },
      dependencias({ ahora: () => new Date('2021-05-20T16:31:10Z') }),
    );
    expect(resultado.estado).toBe('sin-cambios');
    expect(instantanea(salida)).toEqual(antes);
  });

  it('should take the update date from the Last-Modified header when downloading', async () => {
    const deps = dependencias({ fetch: respuestaCsv(leerMuestra() + RELLENO) });
    const { publicacion } = await ejecutarIngesta({ url: 'x', salida }, deps);
    expect(publicacion.resumen.fuente.actualizadoEl).toBe('2021-05-19');
  });

  it('should fail on stale data unless --permitir-desfase is used', async () => {
    const tarde = { ahora: () => new Date('2021-05-26T10:00:00Z') };
    const opciones = { url: 'x', salida, csv: RUTA_MUESTRA, actualizadoEl: '2021-05-19' };
    expect(await codigoDe(ejecutarIngesta(opciones, dependencias(tarde)))).toBe('DATOS_DESFASADOS');
    expect(existsSync(salida)).toBe(false);
    const { estado } = await ejecutarIngesta({ ...opciones, permitirDesfase: true }, dependencias(tarde));
    expect(estado).toBe('publicado');
  });

  it('should require --actualizado-el with --csv', async () => {
    const sinFecha = ejecutarIngesta({ url: 'x', salida, csv: RUTA_MUESTRA }, dependencias());
    expect(await codigoDe(sinFecha)).toBe('OPCION_INVALIDA');
    const fechaImposible = ejecutarIngesta({ url: 'x', salida, csv: RUTA_MUESTRA, actualizadoEl: '2021-02-30' }, dependencias());
    expect(await codigoDe(fechaImposible)).toBe('OPCION_INVALIDA');
  });
});

describe('fallos de la fuente: código de salida distinto de 0 y data/ intacto', () => {
  let errores: string[];
  beforeEach(() => {
    errores = [];
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => void errores.push(args.join(' ')));
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('should retry 3 times and exit 1 when the download fails', async () => {
    const antes = await publicarMuestra();
    const deps = dependencias();
    expect(await main(['--salida', salida], deps)).toBe(1);
    expect(deps.fetch).toHaveBeenCalledTimes(4);
    expect(deps.esperar).toHaveBeenCalledTimes(3);
    expect(errores.join()).toContain('[DESCARGA_FALLIDA]');
    expect(errores.join()).toContain('HTTP 500');
    expect(instantanea(salida)).toEqual(antes);
  });

  it('should exit 1 when the download is too small, has no date or is not UTF-8', async () => {
    const antes = await publicarMuestra();
    const casos = [
      respuestaCsv(leerMuestra()),
      respuestaCsv(leerMuestra() + RELLENO, {}),
      vi.fn(async () => new Response(new Uint8Array(1_000_001).fill(0xff), { headers: { 'last-modified': LAST_MODIFIED } })),
      vi.fn(async () => {
        throw new TypeError('fetch failed');
      }),
    ];
    for (const fetch of casos) expect(await main(['--salida', salida], dependencias({ fetch }))).toBe(1);
    expect(errores).toHaveLength(4);
    for (const motivo of ['bytes (mínimo', 'Last-Modified', 'encoded data was not valid', 'fetch failed']) {
      expect(errores.join()).toContain(motivo);
    }
    expect(instantanea(salida)).toEqual(antes);
  });

  it('should exit 1 before writing anything when the CSV has an unexpected format', async () => {
    const antes = await publicarMuestra();
    const cambiada = leerMuestra().replace(CABECERA, CABECERA.replace('precio_medio', 'precio_mitja'));
    expect(await main(['--salida', salida], dependencias({ fetch: respuestaCsv(cambiada + RELLENO) }))).toBe(1);
    expect(errores.at(-1)).toContain('[CSV_CABECERA_INESPERADA]');
    // Última fila de la Navelina de Valencia (semana 1 de 2021) con punto decimal.
    const navelina = '"46";"Valencia";"València";0,11;0,14;0,17';
    expect(leerMuestra()).toContain(navelina);
    const conPunto = leerMuestra().replace(navelina, navelina.replace('0,14', '0.14'));
    expect(await main(['--salida', salida], dependencias({ fetch: respuestaCsv(conPunto + RELLENO) }))).toBe(1);
    expect(errores.at(-1)).toContain('[PRECIO_FORMATO_INESPERADO]');
    expect(instantanea(salida)).toEqual(antes);
  });

  it('should exit 1 and keep data/ when the CSV goes back in time', async () => {
    const antes = await publicarMuestra();
    const recortada = leerMuestra()
      .split('\n')
      .filter((linea) => !linea.startsWith('2021;20;'))
      .join('\n');
    const deps = dependencias({ fetch: respuestaCsv(recortada + RELLENO) });
    expect(await main(['--salida', salida, '--permitir-desfase'], deps)).toBe(1);
    expect(errores.at(-1)).toContain('[RETROCESO_SEMANA]');
    expect(instantanea(salida)).toEqual(antes);
  });

  it('should exit 2 on unknown options', async () => {
    expect(await main(['--salidas', salida], dependencias())).toBe(2);
  });
});

describe('npm run ingesta (proceso real)', () => {
  it('should exit with a non-zero code and create nothing when the CSV cannot be read', () => {
    const main = fileURLToPath(new URL('../scripts/ingesta/main.ts', import.meta.url));
    const proceso = spawnSync(
      process.execPath,
      ['--experimental-strip-types', '--disable-warning=ExperimentalWarning', main, '--csv', join(salida, '..', 'no-existe.csv'), '--actualizado-el', '2026-11-04', '--salida', salida],
      { encoding: 'utf8', timeout: 20_000 },
    );
    expect(proceso.status).toBe(1);
    expect(proceso.stderr).toContain('CSV_NO_LEGIBLE');
    expect(existsSync(salida)).toBe(false);
  });
});
