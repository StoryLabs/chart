import { n1, entre, esc, col, conUnidad, tip, valor, num } from '../core/format.js'
import { requiere, conEscala } from '../core/guardas.js'
import { textos } from '../core/textos.js'

export const bullet = o => {
  // En compacto (una celda de tabla) la referencia es opcional.
  const malo = requiere('bullet', o, o && o.compact && !o.reference ? [] : ['reference'])

  if (malo) return malo
  o = conEscala(o)

  const hue = o.hue || 'blue'
  const conRef = Array.isArray(o.reference)
  const [a, b] = conRef ? o.reference : [0, 0]
  // Sin valor: la escala y la referencia quedan, sin barra; el número sale con el guion largo.
  const val = valor(o.value)
  // La escala va de min (0 por defecto) a max; lo que queda afuera se recorta en el dibujo.
  const min = num(o.min)
  const escala = v => entre((v - min) / (o.max - min)) * 100
  const pv = val === null ? 0 : escala(val)
  const p0 = escala(a)
  const p1 = escala(b)
  const fuera = conRef && val !== null && (val < a || val > b)
  const ref = conRef ? 'Referencia: ' + a + ' a ' + conUnidad(b, o.unit) : ''
  const banda = conRef ? '<div class="sc-ref" style="left:' + n1(p0) + '%;width:' + n1(p1 - p0) + '%"><i class="sc-hfill"></i></div>' : ''
  const barra = '<div class="sc-bar">' + banda + (pv > 0 ? '<div class="sc-val sc-a-x" style="width:' + n1(pv) + '%"></div>' : '') + '</div>'
  const raiz = ' data-sc-s="' + esc(o.key || o.label) + '" style="--c:' + col(hue) + ';--c2:' + col(o.hue2 || hue) + '"' + tip(o.label, val === null ? textos.empty : conUnidad(o.value, o.unit), ref + (fuera ? ' · fuera de rango' : ''), hue)

  // Compacto: el número y la barra en una línea, para una celda de tabla. El label va al tooltip.
  if (o.compact) return '<div class="sc-chart sc-bullet sc-compact" role="img" aria-label="' + esc(o.label) + '"' + raiz + '><b>' + (val === null ? '—' : esc(o.value)) + '</b>' + barra + '</div>'


  return '<div class="sc-chart sc-bullet"' + raiz + '>' +
    '<div class="sc-bullet-head"><span class="sc-name">' + esc(o.label) + '</span><b>' + (val === null ? '—' : esc(o.value)) + '</b>' + (val === null ? '' : '<span class="sc-unit">' + esc(o.unit) + '</span>') +
      (fuera ? '<span class="sc-chip">fuera de rango</span>' : '') + (o.side ? '<span class="sc-side">' + esc(o.side) + '</span>' : '') + '</div>' +
    barra +
    '<div class="sc-bullet-ref" style="' + (p0 >= 50 ? 'text-align:right;padding-right:' + n1(100 - p1) + '%' : 'padding-left:' + n1(p0) + '%') + '">' + esc((min ? 'Escala de ' + min + ' a ' + conUnidad(o.max, o.unit) + ' · ' : '') + ref) + '</div>' +
  '</div>'
}
