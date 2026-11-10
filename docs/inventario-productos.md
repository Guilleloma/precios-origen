# Inventario de productos del dataset

Qué productos y variedades trae el CSV de la GVA ([«Precios agrarios de origen de la Comunitat Valenciana»](https://dadesobertes.gva.es/es/dataset/agr-obs-pre-origen), CC BY 4.0), cuáles publica la web y por qué. Sale del CSV descargado el 2026-11-10 (actualizado el 4 nov 2026): 469 semanas, de la 45 de 2017 a la 44 de 2026, 312 series (variedad + provincia) de 172 variedades.

## Cómo leer las tablas

- **Semanas totales / recientes**: semanas con dato de esa variedad en esa provincia, sin contar filas duplicadas. «Recientes» son las de las **dos últimas campañas**, que aquí son las últimas 104 semanas del CSV (de la 45 de 2024 a la 44 de 2026).
- **Primera y última**: semana GVA (`semana/año`) de la primera y la última cotización en cualquier provincia.
- **Código**: `codigo_variedad` del CSV, el que se pone en `config/productos.ts`.

## Criterio de selección

1. **Alcance**: cultivos de árbol y viña (cítricos, fruta, uva, frutos secos, aceite y garrofa), más melón y sandía, que la GVA cuenta como hortalizas pero se venden como fruta. Fuera, por ahora, hortalizas, cereales, flor cortada, miel y productos ganaderos (los ganaderos, huevos y vacuno solo salen en el informe semanal en Excel, no en el CSV).
2. **Solo variedades vivas**: con dato en las dos últimas campañas y al menos **20 semanas** con dato en la provincia elegida, para que el gráfico tenga sentido.
3. **Dos o tres variedades por fruta como mucho**: las de más semanas recientes y, a igualdad, más histórico. Las subseries comerciales del limón (redrojo, primer corte) no entran: se publica el Fino y el Verna.
4. **Provincia de referencia**: una por producto, la de más semanas recientes; en empate, la de más histórico. Los siete productos del MVP conservan la suya (por ejemplo, la Navelina sigue en Valencia aunque Alicante tenga más semanas).
5. **Posición comercial**: la del pie del informe semanal de la GVA y la descripción del dataset. Cítricos y caqui, sobre árbol; uva de mesa, sobre cepa; almendra, grano a la entrada de la descascaradora; el resto de fruta (frutales no cítricos), aceite y garrofa, entrada almacén. La Generalitat no indica la posición del melón, la sandía ni el aguacate: melón y sandía están entre las hortalizas, para las que la descripción del dataset no da posición, y el aguacate no se nombra. Esos tres salen como «precio en origen», sin afirmar un punto concreto. Todas en €/kg sin IVA.

Resultado: **36 productos** (29 nuevos y los 7 del MVP): 12 cítricos, 13 de fruta, 3 de uva de mesa, 4 almendras y 4 de aceite y garrofa. Es algo más que el objetivo orientativo de 20 a 35 porque los cítricos son el grueso del dataset y de la agricultura valenciana; con el criterio de arriba ya quedan fuera 17 variedades de cítrico vivas y con histórico suficiente.

No existen en el dataset: uva de vinificación, kiwi, pera, nuez, avellana, ni otros aceites distintos de los tres de oliva.

## Duplicados en los productos nuevos

Cuatro semanas de los productos nuevos traen filas duplicadas con valores distintos. Todas se resuelven con la regla de la horquilla contenedora (regla 3 del plan técnico) y en las cuatro la elegida coincide con el Excel oficial de esa semana:

| Producto | Semana | Filas del CSV | Elegida | Excel oficial |
|---|---|---|---|---|
| Melón piel de sapo (Castellón) | 34/2026 | 0,42–1,49 y 0,85–1,49 | 0,42–1,49 | 0,42 / 1,49 |
| Melón piel de sapo (Castellón) | 36/2026 | 1,06–1,49 y 1,06–1,50 | 1,06–1,50 | 1,06 / 1,50 |
| Naranja Lane Late (Castellón) | 9/2026 | 0,30–0,35 y 0,27–0,35 | 0,27–0,35 | 0,27 / 0,35 |
| Mandarina Clemenvilla (Alicante) | 1/2023 | 0,30–0,66 y 0,30–0,35 | 0,30–0,66 | 0,30 / 0,66 |

## Productos dentro del alcance

### Cítricos

| Producto | Variedad | Código | Provincia: semanas totales / recientes | Primera | Última | Estado |
|---|---|---|---|---|---|---|
| Satsumas | Clausellina/Okitsu | 45 | Alicante 45/4 · Castellón 3/0 · Valencia 65/17 | 33/2018 | 42/2026 | **Entra** · `satsuma-clausellina-okitsu` · Cítricos · Valencia |
| Satsumas | Satsuma Iwasaki | 352 | Alicante 13/0 · Castellón 4/1 · Valencia 41/9 | 33/2018 | 38/2025 | Fuera: entra Clausellina/Okitsu, con más semanas recientes |
| Satsumas | Satsuma Owari | 50 | Alicante 34/7 · Castellón 10/10 · Valencia 61/8 | 45/2017 | 43/2026 | Fuera: entra Clausellina/Okitsu, con más semanas recientes |
| Clementinas | Clementina Arrufatina | 1 | Alicante 12/1 · Castellón 80/16 · Valencia 60/16 | 38/2018 | 43/2026 | Fuera: entran Clemenules y Oronules, con más semanas recientes |
| Clementinas | Clementina Clemenrubí/Pri23 | 212 | Alicante 49/7 · Castellón 52/10 · Valencia 51/8 | 34/2018 | 42/2026 | Fuera: entran Clemenules y Oronules, con más semanas recientes |
| Clementinas | Clementina Clemenules | 3 | Alicante 157/28 · Castellón 185/34 · Valencia 163/36 | 45/2017 | 44/2026 | **Entra** · `clementina-clemenules` · Cítricos · Castellón |
| Clementinas | Clementina Esbal | 80 | Castellón 52/14 | 34/2018 | 44/2026 | Fuera: entran Clemenules y Oronules, con más semanas recientes |
| Clementinas | Clementina Fina | 215 | Castellón 8/0 | 47/2017 | 2/2018 | Fuera: sin dato en las dos últimas campañas (última, sem. 2/2018) |
| Clementinas | Clementina Hernandina | 31 | Alicante 23/0 · Castellón 66/14 · Valencia 6/0 | 45/2017 | 5/2026 | Fuera: entran Clemenules y Oronules, con más semanas recientes |
| Clementinas | Clementina Loretina | 81 | Castellón 1/1 | 32/2025 | 32/2025 | Fuera: histórico corto (1 semana como mucho) |
| Clementinas | Clementina Marisol | 41 | Alicante 71/12 · Castellón 95/16 · Valencia 79/19 | 33/2018 | 43/2026 | Fuera: entran Clemenules y Oronules, con más semanas recientes |
| Clementinas | Clementina Mioro | 88 | Castellón 20/0 | 28/2020 | 41/2024 | Fuera: sin dato en las dos últimas campañas (última, sem. 41/2024) |
| Clementinas | Clementina Orogrande | 82 | Alicante 65/0 · Castellón 24/0 | 45/2017 | 47/2023 | Fuera: sin dato en las dos últimas campañas (última, sem. 47/2023) |
| Clementinas | Clementina Oronules | 46 | Alicante 75/10 · Castellón 103/20 · Valencia 73/20 | 34/2018 | 44/2026 | **Entra** · `clementina-oronules` · Cítricos · Castellón |
| Clementinas | Clementina Sando | 300401 | Castellón 11/7 | 3/2023 | 3/2026 | Fuera: histórico corto (11 semanas como mucho) |
| Otras Mandarinas e Híbridos | Mandarina Clemenvilla | 22 | Alicante 162/28 · Castellón 75/16 · Valencia 112/12 | 45/2017 | 3/2026 | **Entra** · `mandarina-clemenvilla` · Cítricos · Alicante |
| Otras Mandarinas e Híbridos | Mandarina Fortune | 4 | Alicante 8/0 · Castellón 6/0 · Valencia 4/0 | 3/2018 | 5/2020 | Fuera: sin dato en las dos últimas campañas (última, sem. 5/2020) |
| Otras Mandarinas e Híbridos | Mandarina Leanri | 300160 | Castellón 8/8 | 4/2025 | 6/2026 | Fuera: histórico corto (8 semanas como mucho) |
| Otras Mandarinas e Híbridos | Mandarina Murcott | 323 | Castellón 1/0 | 8/2020 | 8/2020 | Fuera: sin dato en las dos últimas campañas (última, sem. 8/2020) |
| Otras Mandarinas e Híbridos | Mandarina Murina | 300400 | Castellón 1/0 | 3/2023 | 3/2023 | Fuera: sin dato en las dos últimas campañas (última, sem. 3/2023) |
| Otras Mandarinas e Híbridos | Mandarina Nadorcott | 89 | Alicante 111/17 · Castellón 94/24 · Valencia 125/19 | 45/2017 | 11/2026 | **Entra** · `mandarina-nadorcott` · Cítricos · Castellón |
| Otras Mandarinas e Híbridos | Mandarina Orri | 354 | Alicante 2/0 · Castellón 94/23 · Valencia 48/16 | 3/2018 | 15/2026 | Fuera: entran Clemenvilla y Nadorcott, con más semanas recientes |
| Otras Mandarinas e Híbridos | Mandarina Ortanique | 48 | Alicante 121/14 · Castellón 95/13 · Valencia 127/20 | 45/2017 | 13/2026 | Fuera: entran Clemenvilla y Nadorcott, con más semanas recientes |
| Otras Mandarinas e Híbridos | Mandarina Safor | 322 | Castellón 2/0 | 4/2018 | 5/2018 | Fuera: sin dato en las dos últimas campañas (última, sem. 5/2018) |
| Otras Mandarinas e Híbridos | Mandarina Tango | 300040 | Alicante 40/0 · Castellón 75/23 · Valencia 103/23 | 43/2019 | 7/2026 | Fuera: entran Clemenvilla y Nadorcott, con más semanas recientes |
| Naranjas Navel | Naranja Navel Lane Late | 84 | Alicante 177/27 · Castellón 164/32 · Valencia 160/25 | 45/2017 | 15/2026 | **Entra** · `naranja-lane-late` · Cítricos · Castellón |
| Naranjas Navel | Naranja Navel Powell | 297 | Alicante 117/28 · Castellón 102/15 · Valencia 112/23 | 45/2017 | 20/2026 | Fuera: entran Navelina y Lane Late, con más semanas recientes |
| Naranjas Navel | Naranja Navelina | 85 | Alicante 220/45 · Castellón 115/29 · Valencia 182/42 | 45/2017 | 44/2026 | **Entra** · `naranja-navelina` · Cítricos · Valencia |
| Naranjas Navel | Naranja Washington Navel | 83 | Castellón 87/14 · Valencia 94/19 | 45/2017 | 4/2026 | Fuera: entran Navelina y Lane Late, con más semanas recientes |
| Naranjas Blancas | Salustiana | 286 | Alicante 104/17 · Castellón 126/30 · Valencia 99/17 | 45/2017 | 8/2026 | **Entra** · `naranja-salustiana` · Cítricos · Castellón |
| Naranjas Blancas | Valencia Late | 287 | Alicante 139/25 · Castellón 108/20 · Valencia 114/21 | 49/2017 | 20/2026 | **Entra** · `naranja-valencia-late` · Cítricos · Alicante |
| Naranjas Blancas | Valencia Midknight | 300140 | Alicante 20/7 · Castellón 20/14 · Valencia 27/16 | 22/2022 | 19/2026 | Fuera: entran Salustiana y Valencia Late; Midknight solo tiene dato desde 2022 |
| Limón Fino | Limón Fino | 355 | Alicante 252/47 | 45/2017 | 44/2026 | **Entra** · `limon-fino` · Cítricos · Alicante |
| Limón Fino | Limón Fino Redrojo | 57 | Alicante 46/18 | 25/2020 | 31/2026 | Fuera: subserie del limón (redrojo): entran Fino y Verna |
| Limón Fino | Limón Fino/Primofiori (1corte) | 191 | Alicante 59/10 | 45/2017 | 44/2026 | Fuera: subserie del limón (primer corte): entran Fino y Verna |
| Limón Verna | Limón Verna | 288 | Alicante 127/28 | 17/2018 | 23/2026 | **Entra** · `limon-verna` · Cítricos · Alicante |
| Limón Verna | Limón Verna Redrojo | 318 | Alicante 91/24 | 27/2018 | 38/2026 | Fuera: subserie del limón (redrojo): entran Fino y Verna |
| Pomelos | Pomelo Rojo | 58 | Alicante 146/42 · Valencia 5/0 | 48/2017 | 14/2026 | **Entra** · `pomelo-rojo` · Cítricos · Alicante |
| Naranjas Sanguinas | Naranja Sanguinelli | 300320 | Castellón 51/9 · Valencia 31/4 | 49/2017 | 5/2026 | Fuera: sanguina con poco dato reciente (9 semanas en dos campañas) |

### Fruta

| Producto | Variedad | Código | Provincia: semanas totales / recientes | Primera | Última | Estado |
|---|---|---|---|---|---|---|
| Aguacate | Bacon | 300460 | Castellón 11/11 · Valencia 11/9 | 43/2024 | 44/2026 | Fuera: histórico corto (11 semanas como mucho) |
| Aguacate | Fuerte | 300462 | Valencia 5/5 | 48/2024 | 52/2024 | Fuera: histórico corto (5 semanas como mucho) |
| Aguacate | Hass | 300463 | Alicante 33/28 · Castellón 21/20 · Valencia 24/24 | 9/2024 | 11/2026 | **Entra** · `aguacate-hass` · Fruta · Alicante |
| Aguacate | Hass Maluma | 300461 | Valencia 4/2 | 43/2024 | 46/2024 | Fuera: histórico corto (4 semanas como mucho) |
| Aguacate | Lamb Hass | 300464 | Alicante 7/3 · Castellón 21/15 · Valencia 22/15 | 9/2024 | 14/2026 | Fuera: entra Hass |
| Albaricoque | Albaricoque Galta Roja | 26 | Valencia 16/0 | 20/2018 | 24/2021 | Fuera: sin dato en las dos últimas campañas (última, sem. 24/2021) |
| Albaricoque | Albaricoque Mirlo Naranja | 341 | Alicante 1/1 | 22/2026 | 22/2026 | Fuera: histórico corto (1 semana como mucho) |
| Albaricoque | Albaricoque Mirlo Rojo | 340 | Alicante 3/0 | 23/2018 | 25/2018 | Fuera: sin dato en las dos últimas campañas (última, sem. 25/2018) |
| Albaricoque | Albaricoque Mitger | 342 | Alicante 15/2 | 23/2018 | 24/2026 | Fuera: histórico corto (15 semanas como mucho) |
| Albaricoque | Albaricoque Temprano | 300060 | Alicante 1/1 · Valencia 30/6 | 19/2018 | 23/2026 | **Entra** · `albaricoque-temprano` · Fruta · Valencia |
| Albaricoque | Otros Albaricoques | 67 | Alicante 4/0 | 26/2018 | 25/2020 | Fuera: sin dato en las dos últimas campañas (última, sem. 25/2020) |
| Caqui | Caqui R. Brillante | 53 | Valencia 144/33 | 45/2017 | 44/2026 | **Entra** · `caqui-rojo-brillante` · Fruta · Valencia |
| Cereza | Cereza Burlat | 108 | Alicante 23/9 · Castellón 1/0 | 20/2018 | 24/2026 | Fuera: entra Starking, con más semanas recientes |
| Cereza | Cereza Picota | 110 | Alicante 15/0 | 25/2018 | 31/2021 | Fuera: sin dato en las dos últimas campañas (última, sem. 31/2021) |
| Cereza | Cereza Ruby | 278 | Castellón 2/0 | 21/2019 | 23/2019 | Fuera: sin dato en las dos últimas campañas (última, sem. 23/2019) |
| Cereza | Cereza Starking | 109 | Alicante 51/5 · Castellón 3/0 | 22/2018 | 27/2026 | **Entra** · `cereza-starking` · Fruta · Alicante |
| Ciruela | Ciruela President | 113 | Alicante 1/0 | 35/2018 | 35/2018 | Fuera: sin dato en las dos últimas campañas (última, sem. 35/2018) |
| Ciruela | Ciruela Red Beauty | 55 | Valencia 4/0 | 23/2018 | 24/2019 | Fuera: sin dato en las dos últimas campañas (última, sem. 24/2019) |
| Ciruela | Ciruela Tipo Black | 71 | Valencia 44/12 | 26/2018 | 28/2026 | **Entra** · `ciruela-black` · Fruta · Valencia |
| Ciruela | Otras Ciruelas | 49 | Alicante 7/0 | 34/2018 | 40/2018 | Fuera: sin dato en las dos últimas campañas (última, sem. 40/2018) |
| Granada | Granada Mollar | 142 | Alicante 126/20 | 45/2017 | 44/2026 | **Entra** · `granada-mollar` · Fruta · Alicante |
| Granada | Granada Valenciana | 300 | Alicante 42/8 | 37/2018 | 43/2026 | Fuera: entra Mollar, con más semanas recientes |
| Higo | Higo Breva | 143 | Alicante 40/9 | 22/2018 | 26/2026 | Fuera: entra el negro, con más semanas recientes |
| Higo | Higo Negro | 144 | Alicante 50/10 | 30/2018 | 34/2026 | **Entra** · `higo-negro` · Fruta · Alicante |
| Manzana | Manzana Fuji | 319 | Alicante 94/8 | 45/2017 | 44/2026 | **Entra** · `manzana-fuji` · Fruta · Alicante |
| Manzana | Manzana Gala | 296 | Alicante 57/5 | 33/2018 | 36/2026 | Fuera: entra Fuji, la de más dato reciente |
| Manzana | Manzana Golden | 146 | Alicante 43/0 | 45/2017 | 43/2021 | Fuera: sin dato en las dos últimas campañas (última, sem. 43/2021) |
| Manzana | Manzana Starking | 145 | Alicante 94/4 | 45/2017 | 41/2026 | Fuera: entra Fuji, la de más dato reciente |
| Melocotón | Melocoton Carne Amarilla | 346 | Alicante 13/9 · Castellón 4/0 | 28/2018 | 36/2026 | Fuera: histórico corto (13 semanas como mucho) |
| Melocotón | Melocotones Tempranos | 117 | Valencia 27/3 | 21/2018 | 24/2025 | Fuera: entra Paraguayo, con más semanas recientes |
| Melocotón | Melocotón Extratemprano | 115 | Valencia 31/7 | 18/2018 | 23/2026 | Fuera: entra Paraguayo, con más semanas recientes |
| Melocotón | Melocotón Paraguayo | 320 | Alicante 4/0 · Valencia 49/8 | 20/2018 | 23/2026 | **Entra** · `melocoton-paraguayo` · Fruta · Valencia |
| Melocotón | Melocotón Verano | 118 | Castellón 4/0 | 29/2019 | 32/2019 | Fuera: sin dato en las dos últimas campañas (última, sem. 32/2019) |
| Nectarina | Nectarina Amarilla | 348 | Alicante 5/0 · Valencia 55/10 | 18/2018 | 23/2026 | **Entra** · `nectarina-amarilla` · Fruta · Valencia |
| Nectarina | Nectarina Blanca | 120 | Valencia 43/5 | 19/2018 | 23/2026 | Fuera: entra la amarilla, con más semanas recientes |
| Níspero | Níspero Algar | 122 | Alicante 69/13 · Castellón 2/0 | 14/2018 | 22/2026 | **Entra** · `nispero-algar` · Fruta · Alicante |
| Uva De Mesa | Uva De Mesa Aledo | 127 | Alicante 58/2 | 45/2017 | 1/2026 | Fuera: entran las tres con más dato reciente (Aledo, 2 semanas en dos campañas) |
| Uva De Mesa | Uva De Mesa D. María | 188 | Alicante 67/18 | 35/2018 | 44/2026 | **Entra** · `uva-dona-maria` · Uva de mesa · Alicante |
| Uva De Mesa | Uva De Mesa Ideal | 280 | Alicante 30/0 | 35/2018 | 44/2022 | Fuera: sin dato en las dos últimas campañas (última, sem. 44/2022) |
| Uva De Mesa | Uva De Mesa Moscatel Italia | 79 | Alicante 10/0 | 35/2019 | 34/2023 | Fuera: sin dato en las dos últimas campañas (última, sem. 34/2023) |
| Uva De Mesa | Uva De Mesa Moscatel Romano | 78 | Alicante 51/13 | 32/2018 | 39/2026 | **Entra** · `uva-moscatel-romano` · Uva de mesa · Alicante |
| Uva De Mesa | Uva De Mesa Red Globe | 189 | Alicante 92/22 | 31/2018 | 44/2026 | **Entra** · `uva-red-globe` · Uva de mesa · Alicante |
| Uva De Mesa | Uva De Mesa Victoria | 183 | Alicante 28/7 | 31/2018 | 35/2026 | Fuera: entran las tres con más dato reciente |

### Hortalizas: melón y sandía

| Producto | Variedad | Código | Provincia: semanas totales / recientes | Primera | Última | Estado |
|---|---|---|---|---|---|---|
| Melón | Melón Amarillo | 95 | Alicante 13/2 | 29/2022 | 28/2025 | Fuera: histórico corto (13 semanas como mucho) |
| Melón | Melón Piel De Sapo | 98 | Alicante 78/16 · Castellón 95/19 | 27/2018 | 37/2026 | **Entra** · `melon-piel-de-sapo` · Fruta · Castellón |
| Sandía | Sandía con pepitas | 24 | Alicante 42/7 · Castellón 75/14 · Valencia 66/17 | 27/2018 | 34/2026 | Fuera: entra la sin pepitas, con más semanas recientes |
| Sandía | Sandía mini sin semillas | 311 | Castellón 12/0 | 27/2019 | 27/2023 | Fuera: sin dato en las dos últimas campañas (última, sem. 27/2023) |
| Sandía | Sandía sin pepitas | 64 | Alicante 71/15 · Castellón 103/25 · Valencia 74/18 | 25/2018 | 38/2026 | **Entra** · `sandia-sin-pepitas` · Fruta · Castellón |

### Frutos secos

| Producto | Variedad | Código | Provincia: semanas totales / recientes | Primera | Última | Estado |
|---|---|---|---|---|---|---|
| Almendra | Almendra Comuna | 23 | Alicante 435/89 · Castellón 386/86 · Valencia 106/22 | 45/2017 | 44/2026 | **Entra** · `almendra-comuna` · Frutos secos · Alicante |
| Almendra | Almendra Largueta | 35 | Alicante 434/89 · Valencia 40/0 | 45/2017 | 44/2026 | **Entra** · `almendra-largueta` · Frutos secos · Alicante |
| Almendra | Almendra Marcona | 40 | Alicante 435/89 · Castellón 385/85 · Valencia 106/22 | 45/2017 | 44/2026 | **Entra** · `almendra-marcona` · Frutos secos · Alicante |
| Almendra | Almendra Planeta | 121 | Alicante 435/89 | 45/2017 | 44/2026 | **Entra** · `almendra-planeta` · Frutos secos · Alicante |

### Aceite y garrofa

| Producto | Variedad | Código | Provincia: semanas totales / recientes | Primera | Última | Estado |
|---|---|---|---|---|---|---|
| Aceite Oliva | Aceite Oliva Lampante>2º | 77 | Castellón 463/100 · Valencia 2/0 | 45/2017 | 44/2026 | **Entra** · `aceite-lampante` · Aceite y garrofa · Castellón |
| Aceite Oliva | Aceite Oliva Virgen 0,8º-2º | 75 | Castellón 453/99 · Valencia 2/0 | 45/2017 | 44/2026 | **Entra** · `aceite-virgen` · Aceite y garrofa · Castellón |
| Aceite Oliva | Aceite Oliva Virgen Extra<0,8º | 76 | Castellón 455/99 · Valencia 2/0 | 45/2017 | 44/2026 | **Entra** · `aceite-virgen-extra` · Aceite y garrofa · Castellón |
| Garrofa | Garrofa Entera | 165 | Castellón 351/76 | 45/2017 | 44/2026 | **Entra** · `garrofa` · Aceite y garrofa · Castellón |

## Disponibles, no incluidos

Familias del dataset que quedan fuera por alcance. Cuentan variedades (no series por provincia); «vivas» son las que tienen dato en las dos últimas campañas.

| Grupo | Producto | Variedades | Vivas | Más semanas en una provincia | Posición comercial (informe GVA) |
|---|---|---|---|---|---|
| Hortalizas | Acelga | 1 | 1 | 316 | entrada almacén |
| Hortalizas | Ajo Puerro | 1 | 1 | 106 | entrada almacén |
| Hortalizas | Ajo Tierno² | 1 | 1 | 215 | entrada almacén |
| Hortalizas | Alcachofa | 4 | 4 | 292 | entrada almacén |
| Hortalizas | Apio | 1 | 1 | 443 | entrada almacén |
| Hortalizas | Berenjena | 2 | 2 | 458 | entrada almacén |
| Hortalizas | Boniato | 2 | 2 | 391 | entrada almacén |
| Hortalizas | Calabacín | 2 | 2 | 346 | entrada almacén |
| Hortalizas | Calabaza | 2 | 2 | 449 | entrada almacén |
| Hortalizas | Cebolla | 3 | 3 | 94 | entrada almacén |
| Hortalizas | Cebolla Tierna² | 1 | 1 | 241 | entrada almacén |
| Hortalizas | Col | 2 | 2 | 351 | entrada almacén |
| Hortalizas | Col Brócoli | 2 | 2 | 233 | entrada almacén |
| Hortalizas | Col Repollo | 2 | 2 | 433 | entrada almacén |
| Hortalizas | Coliflor Blanca | 1 | 1 | 365 | entrada almacén |
| Hortalizas | Escarola | 3 | 3 | 196 | entrada almacén |
| Hortalizas | Espinaca | 1 | 1 | 195 | entrada almacén |
| Hortalizas | Guisante Verde | 2 | 2 | 25 | entrada almacén |
| Hortalizas | Haba | 2 | 2 | 173 | entrada almacén |
| Hortalizas | Judía Blanca | 1 | 1 | 211 | entrada almacén |
| Hortalizas | Judía Roja | 1 | 1 | 239 | entrada almacén |
| Hortalizas | Judía Verde | 3 | 2 | 286 | entrada almacén |
| Hortalizas | Lechuga | 6 | 6 | 469 | entrada almacén |
| Hortalizas | Patata | 2 | 2 | 383 | entrada almacén |
| Hortalizas | Pepino | 2 | 1 | 363 | entrada almacén |
| Hortalizas | Pimiento | 7 | 7 | 236 | entrada almacén |
| Hortalizas | Tomate | 8 | 8 | 466 | entrada almacén |
| Hortalizas | Zanahoria | 1 | 1 | 271 | entrada almacén |
| Flor cortada¹ | Clavel | 1 | 1 | 460 | vivero (€/unidad o €/pomo) |
| Flor cortada | Crisantemo | 1 | 1 | 460 | vivero (€/unidad o €/pomo) |
| Flor cortada | Esparraguera | 1 | 1 | 460 | vivero (€/unidad o €/pomo) |
| Flor cortada | Gerbera | 1 | 1 | 459 | vivero (€/unidad o €/pomo) |
| Flor cortada | Gladiolo | 1 | 1 | 460 | vivero (€/unidad o €/pomo) |
| Flor cortada | Rosa | 1 | 1 | 460 | vivero (€/unidad o €/pomo) |
| Flor cortada | Statice | 1 | 1 | 460 | vivero (€/unidad o €/pomo) |
| Cereales | Arroz | 1 | 1 | 166 | entrada industria |
| Industriales | Miel | 3 | 3 | 271 | entrada almacén |

¹ La flor cortada no va en €/kg aunque el dataset diga que todos los precios lo están: el informe semanal la da en €/unidad o €/pomo.
² La cebolla tierna y el ajo tierno van en € por manojo, según la descripción del dataset.

Para añadir cualquiera de estos productos basta con una entrada en `config/productos.ts` con su código, su provincia y una categoría (habría que crear la de hortalizas).
