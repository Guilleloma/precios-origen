# precios-origen

Web estática pública con los precios agrarios en origen de la Comunitat Valenciana. Única fuente: el CSV abierto de la Generalitat Valenciana (`agr-obs-pre-origen`, CC BY 4.0).

- Producto y alcance: `docs/one-pager.md`
- Plan técnico, reglas de cálculo y contrato de datos: `docs/plan-tecnico.md`
- Cómo funciona la ingesta y forma del JSON: `README.md`
- Publicación (workflow `publicar.yml`, rama `datos`, GitHub Pages, qué hacer si falla): `README.md`, sección «Publicación»

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Web en desarrollo (`http://localhost:4321/precios-origen/`) |
| `npm run build` | Genera la web estática en `dist/` (lee `data/`) |
| `npm test` | Tests (Vitest) |
| `npm run typecheck` | Comprobación de tipos |
| `npm run ingesta` | Descarga el CSV, lo valida y genera `data/` |
| `npm run ingesta -- --csv <ruta> --actualizado-el AAAA-MM-DD` | Igual, con un CSV local y sin red |

## Reglas del proyecto

- Los productos se configuran solo en `config/productos.ts`.
- La ingesta no tiene dependencias de ejecución: solo Node (≥ 22.6, con `--experimental-strip-types`).
- `data/` es generado: no va a `main`, vive en la rama `datos`.
- El CSV completo nunca se commitea. La única muestra es `tests/fixtures/muestra.csv` (recorte real, CC BY 4.0).
- Repo público: commits con el correo `noreply` de GitHub y `package.json` sin `author`.

## Datos públicos intencionados

Ninguno. La web no muestra ni contiene datos personales de nadie: ni nombre, ni correo, ni teléfono. Cualquier dato personal que aparezca en el código, en la configuración, en `data/` o en `dist/` es una fuga.
