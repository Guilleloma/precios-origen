# Precios en origen · Comunitat Valenciana

Web estática con los precios agrarios en origen de 36 productos valencianos (cítricos, fruta, uva de mesa, almendra, aceite y garrofa), semana a semana.

Datos: Generalitat Valenciana, Conselleria de Agricultura, [«Precios agrarios de origen de la Comunitat Valenciana»](https://dadesobertes.gva.es/es/dataset/agr-obs-pre-origen) (datos abiertos, CC BY 4.0). Web no oficial, sin relación con la Generalitat Valenciana.

Plan técnico y reglas de cálculo: [`docs/plan-tecnico.md`](docs/plan-tecnico.md). Qué productos trae el dataset, cuáles se publican y por qué: [`docs/inventario-productos.md`](docs/inventario-productos.md).

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
| `--url <url>` | Descarga el CSV de otra dirección. Por defecto, la de la GVA. El workflow la usa para la prueba de fallo de la fuente |
| `--permitir-desfase` | Si la fuente lleva 10 días o más sin datos, avisa en vez de fallar. Para trabajo local y para el primer arranque manual del workflow; la ejecución diaria nunca la usa |

Qué hace, en orden:

1. Descarga el CSV (hasta 3 reintentos con espera creciente) o lo lee de `--csv`.
2. Valida cabecera, formato de precios, productos, calendario de semanas, retroceso respecto a lo ya publicado en la carpeta de salida y desfase de la fuente.
3. Solo si todo pasa, escribe `series/<slug>.json` y, al final, `resumen.json`. Si el contenido es el mismo que el publicado (salvo `generadoEl`), no escribe nada.

Códigos de salida: `0` bien (con o sin cambios), `1` fallo de la fuente o de validación, `2` opción desconocida o error inesperado. Con `1`, el mensaje lleva el código del fallo:

| Código | Qué ha pasado |
|---|---|
| `DESCARGA_FALLIDA` | La descarga falló 4 veces: HTTP distinto de 200, menos de 1 MB, sin `Last-Modified`, no es UTF-8, tiempo agotado o fallo de conexión (el motivo va en el mensaje; en un fallo de conexión, con su causa de red, como `ECONNREFUSED` o `UND_ERR_CONNECT_TIMEOUT`) |
| `CSV_CABECERA_INESPERADA`, `CSV_FORMATO_INESPERADO`, `CSV_MAL_FORMADO`, `CSV_VACIO` | El CSV no tiene la forma esperada |
| `PRECIO_FORMATO_INESPERADO`, `PRECIO_INCOHERENTE` | Un precio de nuestras series no es `0,00` con coma y dos decimales, es cero, o mínimo > medio > máximo no se cumple |
| `PRODUCTO_SIN_FILAS`, `PRODUCTO_NOMBRE_INESPERADO` | Un producto configurado no tiene filas o su código de variedad ha cambiado de nombre |
| `DUPLICADO_SIN_CONTENEDORA`, `DUPLICADO_AMBIGUO` | Filas duplicadas con valores distintos que no se pueden resolver sin inventar |
| `CALENDARIO_SALTO`, `CALENDARIO_SEMANA_REPETIDA` | Falta una semana en el calendario global o dos caen en el mismo lunes |
| `RETROCESO_SEMANA`, `RETROCESO_SERIE` | La última semana es anterior a la publicada o una serie pierde más de 2 puntos |
| `DATOS_DESFASADOS` | Han pasado 10 días o más desde el domingo de la última semana |
| `PUBLICADO_ILEGIBLE` | Lo que ya hay en la carpeta de salida no es JSON válido |
| `OPCION_INVALIDA`, `CSV_NO_LEGIBLE` | Falta `--actualizado-el` con `--csv`, o no se puede leer el fichero |

## Productos

Se configuran solo en [`config/productos.ts`](config/productos.ts): añadir una variedad es añadir una entrada con `slug`, `categoria`, `nombre`, `codigoVariedad`, `codigoZona`, `nombreEsperado`, `unidad` y `posicion`. El inventario completo del dataset, el criterio de selección y lo que queda fuera están en [`docs/inventario-productos.md`](docs/inventario-productos.md).

| Categoría (`id`) | Productos (en el orden de la web) | Provincia | Posición comercial |
|---|---|---|---|
| Cítricos (`citricos`) | Naranja Navelina, Lane Late, Salustiana y Valencia Late; Clementina Clemenules y Oronules; Satsuma Clausellina/Okitsu; Mandarina Clemenvilla y Nadorcott; Limón Fino y Verna; Pomelo rojo | Una por producto: la de más semanas con dato en las dos últimas campañas (ver el inventario) | sobre árbol |
| Fruta (`fruta`) | Aguacate Hass, Albaricoque temprano, Caqui Rojo Brillante, Cereza Starking, Ciruela tipo Black, Granada Mollar, Higo negro, Manzana Fuji, Melocotón paraguayo, Melón piel de sapo, Nectarina amarilla, Níspero Algar, Sandía sin pepitas | Ídem | entrada almacén; el caqui, sobre árbol |
| Uva de mesa (`uva`) | Red Globe, Doña María, Moscatel Romano | Alicante | sobre cepa |
| Frutos secos (`frutos-secos`) | Almendra Comuna, Marcona, Largueta y Planeta | Alicante | grano, entrada descascaradora |
| Aceite y garrofa (`aceite-y-garrofa`) | Aceite de oliva virgen extra, virgen y lampante; Garrofa entera | Castellón | entrada almacén |

- **Categorías**: conjunto cerrado y con orden fijo, en `CATEGORIAS` de la misma configuración. Un producto con una categoría que no existe no compila.
- **Posición comercial**: el CSV no la trae. Sale de la descripción del dataset y del pie del informe semanal de la GVA, y va en constantes de la configuración. Todo en €/kg sin IVA.
- **Fuera de campaña**: la mayoría de la fruta cotiza unas semanas al año. Un producto sin fila en la última semana sale con «Sin cotización desde la sem. N» y no hace fallar la ingesta: el desfase de la fuente (`DATOS_DESFASADOS`) se mide sobre la última semana de todo el CSV, no por producto.
- **Tests**: la muestra de los tests (`tests/fixtures/muestra.csv`, 2020–2021) solo trae filas de los siete productos del MVP, así que los tests de la ingesta usan esa lista (`PRODUCTOS_MUESTRA` en `tests/factorias.ts`). Los productos nuevos se comprueban contra el CSV real con `npm run ingesta -- --csv <ruta> --actualizado-el <fecha> --permitir-desfase`.

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
  "categorias": [
    { "id": "citricos", "etiqueta": "Cítricos" },
    { "id": "fruta", "etiqueta": "Fruta" },
    { "id": "uva", "etiqueta": "Uva de mesa" },
    { "id": "frutos-secos", "etiqueta": "Frutos secos" },
    { "id": "aceite-y-garrofa", "etiqueta": "Aceite y garrofa" }
  ],
  "productos": [
    {
      "slug": "naranja-navelina",
      "nombre": "Naranja Navelina",
      "categoria": "citricos",
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
| `categorias` | Todas las categorías, en el orden en que se muestran, con `id` y `etiqueta` en español. **Añadido en la ampliación de productos** (cambio compatible: el esquema sigue en 1) |
| `productos` | Agrupados por categoría en el orden de `categorias` y, dentro de cada una, en el orden de `config/productos.ts`. Para pintar la lista por grupos basta con recorrer `categorias` y filtrar `productos` por `categoria`, sin reordenar |
| `categoria` | `id` de la categoría del producto (tipo `CategoriaId`). Añadido con `categorias` |
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
| Variación tras hueco de 1 a 3 semanas | `variacion` y `anterior.lunes` a más de 7 días | «… respecto a la sem. `respectoA.semana` de `respectoA.anyo`» |
| Primera cotización tras un hueco de 4 semanas o más | `cotizaEstaSemana`, `variacion === null` y `anterior` | «Primera cotización desde la sem. `anterior.semana` de `anterior.anyo`» |
| Primera cotización de la serie | `cotizaEstaSemana`, `variacion === null` y `anterior === null` | Sin variación (no pasa con los datos actuales) |
| Sin cotización esta semana | `cotizaEstaSemana === false` (`variacion` es `null`) | Precio atenuado y «Sin cotización desde la sem. `ultimo.semana` de `ultimo.anyo` (mes de `ultimo.lunes`)» |

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

Cada punto es `[lunes, año, semana, mínimo, medio, máximo]`. Tamaño con los datos de noviembre de 2026 y 36 productos: de 1 a 19 KB por serie (290 KB en total, 40 KB comprimido) y 22 KB el resumen. Los JSON no se sirven al navegador: el build los lee y los pinta en el HTML (la portada pesa 71 KB, 9 KB comprimida).

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
| `SITIO_URL` | Dominio de publicación (`https://<usuario>.github.io`). Sin él, la imagen de la vista previa sale con ruta relativa y WhatsApp no la enseña. El workflow de publicación lo saca de GitHub Pages | sin definir |
| `RUTA_BASE` | Ruta base de la web. El workflow también la saca de GitHub Pages | `/precios-origen/` |

La dirección de publicación no se escribe en el código porque lleva el usuario de GitHub.

Los scripts desactivan la telemetría de Astro (`ASTRO_TELEMETRY_DISABLED=1`). El build no genera source maps, no carga nada de otros dominios (tipografías del sistema) y marca todas las páginas con `noindex`.

### Páginas

| Ruta | Qué muestra |
|---|---|
| `/` | Productos agrupados por categoría (`categorias`, en su orden), con una fila de accesos a cada categoría y una línea con cuántos tienen precio en la semana. Cada fila: precio medio, variación con flecha y signo, provincia, posición, semana y minigráfica de 52 semanas |
| `/<slug>/` | Detalle: ruta hasta su categoría en la portada, precio, horquilla, atribución completa, gráfico con rangos de 6 meses, 1 año, 3 años y todo, y tabla con todas las semanas |
| `/sobre-los-datos/` | Fuente, licencia, qué es el precio medio, provincia y posición de cada producto por categorías (sale de `resumen.json`), por qué muchos productos no tienen precio parte del año y cómo se calcula la variación |

### Estructura de `src/`

```
src/
├── datos/        # cargar.ts lee data/ en el build (valida el esquema); rutas.ts une rutas con la base;
│                 # categorias.ts agrupa la portada por categoría
├── formato/      # funciones puras en es-ES: precios, fechas, variación y estado de cada fila,
│                 # recuentos por categoría, aviso de dato atrasado y textos de la vista previa al compartir
├── grafico/      # funciones puras del gráfico (tramos, escalas, trazados, rangos, lectura)
│                 # e interaccion.ts, lo único que corre en el navegador junto con el aviso
├── componentes/  # SeccionCategoria, NavCategorias, FilaProducto, NombreProducto, Minigrafica, Variacion,
│                 # Grafico, SelectorRango, TablaDatos, Atribucion, AvisoAtraso
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
- **Portada por categorías** (`agruparPorCategoria`): una sección por categoría con encabezado `h2`, el número de productos y cuántos tienen precio en la semana. Dentro de cada una, primero los que cotizan y después, bajo «Sin precio en la sem. N», los que no, atenuados (nombre y precio en gris; en el móvil sin minigráfica) y con «Sin cotización desde la sem. N de AAAA (mes)» y su último precio. Los dos grupos conservan el orden del contrato. Las categorías sin productos no salen; un producto con una categoría que no está en `categorias` rompe el build.
- **Accesos a las categorías**: anclas `#categoria-<id>` (funcionan sin JavaScript) en una fila que se queda fija arriba y, si no cabe, se desplaza en horizontal dentro de sí misma, sin mover la página. El detalle enlaza a la misma ancla.
- **Semana de referencia, no «esta semana»**: los recuentos dicen «en la semana 44» o «en la sem. 44» para cuadrar con el aviso de dato atrasado, que cuenta qué semana se está viendo cuando la siguiente se retrasa.
- **Vista previa de la portada**: el título dice cuántos productos hay y la descripción, las categorías y cuántos tienen precio en la semana (ya no enumera los precios, que con 36 no caben). Cada detalle mantiene su título con el último precio.
- **Nombres largos**: `NombreProducto` deja partir el nombre tras la barra («Satsuma Clausellina/Okitsu»), para que en 360 px no se corte por cualquier letra.
- **Astro 7.3 y no 7.4**: la 7.4 exige Node 22.22 o superior. `astro check` no se usa porque no funciona con TypeScript 7; por eso la lógica vive en `.ts` (comprobados con `npm run typecheck`) y los `.astro` solo pintan.

Para probar la web con otros datos (por ejemplo, los siete productos del MVP en 2021), se puede construir con la muestra de los tests:

```sh
npm run ingesta -- --csv tests/fixtures/muestra.csv --actualizado-el 2021-05-12 --salida /tmp/datos-muestra --permitir-desfase
DATOS_DIR=/tmp/datos-muestra npm run build
```

Las capturas de verificación no van al repo (regla de capturas): se guardan fuera, en la caché local de quien verifica.

## Publicación

La web se publica en GitHub Pages con el workflow [`publicar.yml`](.github/workflows/publicar.yml), sin secretos: le basta el `GITHUB_TOKEN`. La dirección es `https://<usuario>.github.io/precios-origen/`, pero el workflow la lee de la configuración de Pages (`actions/configure-pages`), así que el usuario no aparece en el código.

### Cómo funciona

| Job | Qué hace | Permisos |
|---|---|---|
| `ingesta` | Ejecuta la ingesta sobre la rama `datos` con [`scripts/ci/actualizar-datos.sh`](scripts/ci/actualizar-datos.sh). Si hay datos nuevos, hace el commit `Datos: semana 45 de 2026` como `github-actions[bot]` y lo sube; si no, no toca nada. Si la rama no existe, la crea huérfana | `contents: write` |
| `construir` | `main` + rama `datos` → `npm ci`, tests y tipos → `npm run build` con `SITIO_URL` y `RUTA_BASE` de Pages → [`scripts/ci/comprobar-build.sh`](scripts/ci/comprobar-build.sh) comprueba que cada página lleva la vista previa con dirección absoluta y que no hay source maps | `contents: read`, `pages: read` |
| `desplegar` | Publica el build en GitHub Pages (entorno `github-pages`) | `pages: write`, `id-token: write` |

Cuándo corre y qué publica:

| Disparador | Ingesta | Publica |
|---|---|---|
| Cada día a las 16:30 UTC | Sí | Solo si hay datos nuevos. Sin datos nuevos, ni commit ni despliegue |
| Push a `main` | Sí | Siempre, porque hay código nuevo: con los datos nuevos o, si la ingesta falla, con los últimos de `datos`. La ejecución queda en rojo igualmente, para que el fallo de la fuente no pase desapercibido |
| A mano | Sí | Si la ingesta termina bien, haya datos nuevos o no: sirve para republicar |

- La GVA publica los miércoles a mediodía. Los demás días la ejecución termina en un minuto sin hacer nada. GitHub puede retrasar las ejecuciones programadas varios minutos.
- Una sola ejecución a la vez (`concurrency`), para que dos ingestas no se pisen al subir a `datos`.
- La rama `datos` solo tiene `resumen.json`, `series/` y un README. Su historial guarda cada semana y cada revisión de la GVA. Los commits del bot no lanzan el workflow otra vez.
- Node 24 en el runner. Las acciones están fijadas por SHA de commit, con la versión en un comentario; para actualizar una, se cambian los dos juntos (el SHA de una versión sale con `git ls-remote https://github.com/actions/<acción> refs/tags/<versión>`).

### Lanzarlo a mano

En GitHub, Actions › Publicar › Run workflow, o con `gh workflow run publicar.yml` (añadiendo `-f permitir_desfase=true` o `-f probar_fallo_fuente=true` si hace falta).

| Entrada | Por defecto | Para qué |
|---|---|---|
| `permitir_desfase` | no | **Solo para el primer arranque.** Publica aunque la GVA lleve 10 días o más sin semana nueva (`DATOS_DESFASADOS`). La ejecución diaria nunca la usa |
| `probar_fallo_fuente` | no | Prueba de fallo: descarga de una dirección de la GVA que no existe (ver abajo) |

### Si falla

GitHub manda un correo de la ejecución fallida. La anotación de error y el resumen de la ejecución dicen qué ha pasado. **Si falla la ingesta, no se sube nada a `datos` y la web sigue con el último dato bueno.**

| Error | Qué ha pasado | Qué hacer |
|---|---|---|
| `DESCARGA_FALLIDA` | No se puede descargar el CSV; el formato ni se ha llegado a comprobar. El mensaje lleva el motivo: código HTTP, tiempo agotado o causa de red (`ECONNREFUSED`, `UND_ERR_CONNECT_TIMEOUT`…) | Si es un día suelto, nada: se reintenta al día siguiente. Si falla todos los días por la red, la GVA puede estar bloqueando las IP de GitHub: plan B del plan técnico (ejecutar la ingesta desde una máquina de casa y subir la rama `datos`) |
| `DATOS_DESFASADOS` | La GVA no ha publicado la semana nueva: han pasado 10 días o más desde el domingo de la última | Esperar. Pasa con algún miércoles festivo; la web avisa del retraso a partir del jueves |
| `CSV_*`, `PRECIO_*`, `PRODUCTO_*`, `DUPLICADO_*`, `CALENDARIO_*` | El CSV ha cambiado de formato o de contenido | Descargar el CSV, reproducir con `npm run ingesta -- --csv <ruta> --actualizado-el <fecha>` y adaptar la ingesta o `config/productos.ts` |
| `RETROCESO_SEMANA`, `RETROCESO_SERIE` | El CSV trae menos datos que lo ya publicado | Revisar a mano: puede ser una revisión de la GVA o un fichero roto |
| «No hay datos que publicar» | Push a `main` sin rama `datos`: la ingesta no ha terminado bien nunca | Ver «Primer arranque» |
| Tests, tipos o comprobación del build | Fallo del código | Arreglarlo en una rama y mergear a `main`, que publica |
| Despliegue | Fallo de GitHub Pages | Relanzar a mano |

Si la ingesta sube datos nuevos pero luego falla el build o el despliegue, la ejecución del día siguiente ya no tiene datos nuevos y no republica: tras arreglarlo, lanzarlo a mano.

### Primer arranque

1. Crear el repo público `precios-origen` y activar Pages con origen **GitHub Actions**: Settings › Pages › Build and deployment › Source «GitHub Actions», o `gh api -X POST repos/<usuario>/precios-origen/pages -f build_type=workflow`. Sin esto, el job `construir` falla en el paso «Dirección de GitHub Pages».
2. Subir `main`. El push lanza el workflow, que crea la rama `datos`, la llena y publica.
3. Si la ingesta falla con `DATOS_DESFASADOS` porque la GVA aún no ha publicado la semana nueva, lanzarlo a mano con `permitir_desfase`: publica la última semana disponible y la ejecución diaria se pone al día en cuanto salga la nueva.
4. Comprobar que llegan los correos de las ejecuciones fallidas (en la cuenta de GitHub, Settings › Notifications › Actions).

### Prueba de fallo de la fuente

Lanzarlo a mano con `probar_fallo_fuente`. Resultado esperado:

- El job `ingesta` falla en algo más de un minuto, tras 4 intentos, con `DESCARGA_FALLIDA` y «HTTP 404».
- `construir` y `desplegar` no se ejecutan.
- La rama `datos` no tiene commit nuevo y la web sigue igual (misma semana y mismo «actualizado el»).

### Revisión de enero de 2027

2026 tiene 53 semanas ISO y la GVA puede numerar la última como semana 53 de 2026 o como semana 1 de 2027, como pasó en 2021 (regla 1 del plan técnico). La ingesta detecta un calendario incoherente (`CALENDARIO_SALTO`, `CALENDARIO_SEMANA_REPETIDA`), pero **hay que revisar la web a mano la primera semana de enero de 2027**, cuando salga el dato de la semana del 28 de diciembre al 3 de enero: número de semana, fecha del rótulo y que el gráfico no tenga un hueco ni un salto de una semana.
