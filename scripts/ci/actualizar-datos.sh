#!/usr/bin/env bash
# Ejecuta la ingesta sobre la rama `datos` y, solo si hay datos nuevos, los commitea y los sube.
# Lo usa el job «ingesta» de .github/workflows/publicar.yml. Se puede probar en local con un
# remoto de prueba (un repo bare) como `origin`.
#
# Uso: scripts/ci/actualizar-datos.sh <carpeta> [opciones extra para la ingesta]
#   <carpeta>  clon del repo, en cualquier rama, con `origin` y permiso de escritura.
#              Si `origin` tiene la rama `datos`, la saca; si no, crea una rama huérfana.
#
# Entorno (todo opcional):
#   PERMITIR_DESFASE=true  pasa --permitir-desfase a la ingesta (solo en el arranque manual)
#   PROBAR_FALLO=true      descarga de una dirección que no existe (prueba de fallo de la fuente)
#   GITHUB_OUTPUT, GITHUB_STEP_SUMMARY  los pone Actions: salidas y resumen del job
#
# Salidas: datos_nuevos=true|false y sha_datos=<commit de `datos` que hay que publicar>.
# Código de salida: el de la ingesta si falla (1 fuente o validación, 2 error inesperado).
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
CARPETA="${1:?Falta la carpeta de trabajo de la rama datos}"
shift
RAMA=datos
URL_PRUEBA_FALLO='https://dadesobertes.gva.es/no-existe/prueba-de-fallo-precios-origen.csv'
SALIDAS="${GITHUB_OUTPUT:-/dev/null}"
RESUMEN="${GITHUB_STEP_SUMMARY:-/dev/null}"
BOT_NOMBRE='github-actions[bot]'
BOT_CORREO='41898282+github-actions[bot]@users.noreply.github.com'

# Escapa un valor para un comando de Actions (::error ...). En las propiedades, también «:» y «,».
escapar_mensaje() { local s=$1 pct='%'; s=${s//"$pct"/%25}; s=${s//$'\r'/%0D}; printf '%s' "${s//$'\n'/%0A}"; }
escapar_propiedad() { local s; s=$(escapar_mensaje "$1"); s=${s//:/%3A}; printf '%s' "${s//,/%2C}"; }

preparar_rama() {
  local estado=0
  git -C "$CARPETA" ls-remote --exit-code --heads origin "$RAMA" >/dev/null || estado=$?
  case $estado in
    0)
      git -C "$CARPETA" fetch --quiet --depth=1 origin "+refs/heads/$RAMA:refs/remotes/origin/$RAMA"
      git -C "$CARPETA" switch --quiet --force-create "$RAMA" "origin/$RAMA"
      ;;
    2) # ls-remote --exit-code devuelve 2 solo cuando la rama no existe
      echo "La rama $RAMA no existe todavía en origin: se crea huérfana (primer arranque)"
      git -C "$CARPETA" switch --quiet --orphan "$RAMA"
      cat >"$CARPETA/README.md" <<'TEXTO'
# Rama `datos`

Datos que publica la web, generados por el workflow `publicar.yml` a partir del CSV abierto de la Generalitat Valenciana, Conselleria de Agricultura: «Precios agrarios de origen de la Comunitat Valenciana» (datos abiertos, CC BY 4.0).

- `resumen.json`: semana de referencia y último precio de cada producto.
- `series/<producto>.json`: todas las semanas con cotización.

El contrato de datos está en el README de la rama `main`. No se edita a mano: cada commit es una semana nueva o una revisión de la fuente.
TEXTO
      ;;
    *)
      echo "::error title=No se puede consultar el repositorio::git ls-remote terminó con el código $estado"
      exit "$estado"
      ;;
  esac
}

informar_fallo() {
  local registro=$1 codigo_salida=$2 linea codigo titulo
  linea=$(grep -m1 '^Ingesta fallida \[' "$registro" || true)
  codigo=$(sed -n 's/^Ingesta fallida \[\([A-Z_]*\)\].*/\1/p' <<<"$linea")
  case $codigo in
    DESCARGA_FALLIDA) titulo='No se puede descargar el CSV de la GVA (red o servidor). El formato no ha llegado a comprobarse' ;;
    DATOS_DESFASADOS) titulo='La GVA aún no ha publicado la semana nueva' ;;
    CSV_* | PRECIO_* | PRODUCTO_* | DUPLICADO_* | CALENDARIO_*) titulo='El CSV de la GVA ha cambiado de formato o de contenido' ;;
    RETROCESO_*) titulo='El CSV de la GVA trae menos datos que los ya publicados' ;;
    PUBLICADO_ILEGIBLE) titulo='Los datos de la rama datos están dañados' ;;
    *) titulo='Error inesperado en la ingesta' ;;
  esac
  [[ -n $linea ]] || linea="La ingesta terminó con el código $codigo_salida: el detalle está en el registro del paso"
  echo "::error title=$(escapar_propiedad "$titulo")::$(escapar_mensaje "$linea")"
  {
    echo '### Ingesta fallida'
    echo
    echo "**$titulo.**"
    echo
    echo '```'
    echo "$linea"
    echo '```'
    echo
    # shellcheck disable=SC2016 # las comillas invertidas son Markdown, no una sustitución
    echo 'No se ha subido nada a la rama `datos`: la web sigue con el último dato bueno.'
  } >>"$RESUMEN"
}

ejecutar_ingesta() {
  local opciones=(--salida "$CARPETA") registro estado=0
  [[ ${PERMITIR_DESFASE:-false} == true ]] && opciones+=(--permitir-desfase)
  [[ ${PROBAR_FALLO:-false} == true ]] && opciones+=(--url "$URL_PRUEBA_FALLO")
  registro=$(mktemp)
  node --experimental-strip-types --disable-warning=ExperimentalWarning \
    "$RAIZ/scripts/ingesta/main.ts" "${opciones[@]}" "$@" 2>&1 | tee "$registro" || estado=${PIPESTATUS[0]}
  if ((estado != 0)); then
    informar_fallo "$registro" "$estado"
    rm -f "$registro"
    exit "$estado"
  fi
  rm -f "$registro"
}

subir_si_hay_cambios() {
  local nuevos=false semana
  git -C "$CARPETA" add --all
  if git -C "$CARPETA" diff --cached --quiet; then
    echo "Sin datos nuevos: no se hace commit en $RAMA"
  else
    semana=$(jq -r '"semana \(.ultimaSemana.semana) de \(.ultimaSemana.anyo)"' "$CARPETA/resumen.json")
    git -C "$CARPETA" -c user.name="$BOT_NOMBRE" -c user.email="$BOT_CORREO" commit --quiet -m "Datos: $semana"
    git -C "$CARPETA" push --quiet origin "HEAD:refs/heads/$RAMA"
    echo "Datos nuevos subidos a $RAMA: $semana"
    nuevos=true
  fi
  local sha
  sha=$(git -C "$CARPETA" rev-parse HEAD)
  echo "datos_nuevos=$nuevos" >>"$SALIDAS"
  echo "sha_datos=$sha" >>"$SALIDAS"
  if [[ $nuevos == true ]]; then
    echo "Datos nuevos en \`$RAMA\` ($semana, commit \`${sha:0:7}\`)." >>"$RESUMEN"
  else
    echo "Sin datos nuevos: no hay commit en \`$RAMA\`." >>"$RESUMEN"
  fi
}

preparar_rama
ejecutar_ingesta "$@"
subir_si_hay_cambios
