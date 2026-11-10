# Cotizaciones de materias primas agrícolas: one-pager de discovery

Fecha: 2026-11-10 (v2) · Autor: product-manager (Atlas) · Estado: discovery, pendiente de las dos preguntas finales

## 1. Problema y alcance

Guillermo lo pidió así: «una aplicación web que me mida el valor de materia prima tipo olivos, algarrobos, naranjas, almendros… etc y que se vea tipo stock price». Después aclaró: «quiero algo que le pueda pasar a alguien y pueda ver esta información». Ese «alguien» son colegas que quieren ver los precios.

**Decidido por Guillermo:**
- **Web pública de solo lectura** a la que se entra con un enlace, sin registro, y que se vea bien en el **móvil**, porque el enlace se pasará por WhatsApp.
- Es para colegas: **no es un producto comercial**. No hay captación, cuentas ni monetización.

**Supuesto, sin validar:** lo que interesa es el **precio en origen** (lo que cobra el agricultor) en €/kg, con referencias valencianas.

**Lo que hay que saber antes de diseñar:** los precios agrícolas en origen **no cotizan en tiempo real**. La administración los recoge **una vez por semana** como horquilla mínimo–máximo, y fuera de campaña un producto puede quedarse sin cotización. El aspecto de bolsa es posible, pero con datos semanales.

## 2. Viabilidad de datos y licencias

Al ser una web pública, **solo puede mostrar datos que se puedan republicar**. Todas las fuentes se comprobaron el 2026-11-10.

| Producto | Fuente | Frecuencia | Histórico | Formato | ¿Se puede republicar? | Fiabilidad |
|---|---|---|---|---|---|---|
| Naranja, clementina, limón (sobre árbol), almendra (grano), garrofa entera, aceite de oliva (AOVE, virgen, lampante) | **GVA, Portal de Datos Abiertos**: «Precios agrarios de origen de la Comunitat Valenciana» (`agr-obs-pre-origen`) | Semanal. La semana 44 (26/10–01/11) se publicó el 04/11, un miércoles | **Desde la semana 45 de 2017** (41.617 filas) | **CSV y API** (CKAN `datastore_search` y SQL), con mínimo, medio y máximo por producto, variedad y provincia | **Sí, CC BY 4.0.** Hay que citar la fuente, poner la fecha de última actualización, no alterar los datos y no sugerir que la Generalitat respalda la web (Decreto 105/2017, art. 63) | **Alta.** Oficial, gratuita y con todos los productos pedidos |
| Los mismos productos, más la columna «Lonja de Valencia» en cítricos | GVA, informe semanal en Excel o PDF (portalagrari) | Semanal | Desde 2012 (Excel desde 2020) | Excel con un formato que cambia cada semana | Por las mismas condiciones generales, sí, pero el portal no tiene aviso legal propio. **No hace falta: el CSV abierto trae los mismos datos** | Media (por el formato) |
| Aceite y cítricos (media nacional) | **MAPA**, Precios medios nacionales | Semanal | Desde 2019 | Un Excel por año | **Sí, sin autorización, citando la fuente.** Hay que conservar la fecha de actualización (aviso legal del MAPA y Ley 37/2007) | Alta |
| Aceituna de almazara, almendra en cáscara (nacional) | MAPA, Precios percibidos | Mensual, con 3–4 meses de retraso | Desde 2005 | Excel | Sí, citando la fuente | Baja para un panel tipo bolsa |
| Aceite (Jaén, a diario) | Infaoliva | Diaria | Últimos 2 años | Web pública | **NO.** Su aviso dice: «Queda prohibida la publicación de la información facilitada por INFAOLIVA [...] sin autorización previa» | No usable en una web pública |
| Aceite (índices) | Poolred | Por operación | Desde 1996 | Suscripción (75–360 €/año) | **NO.** Es de pago y su convenio prohíbe el acceso con robots | Descartada |
| Varios (UE) | API agrifood de la Comisión Europea | Semanal | Aceite desde 2010 | API JSON | **No está claro.** No se encontró la licencia de esta API. Además, el 10/11 respondía `SUSPENDED`, 429 o timeout | No verificable hoy |
| Almendra, algarroba | Lonjas de Reus, Albacete y Murcia | Semanal (según prensa) | ? | No se encontró web oficial con las tablas | **No está claro.** No hay condiciones publicadas localizables | Sin comprobar; los sindicatos cuestionan los precios de Reus |
| Zumo de naranja (futuros FCOJ en ICE) | ICE | Tiempo real | Largo | De pago | **NO** (datos con licencia comercial) | Fuera de alcance: no es naranja en origen |

**Conclusión:** una sola fuente, el **CSV abierto de la GVA**, cubre los cuatro productos pedidos con licencia **CC BY 4.0**, API, datos semanales e histórico desde finales de 2017. Desaparece el riesgo de leer el Excel semanal, que cambiaba de formato. Infaoliva y Poolred quedan fuera por licencia.

**Matices de la fuente GVA que hay que tener en cuenta:**
- El dato es **por provincia** (Alicante, Castellón, Valencia), no por lonja. Es la «cotización más frecuente» que la Conselleria recoge de empresas colaboradoras. El aceite y la garrofa solo cotizan en **Castellón**.
- El CSV **no trae la unidad ni la posición comercial**. Según el informe semanal, todos estos productos van en **€/kg sin IVA**. Los cítricos cotizan **sobre árbol**, la almendra en **€/kg de grano a la entrada de la descascaradora** y el aceite y la garrofa a la **entrada del almacén**. Esas etiquetas se ponen fijas en la web.
- Hay huecos: por ejemplo, la garrofa tiene 408 semanas con dato de unas 470. Los cítricos solo cotizan en campaña (aproximadamente de septiembre a junio, según la variedad).

## 3. MVP propuesto (mínimo)

**Objetivo:** que un colega abra el enlace en el móvil y vea en 10 segundos cómo están los precios en origen esta semana y hacia dónde van.

**Entra:**
1. **Un enlace público**, sin registro, pensado primero para el móvil, con una vista previa decente al compartirlo por WhatsApp (título y descripción).
2. **Una lista de precios** con una fila por producto:
   - **Productos:** naranja Navelina, clementina Clemenules, almendra Comuna, almendra Marcona, garrofa entera y AOVE.
   - **Datos de cada fila:** precio medio de la semana, **variación semanal** en € y %, unidad y posición comercial.
3. **Un gráfico histórico** por producto: serie semanal con la banda mínimo–máximo, rangos 1A, 3A y Todo, y huecos visibles fuera de campaña.
4. **Fuente y fecha en cada precio:** «Fuente: Generalitat Valenciana, Conselleria de Agricultura (datos abiertos, CC BY 4.0) · Castellón · semana 44 (26 oct–1 nov 2026) · actualizado el 4 nov 2026». En el pie, un aviso: «Web no oficial, sin relación con la Generalitat». Esto cumple la licencia.
5. **Actualización automática semanal**, con un aviso visible si el dato de la semana no ha llegado.

**Queda fuera del MVP:**
- Comparación con la campaña anterior y línea nacional del MAPA (pasan al escalón 2).
- Precio diario del aceite (Infaoliva no se puede republicar).
- Aceituna como fruto, lonjas de Reus, Albacete y Murcia, futuros, cuentas, alertas y app nativa.

**Escalones siguientes (opcionales, por orden):**
1. Comparación con la misma semana de la campaña anterior, que en productos estacionales dice más que la variación semanal.
2. Línea nacional del MAPA para cítricos y aceite.
3. Selector de provincia y más productos del mismo CSV (limón, caqui, aguacate, arroz…), sin coste de datos.
4. «Valor de mi cosecha» (kg × precio). Hay que convertir unidades: la almendra cotiza en grano, la aceituna se vende como fruto y los cítricos cotizan sobre el árbol.

## 4. Preguntas para Guillermo

1. **¿Les vale a tus colegas un precio semanal?** Es como lo publica la administración: el dato del lunes al domingo aparece el miércoles siguiente. Recomendado: **sí**. El único dato diario que existe, el del aceite, no se puede republicar.
2. **¿Estos seis productos o cambias alguno?** Recomendado: **naranja Navelina, clementina Clemenules, almendra Comuna, almendra Marcona, garrofa y AOVE**. Si tus colegas siguen otra variedad (por ejemplo, Lanelate o limón Fino), está en el mismo CSV y no cuesta nada añadirla.

## 5. Veredicto

**Sí tiene sentido. Tamaño S**: una página pública, una fuente con API y licencia abierta, seis series y una actualización semanal.

- **A favor:** fuente oficial con **API y licencia CC BY 4.0**, que cubre los cuatro productos pedidos con casi 9 años de histórico. No hay que leer el Excel ni pedir permisos.
- **Riesgos:**
  - **Expectativa de «bolsa»**: los datos son semanales y con huecos. Si los colegas esperan movimiento diario, se decepcionarán. La web debe decir claramente «precio semanal en origen».
  - **Dependencia de una sola fuente**: si la GVA deja de actualizar el dataset, la web se queda parada. Se mitiga con el aviso de dato no recibido y, como plan B, con el informe en Excel del mismo organismo.
  - **El dato es por provincia, no por lonja**: hay que rotularlo bien para no confundir a quien conozca los precios de la Lonja de Valencia.
  - **Cumplimiento de la licencia**: cada precio debe llevar fuente y fecha, y la web debe aclarar que no está respaldada por la Generalitat. Ya está incluido en el MVP.
- **Métrica de éxito:** durante 8 semanas seguidas, la web muestra el dato nuevo antes del jueves sin intervención manual, y Guillermo ha pasado el enlace al menos a 3 colegas que vuelven a abrirlo.

## Fuentes comprobadas
- GVA, dataset abierto de precios agrarios de origen (CSV y API, CC BY): https://dadesobertes.gva.es/es/dataset/agr-obs-pre-origen
- GVA, aviso legal del Portal de Datos Abiertos (CC BY 4.0 y condiciones del Decreto 105/2017): https://portaldadesobertes.gva.es/es/avis-legal
- GVA, informe semanal en Excel o PDF: https://portalagrari.gva.es/es/pye/precios-agrarios
- MAPA, precios medios nacionales: https://www.mapa.gob.es/es/estadistica/temas/estadisticas-agrarias/economia/precios-medios-nacionales/
- MAPA, aviso legal (reutilización citando la fuente): https://www.mapa.gob.es/es/atencion-al-ciudadano/aviso-legal
- MAPA, precios percibidos: https://www.mapa.gob.es/es/estadistica/temas/estadisticas-agrarias/economia/precios-percibidos-pagados/precios-percibidos-por-los-agricultores-y-ganaderos
- Infaoliva: https://www.infaoliva.com/
- Poolred: https://www.poolred.com/
- Documentación de la API agrifood de la Comisión Europea: https://agridata.ec.europa.eu/extensions/API_Documentation/oliveoil.html
- Prensa sobre la Lonja de Reus: https://www.agronewscastillayleon.com/unio-de-pagesos-denuncia-la-opacidad-de-la-lonja-de-reus-en-el-mercado-de-la-avellana-la-almendra-y-la-algarroba
