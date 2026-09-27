import { legend } from './legend.js'
import { FUERTE, SUAVE } from '../core/color.js'
import { n1, esc, col, tinte, valor, n1v } from '../core/format.js'
import { headline } from '../core/headline.js'
import { muestreo } from '../core/muestreo.js'
import { recursos } from '../core/recursos.js'
import { requiere, vacio, fallo, conEscala } from '../core/guardas.js'
import { conBanda, rachasNulas, franja, itemHueco, recorte, recortado } from '../core/huecos.js'

/**
 * Líneas apiladas: cada serie se dibuja ENCIMA de la suma de las anteriores, así que la línea de
 * más arriba es el total y el alto de cada banda es lo que aporta esa serie.
 */
export const stackedLine = entrada => {
  const malo = requiere('stackedLine', entrada, ['series']) || (entrada.series.every(se => se && Array.isArray(se.values)) ? '' : fallo('stackedLine', 'cada serie necesita values, una lista'))

  if (malo) return malo
  if (!entrada.series.length || !entrada.series[0].values.length) return vacio()
  entrada = conEscala(entrada)
  if (entrada.series[0].values.length < 2 && entrada.buffer) entrada = { ...entrada, buffer: false }

  // Si falta el dato de UNA serie en una posición, falta el total: se cortan todas ahí. Una serie
  // más corta que la primera tiene huecos al final.
  const largo = entrada.series[0].values.length
  const leidas = entrada.series.map(se => Array.from({ length: largo }, (_, i) => valor(se.values[i])))
  const hueco = i => leidas.some(vs => vs[i] === null)

  if (leidas.some(vs => vs.includes(null))) entrada = { ...entrada, series: entrada.series.map((se, k) => ({ ...se, values: leidas[k].map((v, i) => (hueco(i) ? null : v)) })) }

  const VB = entrada.wide ? 1100 : 640
  const L = 44, T = 14, W = VB - 60, H = 190
  const N0 = entrada.series[0].values.length
  // El recorte se elige sobre el TOTAL y se aplica igual a todas las series: si cada una
  // eligiera sus puntos, las bandas dejarían de coincidir en el eje.
  const idx = muestreo(entrada.series[0].values.map((_, i) => (hueco(i) ? null : entrada.series.reduce((a, se) => a + se.values[i], 0))), entrada.maxPoints || (entrada.wide ? 1000 : 600))
  // Los valores viajan con un decimal: el gráfico no dibuja más que eso, y con todos los
  // decimales las opciones que se guardan para redibujar pesaban el triple.
  const o = idx
    ? { ...entrada, puntos: idx.map(i => (entrada.puntos ? entrada.puntos[i] : i)), total: entrada.total || N0, labels: entrada.labels ? idx.map(i => entrada.labels[i]) : null, series: entrada.series.map(se => ({ ...se, values: idx.map(i => n1v(se.values[i])) })) }
    : { ...entrada, series: entrada.series.map(se => ({ ...se, values: se.values.map(n1v) })) }
  const ocultas = o.hidden || []
  const vivas = o.series.filter(se => !ocultas.includes(se.key))
  const N = o.series[0].values.length
  const x = i => n1(L + ((o.puntos ? o.puntos[i] : i) / ((o.total || N) - 1 || 1)) * W)
  const y = v => n1(T + (1 - v / o.max) * H)
  const acum = []

  vivas.forEach((se, k) => acum.push(se.values.map((v, i) => (v === null ? null : v + (k ? acum[k - 1][i] : 0)))))

  const techo = (k, i) => y(acum[k][i])
  const piso = (k, i) => (k ? y(acum[k - 1][i]) : y(0))
  const tope = (k, a, b) => { const p = []; for (let i = a; i <= b; i++) p.push(x(i) + ' ' + techo(k, i)); return 'M ' + p.join(' L ') }
  const banda = (k, a, b) => { const p = []; for (let i = b; i >= a; i--) p.push(x(i) + ' ' + piso(k, i)); return tope(k, a, b) + ' L ' + p.join(' L ') + ' Z' }
  const firme = o.buffer ? N - 2 : N - 1
  // Rachas de posiciones medidas: cada una es su propia banda. Sin huecos, una sola.
  const rachas = []
  const lleno = i => o.series[0].values[i] !== null

  for (let i = 0; i <= firme; i++) {
    if (!lleno(i)) continue
    if (i && lleno(i - 1) && rachas.length) rachas[rachas.length - 1][1] = i
    else rachas.push([i, i])
  }
  const R = recursos(id => vivas.map((se, k) =>
    '<linearGradient id="scgs' + id + '_' + k + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:' + col(se.hue) + ';stop-opacity:' + FUERTE / 100 + '"></stop><stop offset="1" style="stop-color:' + col(se.hue) + ';stop-opacity:' + SUAVE / 100 + '"></stop></linearGradient>'
  ).join(''), o.id)
  // Qué series se pasan de la escala: su techo sobre max, o su piso bajo cero.
  const sePasa = vivas.map((_, k) => acum[k].some((t, i) => t !== null && (t > o.max || piso(k, i) > T + H || t < 0)))
  const fuera = sePasa.includes(true)
  let s = '<svg viewBox="0 0 ' + VB + ' 236" role="img" aria-label="' + esc(o.label || 'Series apiladas') + '">' + R.defs + (fuera ? recorte(R.k, L, T, W, H) : '')

  for (const t of o.yTicks || [0, o.max]) {
    s += '<line x1="' + L + '" x2="' + (L + W) + '" y1="' + y(t) + '" y2="' + y(t) + '" style="stroke:var(--sc-line)"></line>'
    s += '<text x="' + (L - 8) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + esc(t) + '</text>'
  }

  // El hueco del total, debajo de las bandas: de la última medición antes a la primera después.
  const huecos = conBanda(o) ? rachasNulas(o.series[0].values) : []

  if (huecos.length) {
    s += '<g data-sc-s="gaps" class="sc-a-in">'
    for (const [a, b] of huecos) {
      const x0 = x(a ? a - 1 : a)
      const x1 = x(b < N - 1 ? b + 1 : b)

      s += franja('x="' + x0 + '" y="' + T + '" width="' + n1(x1 - x0) + '" height="' + H + '"', R)
    }
    s += '</g>'
  }

  vivas.forEach((se, k) => {
    s += '<g data-sc-s="' + esc(se.key) + '" style="--c:' + col(se.hue) + '"' + (sePasa[k] ? recortado(R.k) : fuera ? ' clip-path="url(#sccp' + R.k + ')"' : '') + '>'
    for (const [a, b] of rachas) s += '<path class="sc-a-in" style="--i:' + k + '" d="' + banda(k, a, b) + '" fill="url(#scgs' + R.k + '_' + k + ')"></path>'

    // Buffer: el último tramo todavía está en curso. Banda rayada y línea punteada.
    if (o.buffer && lleno(N - 2) && lleno(N - 1)) {
      s += '<path class="sc-a-in" style="--i:' + (k + 3) + ';fill:' + tinte(se.hue, 'var(--sc-track)') + '" d="' + banda(k, N - 2, N - 1) + '"></path>'
      s += '<g class="sc-a-in" style="--i:' + (k + 3) + '"><path d="' + banda(k, N - 2, N - 1) + '" mask="' + R.d + '" class="sc-hatch" style="fill:' + col(se.hue) + '"></path></g>'
      s += '<path class="sc-a-in" style="--i:' + (k + 3) + ';stroke:' + col(se.hue) + '" d="' + tope(k, N - 2, N - 1) + '" fill="none" stroke-width="2.2" stroke-dasharray="3 4" stroke-linecap="round"></path>'
    }

    for (const [a, b] of rachas) s += '<path class="sc-a-draw" pathLength="100" d="' + tope(k, a, b) + '" fill="none" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" style="stroke:' + col(se.hue) + ';--i:' + k * 2 + '"></path>'
    if (lleno(N - 1)) s += '<circle class="sc-glow sc-a-in" cx="' + x(N - 1) + '" cy="' + techo(k, N - 1) + '" r="5" stroke-width="2.5" style="fill:' + col(se.hue) + ';stroke:var(--sc-surface);--i:' + (k + 4) + '"></circle>'
    s += '</g>'
  })

  const datos = { s: vivas.map(se => ({ n: se.label, h: se.hue, v: se.values.map(n1v) })), l: o.labels || null, p: o.puntos || null, n0: o.total || N, max: o.max, L, T, W, H, u: o.unit || '', buf: Boolean(o.buffer), tot: o.totalLabel || 'Total' }

  s += '<line class="sc-guia" x1="0" x2="0" y1="' + T + '" y2="' + y(0) + '" visibility="hidden" opacity=".5" style="stroke:var(--sc-muted)"></line>'
  for (const se of vivas) s += '<circle class="sc-pto" cx="0" cy="0" r="4.5" stroke-width="2.5" visibility="hidden" style="fill:' + col(se.hue) + ';stroke:var(--sc-surface)"></circle>'
  s += '<rect data-sc-area="' + esc(JSON.stringify(datos)) + '" x="' + L + '" y="' + T + '" width="' + W + '" height="' + H + '" fill="transparent" style="cursor:crosshair"></rect>'

  ;(o.xTicks || []).forEach((t, i, todos) => {
    s += '<text x="' + n1(L + (t.at / ((o.total || N) - 1 || 1)) * W) + '" y="226" text-anchor="' + (i === 0 ? 'start' : i === todos.length - 1 ? 'end' : 'middle') + '">' + esc(t.label) + '</text>'
  })
  if (o.unit) s += '<text x="' + (L - 8) + '" y="226" text-anchor="end" style="fill:var(--sc-faint)">' + esc(o.unit) + '</text>'

  const items = o.series.map(se => ({ key: se.key, label: se.label, hue: se.hue, off: ocultas.includes(se.key) }))

  if (huecos.length) items.push(itemHueco())
  if (o.buffer) items.push({ label: o.bufferLabel || 'En curso', hue: 'neutral', hatched: true })

  // Las opciones viajan con el gráfico: apagar una serie cambia la suma de las de arriba.
  return '<div class="sc-chart sc-stackedline" data-sc-chart="stackedLine" data-sc-opts="' + esc(JSON.stringify(o)) + '">' + headline(o.headline) + legend(items) +
    '<div class="sc-scroll' + (o.wide ? ' sc-xl' : '') + '">' + s + '</svg></div></div>'
}
