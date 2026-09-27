import { n1, entre, esc, col, conUnidad, tip, valor, num } from '../core/format.js'
import { requiere, conEscala } from '../core/guardas.js'
import { textos } from '../core/textos.js'

export const bullet = o => {
  const malo = requiere('bullet', o, ['reference'])

  if (malo) return malo
  o = conEscala(o)

  const hue = o.hue || 'blue'
  const [a, b] = o.reference
  // Sin valor: la escala y la referencia quedan, sin barra; el número sale con el guion largo.
  const val = valor(o.value)
  // La escala va de min (0 por defecto) a max; lo que queda afuera se recorta en el dibujo.
  const min = num(o.min)
  const escala = v => entre((v - min) / (o.max - min)) * 100
  const pv = val === null ? 0 : escala(val)
  const p0 = escala(a)
  const p1 = escala(b)
  const fuera = val !== null && (val < a || val > b)
  const ref = 'Referencia: ' + a + ' a ' + conUnidad(b, o.unit)

  return '<div class="sc-chart sc-bullet" data-sc-s="' + esc(o.key || o.label) + '" style="--c:' + col(hue) + ';--c2:' + col(o.hue2 || hue) + '"' + tip(o.label, val === null ? textos.empty : conUnidad(o.value, o.unit), ref + (fuera ? ' · fuera de rango' : ''), hue) + '>' +
    '<div class="sc-bullet-head"><span class="sc-name">' + esc(o.label) + '</span><b>' + (val === null ? '—' : esc(o.value)) + '</b><span class="sc-unit">' + esc(o.unit) + '</span>' +
      (fuera ? '<span class="sc-chip">fuera de rango</span>' : '') + (o.side ? '<span class="sc-side">' + esc(o.side) + '</span>' : '') + '</div>' +
    '<div class="sc-bar"><div class="sc-ref" style="left:' + n1(p0) + '%;width:' + n1(p1 - p0) + '%"><i class="sc-hfill"></i></div>' +
      (pv > 0 ? '<div class="sc-val sc-a-x" style="width:' + n1(pv) + '%"></div>' : '') + '</div>' +
    '<div class="sc-bullet-ref" style="' + (p0 >= 50 ? 'text-align:right;padding-right:' + n1(100 - p1) + '%' : 'padding-left:' + n1(p0) + '%') + '">' + esc(ref) + '</div>' +
  '</div>'
}
