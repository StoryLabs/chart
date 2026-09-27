import { legend } from './legend.js'
import { n1, esc, col, tinte, conUnidad, valor } from '../core/format.js'
import { headline } from '../core/headline.js'
import { muestreo } from '../core/muestreo.js'
import { recursos } from '../core/recursos.js'
import { requiere, vacio, conEscala } from '../core/guardas.js'
import { conBanda, rachasNulas, franja, itemHueco, recorte, recortado } from '../core/huecos.js'

export const line = o => {
  const malo = requiere('line', o, ['values'])

  if (malo) return malo
  if (!o.values.length) return vacio()
  o = conEscala(o)
  // Un punto solo es un punto: no hay tramo en curso que dibujar.
  if (o.values.length < 2 && o.buffer) o = { ...o, buffer: false }

  const vs = o.values.map(valor)
  const idx = muestreo(vs, o.maxPoints || 600)
  const v = idx ? idx.map(i => vs[i]) : vs
  const rotulos = o.labels ? (idx ? idx.map(i => o.labels[i]) : o.labels) : null
  const N = v.length
  const N0 = o.values.length
  const L = 44, T = 14, W = 580, H = 190
  const hue = o.hue || 'blue'
  const alerta = o.alertHue || 'amber'
  const thr = o.threshold ? o.threshold.value : null
  // Cada punto va en el lugar que le toca por su posición ORIGINAL: los que sobrevivieron al
  // recorte no quedan repartidos parejo, y dibujarlos parejo deformaría el eje del tiempo.
  const x = i => n1(L + ((idx ? idx[i] : i) / (N0 - 1 || 1)) * W)
  const y = val => n1(T + (1 - val / o.max) * H)
  const y0 = y(0)
  const pts = (a, b) => { const p = []; for (let i = a; i <= b; i++) p.push(x(i) + ' ' + y(v[i])); return 'M ' + p.join(' L ') }
  const area = (a, b) => pts(a, b) + ' L ' + x(b) + ' ' + y0 + ' L ' + x(a) + ' ' + y0 + ' Z'
  const grad = (id, h, vertical, fin) => '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (vertical ? 0 : 1) + '" y2="' + (vertical ? 1 : 0) + '"><stop offset="0" style="stop-color:' + col(h) + (vertical ? ';stop-opacity:.4' : '') + '"></stop><stop offset="1" style="stop-color:' + col(fin || h) + (vertical ? ';stop-opacity:0' : '') + '"></stop></linearGradient>'
  const R = recursos(k => grad('scga' + k, hue, true) + grad('scgw' + k, alerta, true) + grad('scgb' + k, hue, false, o.hue2 || 'sky'))
  const firme = o.buffer ? N - 2 : N - 1
  const tramos = []

  // Un tramo por cada racha a un mismo lado del umbral: la línea puede cruzarlo las veces que sea.
  // Un hueco corta la línea: no hay trazo ni área sobre lo que no se midió.
  for (let i = 0; i < firme; i++) {
    if (v[i] === null || v[i + 1] === null) continue

    const arriba = thr !== null && v[i + 1] >= thr
    const t = tramos[tramos.length - 1]

    if (t && t.arriba === arriba && t.b === i) t.b = i + 1
    else tramos.push({ a: i, b: i + 1, arriba })
  }

  const fuera = v.some(n => n !== null && (n > o.max || n < 0))
  let s = '<svg viewBox="0 0 640 236" role="img" aria-label="' + esc(o.label || 'Serie en el tiempo') + '">' + R.defs + (fuera ? recorte(R.k, L, T, W, H) : '')

  for (const t of o.yTicks || [0, o.max]) {
    s += '<line x1="' + L + '" x2="' + (L + W) + '" y1="' + y(t) + '" y2="' + y(t) + '" style="stroke:var(--sc-line)"></line>'
    s += '<text x="' + (L - 8) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + esc(t) + '</text>'
  }

  if (o.band) {
    const caja = 'x="' + L + '" y="' + y(o.band[1]) + '" width="' + W + '" height="' + n1(y(o.band[0]) - y(o.band[1])) + '"'

    s += '<g data-sc-s="band" class="sc-a-in"><rect ' + caja + ' style="fill:' + tinte(hue, 'var(--sc-track)') + '"></rect><rect ' + caja + ' fill="url(#scgb' + R.k + ')" mask="' + R.d + '" class="sc-hatch"></rect></g>'
  }

  if (thr !== null) {
    s += '<g data-sc-s="threshold" class="sc-a-in"><line x1="' + L + '" x2="' + (L + W) + '" y1="' + y(thr) + '" y2="' + y(thr) + '" stroke-width="1.5" stroke-dasharray="5 5" style="stroke:' + col(alerta) + '"></line>' +
      '<text x="' + (L + 6) + '" y="' + (y(thr) - 7) + '" style="fill:' + col(alerta) + '">' + esc(o.threshold.label || 'umbral ' + conUnidad(thr, o.unit)) + '</text></g>'
  }

  // El hueco: encima de la referencia y del umbral, debajo de la línea. De la última medición antes
  // a la primera después; un hueco en un borde llega hasta el borde.
  const huecos = conBanda(o) ? rachasNulas(v) : []

  if (huecos.length) {
    s += '<g data-sc-s="gaps" class="sc-a-in">'
    for (const [a, b] of huecos) {
      const x0 = x(a ? a - 1 : a)
      const x1 = x(b < N - 1 ? b + 1 : b)

      s += franja('x="' + x0 + '" y="' + T + '" width="' + n1(x1 - x0) + '" height="' + H + '"', R)
    }
    s += '</g>'
  }

  s += '<g data-sc-s="series"' + (fuera ? recortado(R.k) : '') + '>'
  for (const t of tramos) s += '<path class="sc-a-in" d="' + area(t.a, t.b) + '" fill="url(#scg' + (t.arriba ? 'w' : 'a') + R.k + ')"></path>'
  tramos.forEach((t, i) => { s += '<path class="sc-a-draw" pathLength="100" d="' + pts(t.a, t.b) + '" fill="none" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" style="stroke:' + col(t.arriba ? alerta : hue) + ';--i:' + i * 5 + '"></path>' })
  // Un punto aislado entre dos huecos se dibuja como punto.
  for (let i = 0; i <= firme; i++) {
    if (v[i] !== null && (i === 0 || v[i - 1] === null) && (i === N - 1 || v[i + 1] === null)) s += '<circle class="sc-a-in" cx="' + x(i) + '" cy="' + y(v[i]) + '" r="2.5" style="fill:' + col(thr !== null && v[i] >= thr ? alerta : hue) + '"></circle>'
  }
  s += '</g>'

  const finHue = thr !== null && v[N - 1] >= thr ? alerta : hue

  // Buffer: el último punto todavía está en curso. Su tramo va punteado y el área, rayada.
  s += '<g data-sc-s="buffer" class="sc-a-in" style="--c:' + col(finHue) + ';--i:8"' + (fuera ? ' clip-path="url(#sccp' + R.k + ')"' : '') + '>'
  if (o.buffer && v[N - 2] !== null && v[N - 1] !== null) {
    s += '<path d="' + area(N - 2, N - 1) + '" style="fill:' + tinte(finHue, 'var(--sc-track)') + '"></path>'
    s += '<path d="' + area(N - 2, N - 1) + '" mask="' + R.d + '" class="sc-hatch" style="fill:' + col(finHue) + '"></path>'
    s += '<path d="' + pts(N - 2, N - 1) + '" fill="none" stroke-width="2.2" stroke-dasharray="3 4" stroke-linecap="round" style="stroke:' + col(finHue) + '"></path>'
  }
  if (v[N - 1] !== null) s += '<circle class="sc-glow" cx="' + x(N - 1) + '" cy="' + y(v[N - 1]) + '" r="5.5" stroke-width="3" style="fill:' + col(finHue) + ';stroke:var(--sc-surface)"></circle>'
  s += '</g>'

  const datos = { v: v.map(n => (n === null ? null : n1(n))), l: rotulos, p: idx, n0: N0, max: o.max, thr, band: o.band || null, L, T, W, H, u: o.unit || '', hue, alerta, buf: Boolean(o.buffer) }

  s += '<line class="sc-guia" x1="0" x2="0" y1="' + T + '" y2="' + y0 + '" visibility="hidden" opacity=".5" style="stroke:var(--sc-muted)"></line>'
  s += '<circle class="sc-pto" cx="0" cy="0" r="5" stroke-width="2.5" visibility="hidden" style="stroke:var(--sc-surface)"></circle>'
  s += '<rect data-sc-line="' + esc(JSON.stringify(datos)) + '" x="' + L + '" y="' + T + '" width="' + W + '" height="' + H + '" fill="transparent" style="cursor:crosshair"></rect>'

  if (o.xLabels) s += '<text x="' + L + '" y="226">' + esc(o.xLabels[0]) + '</text><text x="' + (L + W) + '" y="226" text-anchor="end">' + esc(o.xLabels[1]) + '</text>'
  if (o.unit) s += '<text x="' + (L - 8) + '" y="226" text-anchor="end" style="fill:var(--sc-faint)">' + esc(o.unit) + '</text>'

  const items = [{ key: 'series', label: o.label || 'Serie', hue }]

  if (o.band) items.push({ key: 'band', label: 'Rango normal, ' + o.band[0] + ' a ' + conUnidad(o.band[1], o.unit), hue, hatched: true })
  if (thr !== null) items.push({ key: 'threshold', label: 'Umbral de ' + conUnidad(thr, o.unit), hue: alerta })
  if (huecos.length) items.push(itemHueco())
  if (o.buffer) items.push({ key: 'buffer', label: o.bufferLabel || 'En curso', hue: finHue, hatched: true })

  return '<div class="sc-chart sc-line">' + headline(o.headline) + legend(items) + '<div class="sc-scroll">' + s + '</svg></div></div>'
}
