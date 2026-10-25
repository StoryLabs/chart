import { legend } from './legend.js'
import { n1, esc, col, tinte, conUnidad, valor, num, esFmt, tk } from '../core/format.js'
import { headline } from '../core/headline.js'
import { muestreo } from '../core/muestreo.js'
import { recursos } from '../core/recursos.js'
import { requiere, vacio, conEscala } from '../core/guardas.js'
import { textos, t } from '../core/textos.js'
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
  // El margen izquierdo se ajusta al rótulo más ancho del eje: una marca de moneda ($35.5K) no entra en 44 px.
  const tickTxt = (o.yTicks || [num(o.min), o.max]).map(t => String(tk(t, o.unit)))
  const L = esFmt(o.unit) ? Math.max(44, Math.ceil(Math.max(...tickTxt.map(x => x.length), 0) * 6.8 + 14)) : 44, T = 14, W = 580, H = 190
  const hue = o.hue || 'blue'
  const alerta = o.alertHue || 'amber'
  const thr = o.threshold ? o.threshold.value : null
  // Cada punto va en el lugar que le toca por su posición ORIGINAL: los que sobrevivieron al
  // recorte no quedan repartidos parejo, y dibujarlos parejo deformaría el eje del tiempo.
  const x = i => n1(L + ((idx ? idx[i] : i) / (N0 - 1 || 1)) * W)
  // La escala va de `min` (0 por defecto) a `max`. El fondo del área es siempre el borde de abajo del gráfico.
  const min = num(o.min)
  const y = val => n1(T + (1 - (val - min) / (o.max - min)) * H)
  const y0 = n1(T + H)
  const pts = (a, b) => { const p = []; for (let i = a; i <= b; i++) p.push(x(i) + ' ' + y(v[i])); return 'M ' + p.join(' L ') }
  const area = (a, b) => pts(a, b) + ' L ' + x(b) + ' ' + y0 + ' L ' + x(a) + ' ' + y0 + ' Z'
  const grad = (id, h, vertical, fin) => '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (vertical ? 0 : 1) + '" y2="' + (vertical ? 1 : 0) + '"><stop offset="0" style="stop-color:' + col(h) + (vertical ? ';stop-opacity:.4' : '') + '"></stop><stop offset="1" style="stop-color:' + col(fin || h) + (vertical ? ';stop-opacity:0' : '') + '"></stop></linearGradient>'
  const R = recursos(k => grad('scga' + k, hue, true) + grad('scgw' + k, alerta, true) + grad('scgb' + k, hue, false, o.hue2 || 'sky'), o.id)
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

  const fuera = v.some(n => n !== null && (n > o.max || n < min))
  // Pista: una franja bajo el área, de un estado por tramo (from y to en posiciones ORIGINALES, como `events`). Con ella el gráfico crece 14 px hacia abajo.
  const pista = (o.track || []).filter(g => g && Number.isFinite(g.from) && Number.isFinite(g.to) && g.to > g.from)
  const dy = pista.length ? 14 : 0
  let s = '<svg viewBox="0 0 ' + (L + W + 16) + ' ' + (236 + dy) + '" role="img" aria-label="' + esc(o.label || textos.lineLabel) + '">' + R.defs + (fuera ? recorte(R.k, L, T, W, H, v.some(n => n !== null && n < min)) : '')

  for (const t of o.yTicks || [min, o.max]) {
    s += '<line x1="' + L + '" x2="' + (L + W) + '" y1="' + y(t) + '" y2="' + y(t) + '" style="stroke:var(--sc-line)"></line>'
    s += '<text x="' + (L - 8) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + esc(tk(t, o.unit)) + '</text>'
  }

  // Con una escala que cruza el cero, el cero se marca: es la frontera entre ganar y perder.
  if (min < 0 && o.max > 0) s += '<line x1="' + L + '" x2="' + (L + W) + '" y1="' + y(0) + '" y2="' + y(0) + '" stroke-dasharray="3 4" opacity=".6" style="stroke:var(--sc-muted)"></line>'

  // Un tramo de la pista con `shade` también tiñe el área de arriba, a lo alto del gráfico (detrás de la serie).
  for (const g of pista) {
    if (!g.shade) continue

    const a = Math.max(0, g.from)

    s += '<rect x="' + n1(L + (a / (N0 - 1 || 1)) * W) + '" y="' + T + '" width="' + Math.max(3, n1(((Math.min(N0 - 1, g.to) - a) / (N0 - 1 || 1)) * W)) + '" height="' + H + '" opacity=".16" style="fill:' + col(g.hue) + '"></rect>'
  }

  if (o.band) {
    const caja = 'x="' + L + '" y="' + y(o.band[1]) + '" width="' + W + '" height="' + n1(y(o.band[0]) - y(o.band[1])) + '"'

    s += '<g data-sc-s="band" class="sc-a-in"><rect ' + caja + ' style="fill:' + tinte(hue, 'var(--sc-track)') + '"></rect><rect ' + caja + ' fill="url(#scgb' + R.k + ')" mask="' + R.d + '" class="sc-hatch"></rect></g>'
  }

  if (thr !== null) {
    s += '<g data-sc-s="threshold" class="sc-a-in"><line x1="' + L + '" x2="' + (L + W) + '" y1="' + y(thr) + '" y2="' + y(thr) + '" stroke-width="1.5" stroke-dasharray="5 5" style="stroke:' + col(alerta) + '"></line>' +
      (o.threshold.label === '' ? '' : '<text x="' + (L + 6) + '" y="' + (y(thr) - 7) + '" style="fill:' + col(alerta) + ';paint-order:stroke;stroke:var(--sc-surface);stroke-width:4px;stroke-linejoin:round">' + esc(o.threshold.label || t('thresholdLabel', { value: conUnidad(thr, o.unit) })) + '</text>') + '</g>'
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

  // Serie de comparación: la misma escala y el mismo eje, punteada (una referencia, no la medición principal).
  const cmp = o.compare && Array.isArray(o.compare.values) ? Array.from({ length: N0 }, (_, i) => valor(o.compare.values[i])) : null
  const c = cmp ? (idx ? idx.map(i => cmp[i]) : cmp) : null

  if (c && c.some(n => n !== null)) {
    let d = ''

    c.forEach((n, i) => {
      if (n !== null) d += (i && c[i - 1] !== null ? ' L ' : ' M ') + x(i) + ' ' + y(n)
    })
    s += '<g data-sc-s="compare" class="sc-a-in"' + (fuera ? recortado(R.k) : '') + '><path d="' + d + '" fill="none" stroke-width="1.8" stroke-dasharray="5 4" stroke-linecap="round" stroke-linejoin="round" style="stroke:' + col(o.compare.hue || 'neutral') + '"></path></g>'
  }

  // Movimientos (depósitos, retiros, dividendos): una guía vertical y un punto sobre la serie, en la posición ORIGINAL.
  const evs = (o.events || []).filter(e => e && Number.isInteger(e.at) && e.at >= 0 && e.at < N0 && vs[e.at] !== null)

  if (evs.length) {
    s += '<g data-sc-s="events" class="sc-a-in">'
    for (const e of evs) {
      const ex = n1(L + (e.at / (N0 - 1 || 1)) * W)
      const eh = col(e.hue || 'violet')

      s += '<line x1="' + ex + '" x2="' + ex + '" y1="' + T + '" y2="' + y0 + '" stroke-width="1" stroke-dasharray="2 4" opacity=".55" style="stroke:' + eh + '"></line>' +
        '<circle cx="' + ex + '" cy="' + y(vs[e.at]) + '" r="3.5" stroke-width="2" style="fill:' + eh + ';stroke:var(--sc-surface)"></circle>'
    }
    s += '</g>'
  }


  if (pista.length) {
    s += '<g class="sc-a-in">'
    for (const g of pista) {
      const a = Math.max(0, g.from)
      const b = Math.min(N0 - 1, g.to)

      s += '<rect data-sc-s="' + esc(g.key || g.label) + '" x="' + n1(L + (a / (N0 - 1 || 1)) * W) + '" y="' + (T + H + 7) + '" width="' + Math.max(3, n1(((b - a) / (N0 - 1 || 1)) * W)) + '" height="8" rx="4" style="fill:' + col(g.hue) + '"></rect>'
    }
    s += '</g>'
  }

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

  // Con una especificación de formato (moneda, %) los valores viajan con centavos; si no, con un decimal.
  const r = esFmt(o.unit) ? n => Math.round(n * 100) / 100 : n1
  const datos = { v: v.map(n => (n === null ? null : r(n))), l: rotulos, p: idx, n0: N0, ...(min ? { min } : {}), max: o.max, thr, band: o.band || null, L, T, W, H, u: o.unit || '', hue, alerta, buf: Boolean(o.buffer) }
  if (o.threshold && o.threshold.aboveText) datos.ta = String(o.threshold.aboveText)
  if (c && c.some(n => n !== null)) Object.assign(datos, { c: c.map(n => (n === null ? null : r(n))), cn: o.compare.label || textos.compare, ch: o.compare.hue || 'neutral' })
  if (pista.length) datos.tr = pista.map(g => [g.from, g.to, g.label || '', g.hue])
  if (evs.length) datos.ev = evs.map(e => ({ a: e.at, t: e.label || '', h: e.hue || 'violet' }))

  s += '<line class="sc-guia" x1="0" x2="0" y1="' + T + '" y2="' + y0 + '" visibility="hidden" opacity=".5" style="stroke:var(--sc-muted)"></line>'
  s += '<circle class="sc-pto" cx="0" cy="0" r="5" stroke-width="2.5" visibility="hidden" style="stroke:var(--sc-surface)"></circle>'
  s += '<rect data-sc-line="' + esc(JSON.stringify(datos)) + '" x="' + L + '" y="' + T + '" width="' + W + '" height="' + H + '" fill="transparent" style="cursor:crosshair"></rect>'

  if (o.xLabels) s += '<text x="' + L + '" y="' + (226 + dy) + '">' + esc(o.xLabels[0]) + '</text><text x="' + (L + W) + '" y="' + (226 + dy) + '" text-anchor="end">' + esc(o.xLabels[1]) + '</text>'
  if (o.unit && !esFmt(o.unit)) s += '<text x="' + (L - 8) + '" y="' + (226 + dy) + '" text-anchor="end" style="fill:var(--sc-faint)">' + esc(o.unit) + '</text>'

  const items = [{ key: 'series', label: o.label || textos.series, hue: o.legendHue || hue }]

  if (o.band) items.push({ key: 'band', label: t('band', { from: o.band[0], to: conUnidad(o.band[1], o.unit) }), hue, hatched: true })
  if (thr !== null) items.push({ key: 'threshold', label: o.threshold.legend || t('thresholdLegend', { value: conUnidad(thr, o.unit) }), hue: alerta })
  if (c && c.some(n => n !== null)) items.push({ key: 'compare', label: o.compare.label || textos.compare, hue: o.compare.hue || 'neutral' })
  for (const g of pista) if (g.label && !items.some(it => it.key === (g.key || g.label))) items.push({ key: g.key || g.label, label: g.label, hue: g.hue })
  if (evs.length) items.push({ key: 'events', label: o.eventsLabel || textos.events, hue: o.eventsHue || (evs[0] && evs[0].hue) || 'violet' })
  if (huecos.length) items.push(itemHueco())
  if (o.buffer) items.push({ key: 'buffer', label: o.bufferLabel || textos.inProgress, hue: finHue, hatched: true })

  return '<div class="sc-chart sc-line">' + headline(o.headline) + legend(items) + '<div class="sc-scroll">' + s + '</svg></div></div>'
}
