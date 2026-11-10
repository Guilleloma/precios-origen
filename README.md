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

> **Pendiente (frontend-expert, tareas F1–F5):** comandos de la web, estructura de `src/`, cómo lee `data/` en el build y capturas de verificación.

## Publicación

> **Pendiente (backend-expert, tarea B5):** workflow `publicar.yml`, rama `datos`, GitHub Pages y prueba manual de fallo de la fuente.
