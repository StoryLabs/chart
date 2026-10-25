import { n1, entre, esc, col, conUnidad, tip, valor, esFmt, fmtNum } from '../core/format.js'
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
  const signo = v => (esFmt(u) ? fmtNum(v, { ...u, sign: true }) : v > 0 ? '+' + v : String(v))
  // Con una especificación de formato el signo y la unidad ya van dentro del número ('+6.40%'): no hay sufijo aparte.
  const sufijo = esFmt(u) ? '' : u
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
        tip(r.label, v === null ? textos.empty : (esFmt(u) ? signo(v) : conUnidad(signo(v), u)), v === null || v === 0 ? '' : lados[v < 0 ? 0 : 1] || '', hue) + '><span class="sc-nm">' + esc(r.label) + '</span>' +
        '<div class="sc-bar">' + ref + '<i class="sc-cero"></i>' + barra + '</div>' +
        '<span class="sc-v"><b>' + (v === null ? '—' : esc(signo(v))) + '</b>' + (v === null || !sufijo ? '' : ' ' + esc(sufijo)) + '</span></div>'
    }).join('') +
    '<div class="sc-axis"><span></span><div><span style="left:0%">' + esc(signo(-o.max)) + '</span><span style="left:50%;translate:-50% 0">0</span><span style="left:100%;translate:-100% 0">' + esc(esFmt(u) ? signo(o.max) : conUnidad(signo(o.max), u)) + '</span></div><span class="sc-v"><b>' + (esFmt(u) ? '+000.00%' : '+000') + '</b> ' + esc(sufijo) + '</span></div>' +
    (lados.length ? '<div class="sc-axis"><span></span><div><span style="left:25%;translate:-50% 0">' + esc(lados[0]) + '</span><span style="left:75%;translate:-50% 0">' + esc(lados[1] || '') + '</span></div><span class="sc-v"><b>' + (esFmt(u) ? '+000.00%' : '+000') + '</b> ' + esc(sufijo) + '</span></div>' : '') +
  '</div>'
}
