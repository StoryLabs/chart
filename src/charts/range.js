import { n1, entre, esc, col, conUnidad, tip, valor } from '../core/format.js'
import { requiere, vacio, conEscala } from '../core/guardas.js'
import { textos } from '../core/textos.js'

export const range = o => {
  const malo = requiere('range', o, ['rows'])

  if (malo) return malo
  if (!o.rows.length) return vacio()
  o = conEscala(o)

  const u = o.unit || ''
  const pos = v => n1(entre(v / o.max) * 100)

  return '<div class="sc-chart sc-range" style="' + (o.hue ? '--c:' + col(o.hue) + ';' : '') + (o.hue2 ? '--c2:' + col(o.hue2) : '') + '">' +
    o.rows.map((r, i) => (valor(r.from) === null || valor(r.to) === null)
      // Sin uno de los dos extremos no hay rango: la escala queda, sin barra, y el tooltip lo dice.
      ? '<div class="sc-range-row" data-sc-s="r' + i + '" style="--i:' + i * 2 + '"' + tip(r.label, textos.empty, '', o.hue || 'sky') + '><span class="sc-nm">' + esc(r.label) + '</span><div class="sc-bar"></div><span class="sc-v"><b>—</b></span></div>'
      :
      '<div class="sc-range-row" data-sc-s="r' + i + '" style="--i:' + i * 2 + '"' + tip(r.label, r.from + ' / ' + conUnidad(r.to, u), 'Dispersión de ' + conUnidad(n1(r.to - r.from), u), o.hue || 'sky') + '><span class="sc-nm">' + esc(r.label) + '</span>' +
        '<div class="sc-bar"><div class="sc-ref sc-a-x" style="left:' + pos(r.from) + '%;width:' + n1(pos(r.to) - pos(r.from)) + '%"><i class="sc-hfill"></i></div><div class="sc-dot" style="left:' + pos(r.from) + '%"></div></div>' +
        '<span class="sc-v"><b>' + esc(r.from) + '</b> / ' + esc(conUnidad(r.to, u)) + '</span></div>'
    ).join('') +
    '<div class="sc-axis"><span></span><div>' + (o.ticks || [0, o.max]).map((t, i, todos) => '<span>' + esc(i === todos.length - 1 ? conUnidad(t, u) : t) + '</span>').join('') + '</div><span class="sc-v"><b>000</b> / ' + esc(conUnidad('000', u)) + '</span></div>' +
  '</div>'
}
