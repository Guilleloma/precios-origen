import { setTimeout as esperar } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { URL_CSV } from './descarga.ts';
import { ErrorIngesta } from './errores.ts';
import { ejecutarIngesta, type DependenciasIngesta, type ResultadoIngesta } from './ingesta.ts';

const USO = `Uso: npm run ingesta -- [--csv <ruta> --actualizado-el AAAA-MM-DD | --url <url>] [--salida <carpeta>] [--permitir-desfase]

  Sin opciones descarga el CSV de la GVA y escribe data/.
  --csv               Usa un CSV local en lugar de descargarlo (trabajo sin red).
  --url               Descarga el CSV de otra dirección (por defecto, la de la GVA).
  --actualizado-el    Fecha de actualización de la fuente; obligatoria con --csv.
  --salida            Carpeta de salida (por defecto, data).
  --permitir-desfase  Solo en local: si la fuente lleva 10 días o más sin datos, avisa en vez de fallar.`;

const DEPENDENCIAS: DependenciasIngesta = {
  fetch: globalThis.fetch,
  esperar: (ms) => esperar(ms),
  avisar: (mensaje) => console.warn(mensaje),
  ahora: () => new Date(),
};

const formatoPrecio = (n: number) => n.toFixed(2).replace('.', ',');

function informar({ estado, publicacion }: ResultadoIngesta, salida: string): void {
  const { resumen, series } = publicacion;
  const { semana, anyo, lunes, domingo } = resumen.ultimaSemana;
  console.log(
    estado === 'publicado'
      ? `Datos escritos en ${salida}/`
      : `Sin cambios: ${salida}/ ya tiene estos datos y no se ha escrito nada`,
  );
  console.log(`Semana de referencia: ${semana}/${anyo} (${lunes} a ${domingo}) · fuente actualizada el ${resumen.fuente.actualizadoEl}`);
  for (const p of resumen.productos) {
    const puntos = series.find((s) => s.slug === p.slug)?.puntos.length ?? 0;
    const u = p.ultimo;
    const variacion = p.variacion
      ? `${p.variacion.euros >= 0 ? '+' : ''}${formatoPrecio(p.variacion.euros)} € (${p.variacion.porcentaje} %) vs sem. ${p.variacion.respectoA.semana}/${p.variacion.respectoA.anyo}`
      : 'sin variación';
    console.log(
      `  ${p.slug.padEnd(22)} ${String(puntos).padStart(3)} semanas · sem. ${u.semana}/${u.anyo}: ${formatoPrecio(u.min)} / ${formatoPrecio(u.medio)} / ${formatoPrecio(u.max)} ${p.unidad} · ${p.cotizaEstaSemana ? 'cotiza' : 'no cotiza esta semana'} · ${variacion}`,
    );
  }
}

/** Devuelve el código de salida: 0 bien, 1 fallo de validación o de la fuente, 2 uso o error inesperado. */
export async function main(argv: string[], deps: DependenciasIngesta = DEPENDENCIAS): Promise<number> {
  let valores;
  try {
    ({ values: valores } = parseArgs({
      args: argv,
      strict: true,
      options: {
        csv: { type: 'string' },
        url: { type: 'string', default: URL_CSV },
        'actualizado-el': { type: 'string' },
        salida: { type: 'string', default: 'data' },
        'permitir-desfase': { type: 'boolean', default: false },
      },
    }));
  } catch (e) {
    console.error(`${(e as Error).message}\n\n${USO}`);
    return 2;
  }

  try {
    const resultado = await ejecutarIngesta(
      {
        url: valores.url,
        salida: valores.salida,
        csv: valores.csv,
        actualizadoEl: valores['actualizado-el'],
        permitirDesfase: valores['permitir-desfase'],
      },
      deps,
    );
    informar(resultado, valores.salida);
    return 0;
  } catch (e) {
    if (e instanceof ErrorIngesta) {
      console.error(`Ingesta fallida [${e.codigo}]: ${e.message}\nNo se ha escrito nada en ${valores.salida}/.`);
      return 1;
    }
    console.error('Error inesperado en la ingesta:', e);
    return 2;
  }
}

const esEjecucionDirecta = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (esEjecucionDirecta) process.exitCode = await main(process.argv.slice(2));
