# Precios en origen · Comunitat Valenciana

Web estática con los precios agrarios en origen de siete productos valencianos, semana a semana.

Datos: Generalitat Valenciana, Conselleria de Agricultura, [«Precios agrarios de origen de la Comunitat Valenciana»](https://dadesobertes.gva.es/es/dataset/agr-obs-pre-origen) (datos abiertos, CC BY 4.0). Web no oficial, sin relación con la Generalitat Valenciana.

Plan técnico y reglas de cálculo: [`docs/plan-tecnico.md`](docs/plan-tecnico.md).

## Ingesta

Requisitos: Node ≥ 22.6. La ingesta no tiene dependencias de ejecución.

```sh
npm install
npm test                 # tests (Vitest)
npm run typecheck        # tipos
npm run ingesta          # descarga el CSV de la GVA, lo valida y escribe data/
npm run ingesta -- --csv <ruta> --actualizado-el 2026-11-04   # con un CSV local, sin red
```

| Opción | Para qué |
|---|---|
| `--csv <ruta>` | Usa un CSV local en lugar de descargarlo |
| `--actualizado-el AAAA-MM-DD` | Fecha de actualización de la fuente. Obligatoria con `--csv` (al descargar sale de `Last-Modified`) |
| `--salida <carpeta>` | Carpeta de salida. Por defecto, `data` |
| `--permitir-desfase` | **Solo en local.** Si la fuente lleva 10 días o más sin datos, avisa en vez de fallar. El workflow no la usa |

Qué hace, en orden:

1. Descarga el CSV (hasta 3 reintentos con espera creciente) o lo lee de `--csv`.
2. Valida cabecera, formato de precios, productos, calendario de semanas, retroceso respecto a lo ya publicado en la carpeta de salida y desfase de la fuente.
3. Solo si todo pasa, escribe `series/<slug>.json` y, al final, `resumen.json`. Si el contenido es el mismo que el publicado (salvo `generadoEl`), no escribe nada.

Códigos de salida: `0` bien (con o sin cambios), `1` fallo de la fuente o de validación, `2` opción desconocida o error inesperado. Con `1`, el mensaje lleva el código del fallo:

| Código | Qué ha pasado |
|---|---|
| `DESCARGA_FALLIDA` | La descarga falló 4 veces: HTTP distinto de 200, menos de 1 MB, sin `Last-Modified`, no es UTF-8 o tiempo agotado (el motivo va en el mensaje) |
| `CSV_CABECERA_INESPERADA`, `CSV_FORMATO_INESPERADO`, `CSV_MAL_FORMADO`, `CSV_VACIO` | El CSV no tiene la forma esperada |
| `PRECIO_FORMATO_INESPERADO`, `PRECIO_INCOHERENTE` | Un precio de nuestras series no es `0,00` con coma y dos decimales, es cero, o mínimo > medio > máximo no se cumple |
| `PRODUCTO_SIN_FILAS`, `PRODUCTO_NOMBRE_INESPERADO` | Un producto configurado no tiene filas o su código de variedad ha cambiado de nombre |
| `DUPLICADO_SIN_CONTENEDORA`, `DUPLICADO_AMBIGUO` | Filas duplicadas con valores distintos que no se pueden resolver sin inventar |
| `CALENDARIO_SALTO`, `CALENDARIO_SEMANA_REPETIDA` | Falta una semana en el calendario global o dos caen en el mismo lunes |
| `RETROCESO_SEMANA`, `RETROCESO_SERIE` | La última semana es anterior a la publicada o una serie pierde más de 2 puntos |
| `DATOS_DESFASADOS` | Han pasado 10 días o más desde el domingo de la última semana |
| `PUBLICADO_ILEGIBLE` | Lo que ya hay en la carpeta de salida no es JSON válido |
| `OPCION_INVALIDA`, `CSV_NO_LEGIBLE` | Falta `--actualizado-el` con `--csv`, o no se puede leer el fichero |

Los productos se configuran en [`config/productos.ts`](config/productos.ts): añadir una variedad es añadir una entrada.

## Contrato de datos

La ingesta genera dos tipos de fichero en `data/`. Los tipos TypeScript están en [`scripts/ingesta/contrato.ts`](scripts/ingesta/contrato.ts) y se pueden importar desde la web. Ejemplo real generado desde la muestra de los tests: [`tests/__snapshots__/resumen-muestra.json`](tests/__snapshots__/resumen-muestra.json).

Convenciones:

- Precios en **euros por kilo** como número (`0.27`, `5.9`): el JSON no guarda ceros a la derecha, así que la web formatea siempre con dos decimales.
- Fechas `AAAA-MM-DD`. `generadoEl` es UTC sin milisegundos (`2026-11-04T16:31:10Z`).
- `anyo` y `semana` son **siempre los que publica la GVA** (en 2021 no coinciden con ISO). `lunes` es la fecha calculada. Para mostrar una semana del histórico se usa «sem. 12 de 2021», no la fecha.

### `data/resumen.json`

```json
{
  "esquema": 1,
  "generadoEl": "2026-11-10T17:38:59Z",
  "fuente": { "actualizadoEl": "2026-11-04", "urlDataset": "https://dadesobertes.gva.es/es/dataset/agr-obs-pre-origen" },
  "ultimaSemana": { "anyo": 2026, "semana": 44, "lunes": "2026-10-26", "domingo": "2026-11-01" },
  "productos": [
    {
      "slug": "naranja-navelina",
      "nombre": "Naranja Navelina",
      "provincia": "Valencia",
      "unidad": "€/kg",
      "posicion": "sobre árbol",
      "cotizaEstaSemana": true,
      "ultimo": { "anyo": 2026, "semana": 44, "lunes": "2026-10-26", "min": 0.2, "medio": 0.27, "max": 0.34 },
      "variacion": { "euros": 0.01, "porcentaje": 3.8, "respectoA": { "anyo": 2026, "semana": 43 } },
      "anterior": { "anyo": 2026, "semana": 43, "lunes": "2026-10-19" }
    }
  ]
}
```

| Campo | Significado |
|---|---|
| `esquema` | Versión del contrato. Sube si cambia de forma incompatible |
| `fuente.actualizadoEl` | Fecha de la última actualización del dataset (`Last-Modified` del CSV). Va en la atribución: «actualizado el 4 nov 2026» |
| `ultimaSemana` | Semana de referencia: la última del CSV para cualquier producto, con su lunes y su domingo. El aviso de dato atrasado compara hoy con `domingo` |
| `productos` | En el orden de `config/productos.ts` |
| `provincia` | Provincia de la serie. Se rotula siempre junto al precio |
| `cotizaEstaSemana` | Tiene fila en `ultimaSemana` |
| `ultimo` | Última cotización de la serie: de esta semana o, si no cotiza, la más reciente. `medio` es el punto medio de la horquilla de la GVA |
| `variacion` | Cálculo propio sobre el precio medio: `euros` con dos decimales y `porcentaje` con uno. `null` si no aplica (ver abajo) |
| `variacion.respectoA` | Semana GVA con la que se compara |
| `anterior` | Cotización inmediatamente anterior a `ultimo` en la serie, o `null` si `ultimo` es la primera. **Añadido al contrato del plan** para que la lista pueda rotular los estados sin leer la serie |

Cómo sacar los estados de la fila (reglas 6 y 7 del plan) con estos campos:

| Estado | Condición | Texto |
|---|---|---|
| Variación normal | `variacion` y `anterior.lunes` a 7 días de `ultimo.lunes` | «+0,01 € (+3,8 %)» |
| Variación tras hueco de 1 a 3 semanas | `variacion` y `anterior.lunes` a más de 7 días | «… respecto a la sem. `respectoA.semana`» |
| Primera cotización tras un hueco de 4 semanas o más | `cotizaEstaSemana`, `variacion === null` y `anterior` | «Primera cotización desde la sem. `anterior.semana`» |
| Primera cotización de la serie | `cotizaEstaSemana`, `variacion === null` y `anterior === null` | Sin variación (no pasa con los datos actuales) |
| Sin cotización esta semana | `cotizaEstaSemana === false` (`variacion` es `null`) | Precio atenuado y «Sin cotización desde la sem. `ultimo.semana` (mes año de `ultimo.lunes`)» |

### `data/series/<slug>.json`

Una por producto. Un punto por semana con cotización, ordenados por fecha, sin semanas vacías: los huecos son semanas sin dato y **no se interpolan**. Dos puntos son consecutivos solo si sus `lunes` están a 7 días exactos.

```json
{
  "slug": "garrofa",
  "puntos": [
    ["2017-11-06", 2017, 45, 0.34, 0.37, 0.4],
    ["2026-10-26", 2026, 44, 0.45, 0.51, 0.56]
  ]
}
```

Cada punto es `[lunes, año, semana, mínimo, medio, máximo]`. Tamaño con los datos de noviembre de 2026: de 8 a 19 KB por serie y 5 KB el resumen.

## Web

Sitio estático con [Astro](https://astro.build) 7.3 y TypeScript, sin librería de gráficos ni de interfaz. Necesita los datos de `data/` (si no están, `npm run ingesta`).

```sh
npm run dev       # servidor de desarrollo: http://localhost:4321/precios-origen/
npm run build     # genera dist/
npm run preview   # sirve dist/ en http://localhost:4321/precios-origen/
```

| Variable de entorno | Para qué | Por defecto |
|---|---|---|
| `DATOS_DIR` | Carpeta con `resumen.json` y `series/` | `data` |
| `SITIO_URL` | Dominio de publicación (`https://<usuario>.github.io`). Sin él, la imagen de la vista previa sale con ruta relativa y WhatsApp no la enseña: **el workflow de publicación debe definirlo** | sin definir |
| `RUTA_BASE` | Ruta base de la web | `/precios-origen/` |

La dirección de publicación no se escribe en el código porque lleva el usuario de GitHub.

Los scripts desactivan la telemetría de Astro (`ASTRO_TELEMETRY_DISABLED=1`). El build no genera source maps, no carga nada de otros dominios (tipografías del sistema) y marca todas las páginas con `noindex`.

### Páginas

| Ruta | Qué muestra |
|---|---|
| `/` | Lista de productos: precio medio, variación con flecha y signo, provincia, posición, semana y minigráfica de 52 semanas |
| `/<slug>/` | Detalle: precio, horquilla, atribución completa, gráfico con rangos de 6 meses, 1 año, 3 años y todo, y tabla con todas las semanas |
| `/sobre-los-datos/` | Fuente, licencia, qué es el precio medio, provincia de cada producto y cómo se calcula la variación |

### Estructura de `src/`

```
src/
├── datos/        # cargar.ts lee data/ en el build (valida el esquema); rutas.ts une rutas con la base
├── formato/      # funciones puras en es-ES: precios, fechas, variación y estado de cada fila,
│                 # aviso de dato atrasado y textos de la vista previa al compartir
├── grafico/      # funciones puras del gráfico (tramos, escalas, trazados, rangos, lectura)
│                 # e interaccion.ts, lo único que corre en el navegador junto con el aviso
├── componentes/  # FilaProducto, Minigrafica, Variacion, Grafico, SelectorRango, TablaDatos, Atribucion, AvisoAtraso
├── estilos/      # global.css: colores de los dos temas (contraste AA) y tipografía
├── layouts/      # Base.astro: cabecera, aviso, pie legal, Open Graph y noindex
└── pages/        # index.astro, [slug].astro, sobre-los-datos.astro
public/           # favicon.svg y og.png (1200×630, sin metadatos)
```

Cómo funciona:

- **Todo se calcula en el build.** Las páginas salen en HTML con el gráfico ya dibujado en SVG. Sin JavaScript se ve todo, incluido el cambio de rango (botones de opción y CSS). Con JavaScript, además, se señala cada semana con el ratón, el dedo o el teclado.
- **Las mismas funciones** (`src/grafico/`, `src/formato/`) dibujan en el build y en el navegador, y tienen tests en `tests/web-*.test.ts`.
- **Huecos**: dos puntos solo se unen si sus lunes están a 7 días; un punto aislado se dibuja como punto con su horquilla. El eje X es tiempo continuo, así que las semanas sin cotización quedan en blanco.
- **Aviso de dato atrasado**: la GVA publica cada semana el miércoles siguiente, 10 días después del domingo de la última semana que tenemos (el mismo `DIAS_DESFASE` de la ingesta). El navegador compara la fecha del dispositivo con ese domingo y, a partir de 11 días (el jueves, si el miércoles no salió la semana nueva), muestra «El dato de la semana N se retrasa: tenía que salir el miércoles D y aún no se ha publicado».
- **Accesibilidad**: el gráfico se anuncia como control deslizante con el precio de la semana señalada y un resumen de la serie; la tabla de datos es la alternativa completa. Objetivos táctiles de 44 px, `prefers-reduced-motion` y subida o bajada siempre con flecha y signo, no solo con color.
- **Astro 7.3 y no 7.4**: la 7.4 exige Node 22.22 o superior. `astro check` no se usa porque no funciona con TypeScript 7; por eso la lógica vive en `.ts` (comprobados con `npm run typecheck`) y los `.astro` solo pintan.

Para probar la web con los estados que no se dan con los datos de hoy (producto sin cotización esta semana), se puede construir con la muestra de los tests:

```sh
npm run ingesta -- --csv tests/fixtures/muestra.csv --actualizado-el 2021-05-12 --salida /tmp/datos-muestra --permitir-desfase
DATOS_DIR=/tmp/datos-muestra npm run build
```

Las capturas de verificación no van al repo (regla de capturas): se guardan fuera, en la caché local de quien verifica.

## Publicación

> **Pendiente (backend-expert, tarea B5):** workflow `publicar.yml`, rama `datos`, GitHub Pages y prueba manual de fallo de la fuente.
