# Verificación por reversión de los tests del runtime (paso 4). Correr desde la raíz: bash scripts/mutantes-runtime.sh
set -u
BAK="${TMPDIR:-/tmp}/sc-mut-rt.bak"
m() { # archivo, buscar, reemplazo, nombre
  cp "$1" "$BAK"
  python3 -c "import sys;p,a,b=sys.argv[1:4];s=open(p).read();assert a in s,('NO ENCONTRADO',a);open(p,'w').write(s.replace(a,b,1))" "$1" "$2" "$3" || { echo "!! $4 no aplicó"; return; }
  echo "== $4"; npx playwright test 2>&1 | grep -E "^  +[0-9]+ (failed|passed)|^    test/browser" | sed 's/ ─*$//'
  cp "$BAK" "$1"
}
m src/runtime/mount.js "{ pie, stacked, stackedLine }" "{ stacked, stackedLine }" "pie sin cablear"
m src/runtime/mount.js "o.hidden = apagar ? (o.hidden || []).concat(clave)" "o.hidden = !apagar ? (o.hidden || []).concat(clave)" "redibujar invierte apagar"
m src/runtime/mount.js "      redibujable.replaceWith(molde.firstElementChild)
      setHatch()" "      redibujable.replaceWith(molde.firstElementChild)" "redibujar sin setHatch"
m src/runtime/mount.js "e.classList.toggle('sc-off', apagar)" "e.classList.toggle('sc-off', false)" "leyenda no esconde"
m src/runtime/mount.js "if (!el || el.classList.contains('sc-off')) { tipEl.hidden = true; return }" "if (!el) { tipEl.hidden = true; return }" "tooltip sobre serie apagada"
m src/runtime/mount.js "return meta - d.p[a] <= d.p[b] - meta ? a : b" "return a" "cursor toma el anterior, no el más cercano"
m src/runtime/mount.js "const alcance = el => el.closest('.sc-group') || el.closest('.sc-chart')" "const alcance = el => el.closest('.sc-chart')" "sc-group ignorado"
m src/runtime/mount.js "const filas = d.s.map(se => se.n + '  ' + conUnidad(Math.round(se.v[i]), d.u)).reverse()" "const filas = d.s.map(se => se.n + '  ' + conUnidad(Math.round(se.v[i]), d.u))" "stackedLine tooltip en orden inverso"
m src/runtime/mount.js "n < 0 ? d.w[-1 - n] : ''" "''" "heatmap sin motivo"
m src/runtime/mount.js "document.documentElement.addEventListener('pointerleave', () => { limpiar(); soltar(); tipEl.hidden = true })" "" "salir no limpia"
m src/runtime/render.js "if (el.scHtml === html) return false" "" "render repinta igual"
m src/runtime/play.js "el.classList.add('sc-play')" "" "play sin entrada"
m src/runtime/mount.js "const vacia = typeof n === 'string'" "const vacia = n < 0" "heatmap: negativo leído como sin datos"
m src/runtime/mount.js "    if (v === null) {
      pto.setAttribute('visibility', 'hidden')

      return mostrar(ev, d.l ? d.l[i] : 'Punto ' + (i + 1), textos.empty, '', 'neutral')
    }
" "" "cursor de line sobre un hueco"
m src/runtime/mount.js "    if (d.s[0].v[i] === null) {" "    if (false) {" "cursor de stackedLine sobre un hueco"
m src/core/huecos.js "'<rect ' + caja + ' style=\"fill:var(--sc-surface)\"></rect><rect '" "'<rect '" "hueco sin base opaca"
m src/core/huecos.js "export const conBanda = o => o.gaps !== 'empty'" "export const conBanda = () => false" "hueco sin banda (corte simple)"
m src/runtime/mount.js "pto.setAttribute('cy', d.T + entre(1 - v / d.max) * d.H)" "pto.setAttribute('cy', d.T + (1 - v / d.max) * d.H)" "cursor: el punto sale del plot"
