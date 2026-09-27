import { n1, entre, esc, col, tinte, tip, valor } from '../core/format.js'
import { recursos } from '../core/recursos.js'
import { requiere, vacio } from '../core/guardas.js'
import { textos } from '../core/textos.js'

export const rings = o => {
  const malo = requiere('rings', o, ['rings'])

  if (malo) return malo
  if (!o.rings.length) return vacio()

  const R = recursos()
  const c = 130
  const sw = 22
  let s = '<svg viewBox="0 0 260 260" role="img" aria-label="' + esc(o.rings.map(r => r.label + ' ' + r.value).join(', ')) + '">' + R.defs

  o.rings.forEach((it0, k) => {
    // Sin valor: la escala completa queda, sin arco, y el tooltip lo dice.
    const val = valor(it0.value)
    const it = { ...it0, value: val === null ? 0 : val }
    const frac = entre(it.value / (it.max || 100))
    const r = 106 - k * 27
    const a = Math.min(frac, 0.9999) * Math.PI * 2 - Math.PI / 2
    const ex = n1(c + r * Math.cos(a))
    const ey = n1(c + r * Math.sin(a))
    const aro = 'cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke-width="' + sw + '"'

    s += '<g data-sc-s="' + esc(it.key) + '" style="--c:' + col(it.hue) + ';--i:' + k + '"' + (val === null ? tip(it.label, textos.empty, '', it.hue) : tip(it.label, it.value + ' de ' + (it.max || 100), 'Faltan ' + n1((it.max || 100) - it.value) + ' puntos', it.hue)) + '>'
    s += '<circle ' + aro + ' style="stroke:' + tinte(it.hue, 'var(--sc-track)') + '"></circle>'
    s += '<circle ' + aro + ' mask="' + R.v + '" class="sc-hatch" style="stroke:' + col(it.hue) + '"></circle>'
    if (val !== null) s += '<path class="sc-a-draw" pathLength="100" d="M ' + c + ' ' + (c - r) + ' A ' + r + ' ' + r + ' 0 ' + (frac > 0.5 ? 1 : 0) + ' 1 ' + ex + ' ' + ey + '" fill="none" stroke-width="' + sw + '" stroke-linecap="round" style="stroke:' + col(it.hue) + '"></path>'
    if (val !== null) s += '<circle class="sc-a-in" cx="' + ex + '" cy="' + ey + '" r="4.5" style="fill:var(--sc-surface)"></circle>'
    s += '</g>'
  })

  if (o.center) {
    s += '<text x="130" y="136" text-anchor="middle" class="sc-strong" style="font-family:var(--sc-font);font-size:30px;font-weight:700">' + esc(o.center.value) + '</text>'
    s += '<text x="130" y="153" text-anchor="middle" style="font-size:9px;letter-spacing:.08em">' + esc(String(o.center.label).toUpperCase()) + '</text>'
  }

  return '<div class="sc-chart sc-rings"><div class="sc-split"><div>' + s + '</svg></div><div class="sc-rows">' +
    o.rings.map(it => '<button type="button" class="sc-row" data-sc-leg="' + esc(it.key) + '" aria-pressed="true" style="--c:' + col(it.hue) + '"><i></i><span>' + esc(it.label) + '</span><b>' + (valor(it.value) === null ? '—' : esc(it.value)) + '</b></button>').join('') +
  '</div></div></div>'
}
