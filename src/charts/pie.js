import { FUERTE, SUAVE } from '../core/color.js'
import { n1, esc, col, tinte, cuenta, tip, valor } from '../core/format.js'
import { recursos } from '../core/recursos.js'
import { requiere, vacio } from '../core/guardas.js'

export const pie = o => {
  const malo = requiere('pie', o, ['slices'])

  if (malo) return malo
  if (!o.slices.length) return vacio()

  const ocultas = o.hidden || []
  // Una porción sin valor no entra al reparto; en la lista figura con el guion largo.
  const vivos = o.slices.filter(sl => !ocultas.includes(sl.key) && valor(sl.value) > 0)
  const total = vivos.reduce((a, sl) => a + valor(sl.value), 0)
  const c = 130
  const ro = 112
  const ri = o.variant === 'donut' ? 66 : 0
  const linea = o.fill !== 'solid'
  const punto = (r, a) => n1(c + r * Math.cos(a)) + ' ' + n1(c + r * Math.sin(a))
  const pct = sl => (total && vivos.includes(sl) ? n1((valor(sl.value) / total) * 100) + '%' : '—')
  const R = recursos(k => vivos.map((sl, i) =>
    '<radialGradient id="scgp' + k + '_' + i + '" gradientUnits="userSpaceOnUse" cx="' + c + '" cy="' + c + '" r="' + ro + '">' +
      '<stop offset="' + n1(ri / ro) + '" style="stop-color:' + col(sl.hue) + ';stop-opacity:' + SUAVE / 100 + '"></stop>' +
      '<stop offset="1" style="stop-color:' + col(sl.hue) + ';stop-opacity:' + FUERTE / 100 + '"></stop></radialGradient>'
  ).join(''), o.id)
  let a0 = -Math.PI / 2
  let rellenos = ''
  let bordes = ''

  vivos.forEach((sl, i) => {
    const a1 = a0 + Math.min(valor(sl.value) / total, 0.9999) * Math.PI * 2
    const largo = a1 - a0 > Math.PI ? 1 : 0
    const d = ri
      ? 'M ' + punto(ro, a0) + ' A ' + ro + ' ' + ro + ' 0 ' + largo + ' 1 ' + punto(ro, a1) + ' L ' + punto(ri, a1) + ' A ' + ri + ' ' + ri + ' 0 ' + largo + ' 0 ' + punto(ri, a0) + ' Z'
      : 'M ' + c + ' ' + c + ' L ' + punto(ro, a0) + ' A ' + ro + ' ' + ro + ' 0 ' + largo + ' 1 ' + punto(ro, a1) + ' Z'
    const datos = ' data-sc-s="' + esc(sl.key) + '"' + tip(sl.label, o.unit ? cuenta(sl.value, o.unit) : sl.value, pct(sl) + ' del total', sl.hue)

    if (linea) {
      // Igual que una banda de las líneas apiladas, pero enrollada: relleno translúcido que se
      // apaga hacia el centro, la línea de su color en el borde de afuera y otra en el radio
      // donde la porción empieza. Esa segunda línea es la frontera con la porción anterior.
      const rr = ro - 1.25
      const raya = sl.hatched ? ' stroke-dasharray="3 4"' : ''

      rellenos += '<g' + datos + '>' + (sl.hatched
        ? '<path d="' + d + '" style="fill:' + tinte(sl.hue, 'var(--sc-track)') + '"></path><path d="' + d + '" mask="' + R.d + '" class="sc-hatch" style="fill:' + col(sl.hue) + '"></path>'
        : '<path d="' + d + '" fill="url(#scgp' + R.k + '_' + i + ')"></path>') + '</g>'
      bordes += '<g data-sc-s="' + esc(sl.key) + '" fill="none" stroke-width="2.5" style="stroke:' + col(sl.hue) + '">' +
        '<path d="M ' + punto(rr, a0) + ' A ' + rr + ' ' + rr + ' 0 ' + largo + ' 1 ' + punto(rr, a1) + '"' + raya + '></path>' +
        (vivos.length > 1 ? '<path d="M ' + punto(ri, a0) + ' L ' + punto(rr, a0) + '" stroke-linecap="round"' + raya + '></path>' : '') + '</g>'
    } else {
      const trazo = ' stroke-width="3" stroke-linejoin="round"'

      rellenos += '<g' + datos + '>' + (sl.hatched
        ? '<path d="' + d + '"' + trazo + ' style="stroke:var(--sc-surface);fill:' + tinte(sl.hue, 'var(--sc-track)') + '"></path><path d="' + d + '"' + trazo + ' mask="' + R.d + '" class="sc-hatch" style="stroke:var(--sc-surface);fill:' + col(sl.hue) + '"></path>'
        : '<path d="' + d + '"' + trazo + ' style="stroke:var(--sc-surface);fill:' + col(sl.hue) + '"></path>') + '</g>'
    }

    a0 = a1
  })

  let s = '<svg viewBox="0 0 260 260" role="img" aria-label="' + esc(o.label || 'Reparto') + '">' + R.defs + '<g class="sc-a-pie">'

  if (!vivos.length) s += '<circle cx="' + c + '" cy="' + c + '" r="' + (ro + ri) / 2 + '" fill="none" stroke-width="' + (ro - ri) + '" style="stroke:' + tinte('neutral', 'var(--sc-track)') + '"></circle>'
  // Todos los rellenos primero y todas las líneas después: así ningún relleno tapa una línea.
  s += rellenos + bordes + '</g>'

  if (ri && o.center) {
    s += '<text x="130" y="136" text-anchor="middle" class="sc-strong" style="font-family:var(--sc-font);font-size:30px;font-weight:700">' + esc(o.center.value) + '</text>'
    s += '<text x="130" y="153" text-anchor="middle" style="font-size:9px;letter-spacing:.08em">' + esc(String(o.center.label).toUpperCase()) + '</text>'
  }

  // Las opciones viajan con el gráfico: al apagar una porción hay que volver a repartir el
  // círculo, y eso es redibujar, no esconder.
  return '<div class="sc-chart sc-pie" data-sc-chart="pie" data-sc-opts="' + esc(JSON.stringify(o)) + '"><div class="sc-split"><div>' + s + '</svg></div><div class="sc-rows">' +
    o.slices.map(sl => '<button type="button" class="sc-row" data-sc-leg="' + esc(sl.key) + '" aria-pressed="' + !ocultas.includes(sl.key) + '"><i class="sc-sq' + (sl.hatched ? ' sc-h' : '') + '" style="--c:' + col(sl.hue) + '"></i><span>' + esc(sl.label) + '</span><span class="sc-t">' + esc(sl.value) + '</span><b>' + pct(sl) + '</b></button>').join('') +
  '</div></div></div>'
}
