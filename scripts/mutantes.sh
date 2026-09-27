# Verificación por reversión de los tests del paso 3: cada línea rompe el código a propósito, corre
# bun test, muestra los rojos con nombre y restaura. Correr desde la raíz: bash scripts/mutantes.sh
set -u
m() { # archivo, buscar, reemplazo, nombre
  cp "$1" "${TMPDIR:-/tmp}/sc-mut.bak"
  python3 -c "import sys;p,a,b=sys.argv[1:4];s=open(p).read();assert a in s,('NO ENCONTRADO',a);open(p,'w').write(s.replace(a,b,1))" "$1" "$2" "$3" || { echo "!! $4 no aplicó"; return; }
  r=$(bun test 2>&1 | grep -E "^\(fail\)" | grep -v "idéntico al prototipo" | sed 's/ \[.*//' | head -4)
  echo "== $4: $(bun test 2>&1 | grep -E ' fail$')"; echo "$r"
  cp "${TMPDIR:-/tmp}/sc-mut.bak" "$1"
}
m src/charts/range.js "'<span>' + esc(i ===" "'<span>' + (i ===" "range sin esc en el eje"
m src/core/format.js "export const esc = s => String(s === null || s === undefined ? '' : s).replace" "export const esc = s => String(s === null || s === undefined ? '' : s); const _x = s => s.replace" "esc identidad"
m src/charts/bullet.js "const pv = entre(o.value / o.max) * 100" "const pv = (o.value / o.max) * 100" "bullet sin recorte"
m src/core/muestreo.js "if (valores[i] < valores[lo]) lo = i" "" "muestreo sin mínimo"
m src/charts/columns.js "dibujo = rayada(y(d.projected)) +" "dibujo =" "columna en curso sin rayar"
m src/runtime/mount.js "{ pie, stacked, stackedLine }" "{ pie, stackedLine }" "guarda: stacked sin cablear"
m src/charts/pie.js "!ocultas.includes(sl.key) && sl.value > 0" "sl.value > 0" "pie ignora hidden"
m src/charts/stackedLine.js "entrada.series.map(se => ({ ...se, values: idx.map(i => n1(se.values[i])) }))" "entrada.series.map((se, j) => ({ ...se, values: (j ? muestreo(se.values, 600) || [] : idx).map(i => n1(se.values[i])) }))" "stackedLine recorta cada serie por su cuenta"
m src/charts/line.js "s += '<path d=\"' + pts(N - 2, N - 1) + '\" fill=\"none\" stroke-width=\"2.2\" stroke-dasharray=\"3 4\"" "s += '<path d=\"' + pts(N - 2, N - 1) + '\" fill=\"none\" stroke-width=\"2.2\"" "line buffer sin punteado"
m src/charts/stacked.js "(q.se.hatched ? 'dashed ' : 'solid ')" "'solid '" "stacked hatched sin punteado"
m src/charts/heatmap.js "niveles[Math.min(n, tope)].push(uso)" "(niveles[n] || (niveles[n] = [])).push(uso)" "heatmap sin recorte al último nivel"
bun test 2>&1 | grep -E ' (pass|fail)$'
# Cierre de inyección: cada defensa, quitada, tiene que dar rojo en el recorrido hoja por hoja.
m src/core/format.js "export const col = h => 'var(--sc-' + token(h) + ')'" "export const col = h => 'var(--sc-' + h + ')'" "tono sin validar"
m src/core/format.js "String(c).replace(/[^\w#%(),. -]/g, '')" "String(c)" "color libre sin lista blanca"
m src/charts/line.js "text-anchor=\"end\">' + esc(t) + '</text>'" "text-anchor=\"end\">' + t + '</text>'" "tick de line sin esc"
m src/charts/segmented.js "';flex:' + num(s.value) + ' 0 0\"'" "';flex:' + s.value + ' 0 0\"'" "flex de segmented crudo"
m src/charts/heatmap.js "esc(pad(h))" "pad(h)" "colTicks de heatmap sin esc"
# Presupuesto: una casilla por nodo en el heatmap (lo que se optimizó: un trazo por nivel) y 200 bytes más de código.
m src/charts/heatmap.js "niveles.forEach((usos, n) => { if (usos.length) s += trazo(usos, tono(n)) })" "niveles.forEach((usos, n) => { usos.forEach(u => { s += trazo([u], tono(n)) }) })" "heatmap un nodo por casilla"
m src/index.js "export const version = '0.1.0'" "export const version = '0.1.0'
export const relleno = crypto.getRandomValues(new Uint8Array(1)) && '$(head -c 6000 /dev/urandom | base64 | tr -d '\n/+=' | head -c 4000)'" "4 000 bytes de código incompresible"
# Color libre con url(, steps no numérico y el meta-test de opciones.
m src/core/format.js "return /url\(/i.test(v) || abiertos !== 0 ? 'var(--sc-neutral)' : v" "return v" "color libre deja pasar url("
m src/charts/heatmap.js "const tope = Math.max(1, Math.floor(num(o.steps)) || 3)" "const tope = Math.max(1, o.steps || 3)" "heatmap steps sin num"
m test/fixtures/opciones.txt "hue2 alertHue maxPoints" "alertHue maxPoints" "opción cubierta que falta en la lista"
m test/fixtures/opciones.txt "columns      label variant" "columns      label variant tooltipFormat" "opción listada sin caso"
# Datos de borde: pie sin la guarda de total cero escribe NaN con todo en cero.
m src/charts/pie.js "(total && vivos.includes(sl) ? n1((sl.value / total) * 100) + '%' : '—')" "(vivos.includes(sl) || !total ? n1((sl.value / total) * 100) + '%' : '—')" "pie divide por total cero"
# Regla de no lanzar y no escribir NaN.
m src/charts/line.js "  o = conEscala(o)
" "" "line sin normalizar max"
m src/charts/heatmap.js "if (!o.values.length || !Array.isArray(o.values[0]) || !o.values[0].length) return vacio()" "" "heatmap vacío sin estado vacío"
m src/charts/rings.js "  if (malo) return malo
" "" "rings sin requerir la estructura"
m src/charts/ribbon.js "  if (rota) return fallo('ribbon', 'el estado \"' + rota[2] + '\" no está en states')
" "" "ribbon sin chequear la referencia"
m src/charts/line.js "  if (o.values.length < 2 && o.buffer) o = { ...o, buffer: false }
" "" "line de un punto con buffer"
m src/core/guardas.js "esc(fn + ': ' + problema)" "fn + ': ' + problema" "detalle del error sin esc"
# Datos que faltan: un dato que falta no es un cero.
m src/core/format.js "return Number.isFinite(n) ? n : null" "return Number.isFinite(n) ? n : 0" "valor(): el hueco vale cero"
m src/charts/line.js "    if (v[i] === null || v[i + 1] === null) continue
" "" "line no corta en el hueco"
m src/charts/stackedLine.js "values: leidas[k].map((v, i) => (hueco(i) ? null : v))" "values: leidas[k]" "stackedLine corta sólo la serie con hueco"
m src/charts/columns.js "    if (val === null && !enCurso) {
      dibujo = ''
    } else if (enCurso) {" "    if (enCurso) {" "columns dibuja la columna sin dato"
m src/core/muestreo.js "        if (hueco < 0) hueco = i
" "" "muestreo saltea el hueco"
# (el filtro de pie con sl.value > 0 es equivalente: un texto se compara igual; el que importa es la suma)
m src/charts/pie.js "vivos.reduce((a, sl) => a + valor(sl.value), 0)" "vivos.reduce((a, sl) => a + sl.value, 0)" "pie suma textos sin valor()"
# gaps.
m src/core/huecos.js "export const conBanda = o => o.gaps !== 'empty'" "export const conBanda = o => o.gaps === 'hatched'" "gaps: el default deja de ser hatched"
m src/charts/line.js "      const x1 = x(b < N - 1 ? b + 1 : b)" "      const x1 = x(b)" "line: la banda no llega a la primera medición después"
m src/charts/stacked.js "o.series.every(se => valor((d.values || {})[se.key]) === null)
" "!d.values
" "stacked: una fila con todos los valores nulos no cuenta como hueco"
m src/charts/columns.js "    } else if (val === 0 && !enCurso) {" "    } else if (false) {" "columns: el cero vuelve a dibujar tapa"
# min en bullet y range.
m src/charts/bullet.js "  const min = num(o.min)
" "  const min = 0
" "bullet ignora min"
m src/charts/range.js "  const min = num(o.min)
" "  const min = 0
" "range ignora min"
# ribbon: format y unit.
m src/charts/ribbon.js "typeof o.format === 'function' ? String(o.format(h)) : reloj(h)" "reloj(h)" "ribbon ignora format"
m src/charts/ribbon.js "const minutos = { s: 1 / 60, min: 1, h: 60, d: 1440 }[o.unit] || 60" "const minutos = 60" "ribbon ignora unit"
# Recorte fuera de escala.
m src/charts/line.js "  const fuera = v.some(n => n !== null && (n > o.max || n < 0))" "  const fuera = false" "line sin recorte"
m src/charts/columns.js "(sePasa(d0) ? recortado(R.k) : '')" "''" "columns sin marcar la columna que se pasa"
m src/charts/stacked.js "const sePasa = partes.reduce((a, q) => a + q.v, 0) > o.max" "const sePasa = false" "stacked sin recorte"
m src/charts/stackedLine.js "  const fuera = sePasa.includes(true)" "  const fuera = false" "stackedLine sin recorte"
# id: salida estable.
m src/core/recursos.js "const k = propio ? '-' + propio : nextId()" "const k = nextId()" "recursos ignora id"
# rings con 5 y 6 anillos.
m src/charts/rings.js "  const paso = n > 4 ? n1(66 / (n - 1)) : 27" "  const paso = 27" "rings: paso fijo con 5 o más"
m src/charts/rings.js "  if (o.rings.length > 6) return fallo('rings', 'entran hasta 6 anillos y vinieron ' + o.rings.length)
" "" "rings sin tope"
# range: marcas del eje.
m src/charts/range.js ".filter(t => valor(t) !== null && valor(t) >= min && valor(t) <= o.max)" "" "range dibuja marcas fuera de escala"
