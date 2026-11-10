# Precios en origen: plan técnico

Fecha: 2026-11-10 · Autor: superdev · Entrada: `docs/one-pager.md` · Estado: listo para ejecutar

## 1. Resumen

- **Sitio estático** (Astro + TypeScript), sin base de datos, sin servidor y sin secretos.
- **Una tarea diaria de GitHub Actions** descarga el CSV de la GVA, lo valida, genera el JSON y publica en **GitHub Pages**. Si no hay dato nuevo, no hace nada.
- **Si la fuente falla o cambia**, la tarea falla, GitHub avisa por correo y la web sigue con el último dato bueno.
- **Siete productos** por configuración: los seis del one-pager y el limón Fino, que sale sin coste.
- Nombre propuesto: repo `precios-origen`, título «Precios en origen · Comunitat Valenciana».

## 2. El dataset, comprobado el 2026-11-10

| Aspecto | Dato real |
|---|---|
| URL del CSV | `https://dadesobertes.gva.es/dataset/19178f38-7694-4dbc-9f10-a5c3f2248786/resource/1e89904a-358a-4fe1-8b47-322d7b9c79a6/download/precios-agrarios-de-origen-de-la-comunitat-valenciana.csv` |
| Tamaño | 6,5 MB, 41.617 filas, 469 semanas (de la 45 de 2017 a la 44 de 2026) |
| Formato | UTF-8 sin BOM, saltos `\n`, separador `;`, textos entre comillas dobles, **decimal con coma y siempre dos decimales** (`0,27`) |
| Columnas (17) | `anyo_precio; semana_precio; codigo_grupo_producto; grupo_producto_castellano; grupo_producto_valenciano; codigo_producto; producto_castellano; producto_valenciano; codigo_variedad; variedad_castellano; variedad_valenciano; codigo_zona; zona_castellano; zona_valenciano; precio_minimo; precio_medio; precio_maximo` |
| Zonas | `03` Alicante, `12` Castellón, `46` Valencia |
| Semanas sin cotización | **No hay fila.** No existen precios vacíos ni a cero |
| Fecha de actualización | Cabecera `Last-Modified` del CSV (4 nov 2026, 14:21 UTC). Los informes semanales de las semanas 38, 42 y 44 se publicaron en miércoles por la mañana |
| Unidad y posición | Confirmadas en la descripción del propio dataset: €/kg sin IVA; cítricos en árbol; almendra en grano a la entrada de la descascaradora; aceite y garrofa a la entrada del almacén |

**Filtro de cada producto:** `codigo_variedad` + `codigo_zona`. Cada código de variedad tiene un único nombre en todo el fichero, así que no hay ambigüedad.

| Slug | Nombre | `codigo_variedad` | Provincia (`codigo_zona`) | Semanas con dato | Posición |
|---|---|---|---|---|---|
| `naranja-navelina` | Naranja Navelina | 85 | Valencia (46) | 182 | sobre árbol |
| `clementina-clemenules` | Clementina Clemenules | 3 | Castellón (12) | 185 | sobre árbol |
| `almendra-comuna` | Almendra Comuna | 23 | Alicante (03) | 435 | grano, entrada descascaradora |
| `almendra-marcona` | Almendra Marcona | 40 | Alicante (03) | 435 | grano, entrada descascaradora |
| `garrofa` | Garrofa entera | 165 | Castellón (12) | 351 | entrada almacén |
| `aceite-virgen-extra` | Aceite de oliva virgen extra | 76 | Castellón (12) | 455 | entrada almacén |
| `limon-fino` | Limón Fino | 355 | Alicante (03) | 252 | sobre árbol |

Por qué esas provincias: la garrofa, el aceite y el limón solo cotizan en una. En la almendra, Alicante tiene la serie completa (Valencia solo unas 10 semanas al año y siempre sin horquilla). En la Navelina, Valencia tiene campañas continuas y siempre con horquilla (Castellón tiene la mitad de semanas). En la Clemenules, Castellón es la serie más larga. Ojo con el limón: los códigos 191 («Fino/Primofiori 1 corte») y 57 («Redrojo») son otras series; se usa el 355.

### Lo que no cuadra con el one-pager

1. **Hay filas duplicadas.** 1.362 claves (año, semana, variedad, zona) aparecen dos o tres veces, un 3,4 % del fichero. Casi todas son idénticas, pero 34 traen valores distintos, dos de ellas en nuestros productos. Contrastado con el Excel oficial de la semana 42 de 2026: la fila correcta es la de **horquilla más ancha** (Navelina en Castellón: 0,25–0,30; la duplicada decía 0,25–0,25).
2. **La garrofa tiene 351 semanas con dato, no 408.** Las 408 eran filas, con duplicados.
3. **La semana no es ISO en 2021.** No existe la semana 53 de 2020 y 2021 va de la 1 a la 53: todo 2021 está desplazado una semana respecto a ISO (la «semana 1 de 2021» es del 29 dic 2020 al 4 ene 2021). Además, en 2020 y 2021 las semanas iban de martes a lunes; en 2026 van de lunes a domingo. **2026 vuelve a tener 53 semanas ISO, así que puede repetirse en enero de 2027.**
4. **El «precio medio» es el punto medio de la horquilla**, truncado al céntimo. El informe oficial solo publica mínimo y máximo. No es una media ponderada. Se muestra tal cual y se explica en «Sobre los datos».
5. **La API no aporta nada.** `datastore_search` devuelve todos los campos como texto (el orden por semana sale alfabético) y `datastore_search_sql` cortó la conexión. Se usa la descarga del CSV, que es el recurso primario.
6. Hay 4 filas con mínimo > medio o medio > máximo y precios de más de 10 €, todas en productos que no usamos.

## 3. Arquitectura

```
GitHub Actions (cada día, 16:30 UTC)
  ingesta: descarga CSV → valida → genera JSON → push a la rama `datos` (solo si cambia)
  publicar: main + rama `datos` → tests → astro build → GitHub Pages
```

| Decisión | Elección | Motivo |
|---|---|---|
| Framework | **Astro en modo estático**, TypeScript, sin React | Genera una página HTML por producto, con su Open Graph, y casi nada de JavaScript. La lista sale sin JS |
| Gráfico | **SVG propio** (TypeScript sin librería) | Son 470 puntos. Hace falta controlar los huecos, la banda, el tacto en el móvil y el tema por CSS, que es justo donde las librerías dan guerra. Las funciones son puras y se testean. El mismo código dibuja la minigráfica de la lista en el build |
| Ingesta | Script de Node 24 en TypeScript, **sin dependencias** | El CSV es simple; un parser propio de 30 líneas con tests evita una dependencia |
| Datos | JSON en la **rama `datos`**, no en `main` | Queda el último dato bueno y el historial de revisiones de la GVA, sin commits automáticos en `main` (regla de git) |
| Hosting | **GitHub Pages** desplegado desde el mismo workflow | Una sola plataforma, cero secretos y cero integraciones. Un push hecho con `GITHUB_TOKEN` no dispara otros workflows, por eso ingesta y publicación son dos jobs del mismo workflow |
| Frecuencia | **Diaria**, a las 16:30 UTC | La GVA publica el miércoles a mediodía. Comprobar cada día cubre retrasos y festivos, y cuesta un minuto de Actions. Sin cambios no hay commit ni despliegue |
| Tests | Vitest | Para la ingesta y para las funciones del gráfico |
| Sin | Analítica, cookies, fuentes externas, source maps | Nada de terceros: no hace falta aviso de cookies |

El workflow `publicar.yml` se dispara con `schedule`, `workflow_dispatch` y `push` a `main`. El job de ingesta solo corre en los dos primeros; un push de código publica con los datos que ya hay en `datos`.

### Contrato de datos (rama `datos`, carpeta `data/` en el build)

`data/resumen.json`:

```json
{
  "esquema": 1,
  "generadoEl": "2026-11-04T16:31:10Z",
  "fuente": { "actualizadoEl": "2026-11-04", "urlDataset": "https://dadesobertes.gva.es/es/dataset/agr-obs-pre-origen" },
  "ultimaSemana": { "anyo": 2026, "semana": 44, "lunes": "2026-10-26", "domingo": "2026-11-01" },
  "productos": [{
    "slug": "naranja-navelina", "nombre": "Naranja Navelina", "provincia": "Valencia",
    "unidad": "€/kg", "posicion": "sobre árbol",
    "cotizaEstaSemana": true,
    "ultimo": { "anyo": 2026, "semana": 44, "lunes": "2026-10-26", "min": 0.20, "medio": 0.27, "max": 0.34 },
    "variacion": { "euros": 0.01, "porcentaje": 3.8, "respectoA": { "anyo": 2026, "semana": 43 } }
  }]
}
```

`data/series/<slug>.json`: `{ "slug": "...", "puntos": [["2017-11-06", 2017, 45, 0.17, 0.20, 0.23], ...] }`, con `[lunes, año, semana, mín, medio, máx]`, ordenado por fecha y **solo con las semanas que tienen cotización**. `variacion` es `null` cuando no aplica. `anyo` y `semana` son siempre los que publica la GVA; `lunes` es la fecha calculada.

`config/productos.ts` es la única lista editable: `slug`, `nombre`, `codigoVariedad`, `codigoZona`, `nombreEsperado`, `unidad`, `posicion`. **Añadir una variedad es añadir una entrada.**

### Si la fuente falla o cambia

La ingesta valida antes de escribir. Si algo falla, sale con error, no toca `datos` y no se publica: la web sigue con el último dato bueno y GitHub manda un correo al dueño del workflow.

| Comprobación | Falla si |
|---|---|
| Descarga | HTTP distinto de 200, menos de 1 MB o tiempo agotado (3 reintentos con espera creciente) |
| Cabecera | No son exactamente las 17 columnas de arriba |
| Formato | Un precio de nuestras series no cumple `^\d+,\d{2}$`, o mínimo > medio o medio > máximo |
| Productos | Un producto configurado no tiene filas, o su `variedad_castellano` no contiene `nombreEsperado` (detecta códigos reasignados) |
| Semanas | Tras convertirlas a fechas, hay semanas repetidas o un salto en el calendario global |
| Retroceso | La última semana es anterior a la ya publicada, o una serie pierde más de 2 puntos respecto a `datos` |
| Desfase | Han pasado 10 días o más desde el domingo de la última semana (la fuente lleva una semana sin actualizar) |

La web, además, muestra un aviso por su cuenta: un script mínimo compara la fecha de hoy con `ultimaSemana.domingo` y, si han pasado 11 días o más, pinta «El dato de la semana N se retrasa: tenía que salir el miércoles D y aún no se ha publicado». La semana siguiente sale normalmente el miércoles, día 10 (el mismo umbral que el desfase de arriba); el aviso espera a que acabe ese miércoles, así que aparece desde el jueves y nunca en una semana normal.

## 4. Reglas de cálculo

1. **Fecha de una semana.** Lunes ISO de (año, semana), con una corrección: si el año anterior tiene 53 semanas ISO y el CSV no trae su semana 53, a todo ese año se le resta una semana (caso 2021, y quizá 2027). Casos de test: 2021-1 → 2020-12-28; 2021-53 → 2021-12-27; 2022-1 → 2022-01-03; 2026-44 → 2026-10-26. La validación de «semanas sin saltos» detecta cualquier otra rareza.
2. **Rótulo de fecha.** El rango exacto «26 oct–1 nov 2026» solo se muestra en la última semana. En el histórico se muestra «sem. 12 de 2021», porque los límites exactos variaron un día en años anteriores.
3. **Duplicados.** Filas idénticas: se queda una. Filas distintas: se queda la fila cuya horquilla contiene a las demás. Si ninguna las contiene, la ingesta falla (no ha pasado nunca en nuestras series). Nunca se promedian ni se inventan valores.
4. **Provincia.** Una fija por producto, la de la tabla de la sección 2, y se rotula siempre junto al precio.
5. **Semana de referencia.** La última semana presente en el CSV para cualquier producto. Un producto «cotiza esta semana» si tiene fila en ella.
6. **Variación semanal.** Se calcula en céntimos enteros contra la cotización anterior de la misma serie.
   - Semana anterior con dato: variación normal.
   - Hueco de 1 a 3 semanas: se compara con la última cotización y se rotula «respecto a la sem. N».
   - Hueco de 4 semanas o más: sin variación; se muestra «Primera cotización desde la sem. N».
   - Porcentaje con un decimal; euros con dos. Se rotula como cálculo propio, no como dato de la GVA.
7. **Sin cotización esta semana.** La fila muestra el último precio atenuado y «Sin cotización desde la sem. N (mes año)», sin variación. No se infiere si es fin de campaña: el texto es el mismo para todos.
8. **Gráfico.**
   - Línea = precio medio. Banda = área entre mínimo y máximo.
   - Dos puntos se unen solo si están a 7 días exactos. Cualquier semana sin dato corta la línea y la banda; no se interpola. Un punto aislado se dibuja como punto.
   - El eje X es tiempo continuo, así que los huecos se ven como espacio vacío.
   - El eje Y se ajusta a mínimo y máximo visibles con margen; no empieza en cero.
   - Rangos: 26, 52 y 156 semanas y todo, contados **desde la semana de referencia** (un producto fuera de campaña enseña el vacío a la derecha). Por defecto, 1 año. Si el rango no tiene puntos: «Sin cotizaciones en este periodo» y botón a «Todo».
   - Al tocar: semana, mínimo, medio y máximo del punto más cercano.
9. **Formato.** `es-ES`: «0,27 €/kg», «+0,01 € (+3,8 %)». El signo va siempre con flecha y símbolo, no solo con color.

## 5. Tareas

Orden: B1–B4 → F1–F5 → B5 → QA → cicd. Cada tarea es un commit atómico (o dos) de menos de 500 líneas, en la rama `feature/mvp-precios-origen`.

### backend-expert

| # | Tarea | Verificable por | Tests mínimos |
|---|---|---|---|
| B1 | Esqueleto: `package.json`, TypeScript, Vitest, `.gitignore` (`data/`, `dist/`, `.env*`), `config/productos.ts` con los 7 productos, `CLAUDE.md` con «Datos públicos intencionados: ninguno» | `npm test` arranca | La configuración no tiene slugs ni pares variedad+zona repetidos |
| B2 | Parser del CSV y calendario de semanas (`scripts/ingesta/csv.ts`, `semanas.ts`) | Tests | Comillas con `;` y `,` dentro; decimal con coma; cabecera incorrecta → error. Los cuatro casos de fecha de la regla 1 y un año normal |
| B3 | Selección, duplicados y validaciones (`series.ts`, `validar.ts`) | Tests con `tests/fixtures/muestra.csv` (recorte real de unas 300 filas con duplicados y el cambio de año 2020–2021) | Duplicado idéntico; duplicado con fila contenedora; sin contenedora → error; nombre que no coincide → error; cada fila de la tabla de validaciones |
| B4 | Resumen, variación y escritura del JSON; comando `npm run ingesta` (acepta `--csv <ruta>` para trabajar sin red) | `npm run ingesta` deja `data/resumen.json` y 7 series; Navelina sem. 44 de 2026 = 0,20 / 0,27 / 0,34 | Variación con semana anterior, con hueco de 1 a 3, con hueco de 4 o más y con producto que no cotiza; instantánea del JSON generado desde la muestra; fallo de descarga → código de salida distinto de 0 y `data/` intacto |
| B5 | Workflow `publicar.yml`: ingesta → rama `datos` → tests → build → Pages. Permisos mínimos por job (`contents: write` solo en ingesta; `pages: write` e `id-token: write` solo en publicar) | Ejecución manual en verde y web publicada; segunda ejecución sin cambios no hace commit | Prueba manual documentada en el README: con una URL de CSV errónea, el job falla y la web no cambia |

Notas para B5: crea la rama `datos` huérfana si no existe. Los commits del bot llevan el mensaje `Datos: semana 45 de 2026` y solo van a `datos`. **Lo primero es comprobar que el runner de GitHub puede descargar el CSV** (desde aquí responde sin `User-Agent` especial; no se ha podido probar desde las IP de GitHub).

### frontend-expert

| # | Tarea | Verificable por | Tests mínimos |
|---|---|---|---|
| F1 | Astro, layout, tokens de color (claro y oscuro con `prefers-color-scheme`), tipografía del sistema, pie legal y sección «Sobre los datos» | `npm run build` genera `dist/`; captura en claro y oscuro a 375 px | `astro check` sin errores |
| F2 | Lista: fila por producto con nombre, precio medio, variación, unidad y posición, provincia, semana y minigráfica de 52 semanas en SVG generada en el build. Estados: cotiza, sin cotización, sin variación | Capturas de los tres estados (con la muestra) | Formato de precio, de variación y de los textos de estado |
| F3 | Funciones puras del gráfico (`src/grafico/`): segmentos, escalas, trazados de línea y banda, filtro por rango, punto más cercano | Tests | Serie continua → 1 segmento; hueco → 2; punto aislado; rango vacío; mínimo = máximo |
| F4 | Página de detalle `/<slug>/`: gráfico interactivo (ratón, tacto y teclado), selector de rango, cabecera con precio y atribución completa, tabla de datos en un `<details>` | Capturas de los 4 rangos en móvil; se maneja con teclado | Los de F3 cubren la lógica; aquí, el selector de rango |
| F5 | Open Graph (título y descripción con el último precio por página, `og.png` de 1200×630 y menos de 300 KB enlazada desde el layout), aviso de dato atrasado, `noindex`, favicon y repaso de accesibilidad | Etiquetas en el HTML de `dist/`; aviso visible simulando la fecha | Función del aviso: 10 días (miércoles) → no; 11 días (jueves) → sí |

Requisitos de front que no se negocian:
- **Atribución en cada precio**: «Fuente: Generalitat Valenciana, Conselleria de Agricultura (datos abiertos, CC BY 4.0) · Castellón · semana 44 (26 oct–1 nov 2026) · actualizado el 4 nov 2026», con enlace al dataset. En la lista puede ir abreviada por fila (provincia y semana) y completa una vez bajo la lista.
- **Pie**: «Web no oficial, sin relación con la Generalitat Valenciana».
- **«Sobre los datos»**: precio semanal, no diario; el medio es el punto medio de la horquilla que publica la GVA; provincia de cada producto; la variación es un cálculo propio.
- **Accesibilidad**: contraste AA en los dos temas, objetivos táctiles de 44 px, el gráfico con texto alternativo que resume la serie y la tabla como alternativa, y `prefers-reduced-motion`.
- Las rutas internas usan `import.meta.env.BASE_URL`, porque Pages publica bajo `/precios-origen/`.

## 6. Riesgos y lo que QA debe mirar

| Riesgo | Mitigación |
|---|---|
| Enero de 2027: la GVA puede numerar la última semana de 2026 como 53 o como 1 de 2027 | Regla 1 y validación de saltos. Revisar la web a mano la primera semana de enero |
| La GVA bloquea las IP de GitHub Actions | Se comprueba al empezar B5. Plan B: lanzar la misma ingesta desde una Raspberry de casa |
| GitHub desactiva los workflows programados tras 60 días sin actividad en el repo | Los commits semanales en `datos` cuentan como actividad |
| Cambian los códigos de variedad o las columnas | Validaciones de cabecera y de `nombreEsperado` |
| El correo de aviso no llega | Comprobar una vez que las notificaciones de Actions están activas (prueba de B5) |

**QA, además de su pirámide habitual:**
1. **Datos**: tres precios de la web contra el CSV y contra el Excel oficial de la misma semana (Navelina, garrofa y aceite). Deben coincidir al céntimo.
2. **Huecos**: la garrofa en «Todo» enseña cortes, no líneas que crucen semanas sin dato.
3. **Licencia**: atribución, provincia, semana y fecha en cada precio; pie de web no oficial.
4. **Móvil** a 375 px en claro y en oscuro; vista previa del enlace (etiquetas Open Graph y peso de la imagen).
5. **Fallo de la fuente**: la prueba manual de B5.
6. **Seguridad y datos personales**:
   - El `dist/` no contiene nombre, correo, teléfono ni nada de Guillermo; `package.json` sin `author`.
   - **El repo es público**: los commits deben ir con el correo `noreply` de GitHub, no con el personal. Comprobar con `git log --format='%ae' | sort -u` antes del primer push.
   - Sin secretos, sin `.env`, sin source maps, sin peticiones a terceros (ni fuentes ni analítica), sin EXIF en `og.png`.
   - Los textos del CSV se pintan escapados (nada de `set:html`).
   - Acciones de terceros fijadas por versión y permisos mínimos del workflow. `npm audit` sin altas ni críticas.
7. **Higiene**: capturas en `~/.cache/claude-shots/precios-origen/feature-mvp-precios-origen/`, nunca en el repo.

## 7. Nombre y estructura

- **Repo**: `precios-origen` (público). Carpeta local: renombrar `~/development/materias-primas` a `~/development/precios-origen` al inicializar git (lo hace cicd).
- **URL inicial**: `https://<usuario>.github.io/precios-origen/`.

```
precios-origen/
├── .github/workflows/publicar.yml
├── config/productos.ts          # única lista editable de productos
├── scripts/ingesta/             # csv.ts, semanas.ts, series.ts, validar.ts, resumen.ts, main.ts
├── src/
│   ├── grafico/                 # funciones puras y componente SVG
│   ├── componentes/             # FilaProducto, Atribucion, AvisoAtraso, SelectorRango
│   ├── formato/                 # precios, variación y fechas en es-ES
│   ├── layouts/Base.astro
│   └── pages/index.astro, [slug].astro
├── public/og.png, favicon.svg
├── tests/fixtures/muestra.csv   # recorte real del CSV (CC BY)
├── data/                        # generado; ignorado en main; vive en la rama `datos`
├── docs/one-pager.md, plan-tecnico.md
├── CLAUDE.md, README.md
```

## 8. Decisiones para Guillermo

Solo dos, y las dos tienen opción por defecto para no bloquear:

1. **Repo público en GitHub Pages** (recomendado: gratis y sin secretos). La dirección lleva el usuario de GitHub. Alternativa: repo privado y despliegue en Vercel, a cambio de guardar un token de Vercel como secreto.
2. **Provincia de referencia de cada producto** (tabla de la sección 2). Si los colegas son de otra zona, por ejemplo almendra en Castellón o Navelina en Alicante, es cambiar una línea de configuración.
