import { n1, entre, esc, col, conUnidad, tip, valor } from '../core/format.js'
import { requiere, vacio, conEscala } from '../core/guardas.js'
import { textos } from '../core/textos.js'

/**
 * Barras divergentes desde un cero al medio, en una escala simétrica de -max a +max: una barra de
 * +30 mide lo mismo que una de -30. Sólida la barra (lo medido), rayada la referencia, tinte la
 * pista. Un valor que se pasa llega al borde con data-sc-over; el tooltip dice el real.
 */
export const diverging = o => {
  const malo = requiere('diverging', o, ['rows'])

  if (malo) return malo
  if (!o.rows.length) return vacio()
  o = conEscala(o)

  const u = o.unit || ''
  // Posición en % de una cantidad con signo: -max a la izquierda, 0 al medio, +max a la derecha.
  const pos = v => n1(entre(0.5 + v / (2 * o.max)) * 100)
  const signo = v => (v > 0 ? '+' + v : String(v))
  const ref = Array.isArray(o.reference) && valor(o.reference[0]) !== null && valor(o.reference[1]) !== null
    ? '<div class="sc-ref" style="left:' + pos(valor(o.reference[0])) + '%;width:' + n1(pos(valor(o.reference[1])) - pos(valor(o.reference[0]))) + '%"><i class="sc-hfill"></i></div>'
    : ''
  const lados = o.sides || []

  return '<div class="sc-chart sc-diverging">' +
    o.rows.map((r, i) => {
      const v = valor(r.value)
      const hue = r.hue || (v < 0 ? o.negativeHue || 'green' : o.hue || 'blue')
      const barra = v === null || v === 0 ? '' :
        '<div class="sc-val sc-a-x" style="left:' + Math.min(pos(v), 50) + '%;width:' + n1(Math.abs(pos(v) - 50)) + '%;--c:' + col(hue) + '"></div>'

      return '<div class="sc-range-row" data-sc-s="' + esc(r.key || 'r' + i) + '" style="--i:' + i * 2 + '"' + (v !== null && Math.abs(v) > o.max ? ' data-sc-over' : '') +
        tip(r.label, v === null ? textos.empty : conUnidad(signo(v), u), v === null || v === 0 ? '' : lados[v < 0 ? 0 : 1] || '', hue) + '><span class="sc-nm">' + esc(r.label) + '</span>' +
        '<div class="sc-bar">' + ref + '<i class="sc-cero"></i>' + barra + '</div>' +
        '<span class="sc-v"><b>' + (v === null ? '—' : esc(signo(v))) + '</b>' + (v === null || !u ? '' : ' ' + esc(u)) + '</span></div>'
    }).join('') +
    '<div class="sc-axis"><span></span><div><span style="left:0%">' + esc(signo(-o.max)) + '</span><span style="left:50%;translate:-50% 0">0</span><span style="left:100%;translate:-100% 0">' + esc(conUnidad(signo(o.max), u)) + '</span></div><span class="sc-v"><b>+000</b> ' + esc(u) + '</span></div>' +
    (lados.length ? '<div class="sc-axis"><span></span><div><span style="left:25%;translate:-50% 0">' + esc(lados[0]) + '</span><span style="left:75%;translate:-50% 0">' + esc(lados[1] || '') + '</span></div><span class="sc-v"><b>+000</b> ' + esc(u) + '</span></div>' : '') +
  '</div>'
}
