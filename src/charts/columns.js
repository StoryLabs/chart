import { legend } from './legend.js'
import { n1, esc, col, tinte, cuenta, tip, valor } from '../core/format.js'
import { recursos } from '../core/recursos.js'
import { requiere, vacio, conEscala } from '../core/guardas.js'
import { textos } from '../core/textos.js'
import { conBanda, franja, itemHueco, recorte, recortado } from '../core/huecos.js'

export const columns = o => {
  const malo = requiere('columns', o, ['data'])

  if (malo) return malo
  if (!o.data.length) return vacio()
  o = conEscala(o)

  const hue = o.hue || 'sky'
  const variante = o.variant || 'solid'
  const R = recursos(k => '<linearGradient id="scgc' + k + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:' + col(hue) + '"></stop><stop offset="1" style="stop-color:' + col(hue) + ';stop-opacity:.12"></stop></linearGradient>')
  const L = 30, T = 12, W = 480, H = 170
  const paso = W / o.data.length
  const ancho = paso * 0.56
  const y = v => n1(T + (1 - v / o.max) * H)
  const base = T + H
  // Columna con SOLO las esquinas de arriba redondeadas; xa y xb permiten dibujar media columna.
  const forma = (xa, xb, yb, yt, ra, rb) =>
    'M ' + xa + ' ' + yb + ' V ' + (yt + ra) + ' Q ' + xa + ' ' + yt + ' ' + (xa + ra) + ' ' + yt + ' H ' + (xb - rb) + ' Q ' + xb + ' ' + yt + ' ' + xb + ' ' + (yt + rb) + ' V ' + yb + ' Z'
  const sePasa = d => [d.value, d.projected].some(n => valor(n) !== null && (valor(n) > o.max || valor(n) < 0))
  const fuera = o.data.some(sePasa)
  let s = '<svg viewBox="0 0 520 214" role="img" aria-label="' + esc(o.label || 'Columnas') + '">' + R.defs + (fuera ? recorte(R.k, L, T, W, H) : '')

  for (const t of o.yTicks || [0, o.max]) {
    s += '<line x1="' + L + '" x2="' + (L + W) + '" y1="' + y(t) + '" y2="' + y(t) + '" style="stroke:var(--sc-line)"></line>'
    s += '<text x="' + (L - 8) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + esc(t) + '</text>'
  }

  o.data.forEach((d0, i) => {
    // Un dato que falta no es un cero: esa columna no se dibuja, y el tooltip lo dice.
    const val = valor(d0.value)
    const d = { ...d0, value: val === null ? 0 : val }
    const cx = L + paso * (i + 0.5)
    const xa = n1(cx - ancho / 2)
    const xb = n1(cx + ancho / 2)
    const r = Math.min(6, Math.max(0, n1(base - y(d.value))))
    const entera = yt => forma(xa, xb, base, yt, r, r)
    const rayada = yt => '<path d="' + forma(xa, xb, base, yt, 6, 6) + '" style="fill:' + tinte(hue, 'var(--sc-track)') + '"></path><path d="' + forma(xa, xb, base, yt, 6, 6) + '" mask="' + R.d + '" class="sc-hatch" fill="url(#scgc' + R.k + ')"></path>'
    const enCurso = d.projected !== undefined && d.projected !== null
    let dibujo

    if (val === null && !enCurso) {
      // La columna que falta: rayada neutra de todo el alto, para no confundirse con una en cero.
      dibujo = conBanda(o) ? '<g data-sc-s="gaps">' + franja('x="' + xa + '" y="' + T + '" width="' + n1(xb - xa) + '" height="' + H + '" rx="6"', R) + '</g>' : ''
    } else if (val === 0 && !enCurso) {
      // Un cero es un valor medido: no hay cuerpo ni tapa que dibujar, pero el hover y el tooltip siguen.
      dibujo = ''
    } else if (enCurso) {
      dibujo = rayada(y(d.projected)) + '<rect x="' + xa + '" y="' + y(d.value) + '" width="' + n1(xb - xa) + '" height="' + n1(base - y(d.value)) + '" style="fill:' + col(hue) + '"></rect>'
    } else if (variante === 'stripped') {
      dibujo = '<path d="' + entera(y(d.value)) + '" style="fill:' + tinte(hue, '24%') + '"></path><path d="' + forma(xa, xb, y(d.value) + 5, y(d.value), 5, 5) + '" style="fill:' + col(hue) + '"></path>'
    } else if (variante === 'gradient') {
      dibujo = '<path d="' + entera(y(d.value)) + '" fill="url(#scgc' + R.k + ')"></path>'
    } else if (variante === 'duotone') {
      dibujo = '<path d="' + entera(y(d.value)) + '" style="fill:' + tinte(hue, '38%') + '"></path><path d="' + forma(n1(cx), xb, base, y(d.value), 0, r) + '" style="fill:' + col(hue) + '"></path>'
    } else if (variante === 'hatched') {
      dibujo = rayada(y(d.value))
    } else {
      dibujo = '<path d="' + entera(y(d.value)) + '" style="fill:' + col(hue) + '"></path>'
    }

    s += '<g class="sc-a-y" data-sc-s="c' + i + '" style="--i:' + i + '"' + (sePasa(d0) ? recortado(R.k) : '') +
      tip(d.title || d.label, val === null ? textos.empty : o.unit ? cuenta(d.value, o.unit) : d.value, enCurso ? 'En curso. Proyección al cierre: ' + d.projected : 'Completo', hue) + '>' + dibujo +
      '<rect x="' + n1(cx - paso / 2) + '" y="' + T + '" width="' + n1(paso) + '" height="' + H + '" fill="transparent"></rect></g>'
    s += '<text x="' + n1(cx) + '" y="' + (base + 17) + '" text-anchor="middle"' + (enCurso ? ' class="sc-strong"' : '') + '>' + esc(d.label) + '</text>'
  })

  return '<div class="sc-chart sc-columns"><div class="sc-scroll">' + s + '</svg></div>' +
    legend([{ label: 'Medido', hue }, { label: 'En curso', hue, hatched: true }].concat(conBanda(o) && o.data.some(d => valor(d.value) === null && d.projected == null) ? [itemHueco()] : []), false) + '</div>'
}
