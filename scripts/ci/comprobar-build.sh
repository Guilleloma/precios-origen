#!/usr/bin/env bash
# Comprueba dist/ antes de publicarlo: cada página enlaza la vista previa con dirección absoluta
# (WhatsApp no enseña una imagen con ruta relativa) y no hay source maps.
# Lo usa el job «construir» de .github/workflows/publicar.yml.
#
# Uso: scripts/ci/comprobar-build.sh <dist> <dirección base>
#   <dirección base>  la de la web publicada, con barra final: https://<usuario>.github.io/precios-origen/
set -euo pipefail

DIST="${1:?Falta la carpeta del build}"
BASE="${2:?Falta la dirección base de la web}"
fallos=0
paginas=0

fallar() {
  echo "::error title=Build no publicable::$1"
  fallos=$((fallos + 1))
}

[[ $BASE == https://*/ ]] || fallar "La dirección base «$BASE» no es https ni acaba en /"

while IFS= read -r pagina; do
  paginas=$((paginas + 1))
  grep -qF "<meta property=\"og:image\" content=\"${BASE}og.png\"" "$pagina" || fallar "$pagina: og:image no es ${BASE}og.png"
  grep -qF "<meta property=\"og:url\" content=\"${BASE}" "$pagina" || fallar "$pagina: og:url no empieza por $BASE"
done < <(find "$DIST" -name '*.html' | sort)

((paginas > 0)) || fallar "No hay páginas HTML en $DIST"

mapas=$(find "$DIST" -name '*.map')
[[ -z $mapas ]] || fallar "Hay source maps en el build: $mapas"

if ((fallos > 0)); then
  exit 1
fi
echo "Build correcto: $paginas páginas con la vista previa en $BASE y sin source maps"
