import { n1, entre, esc, col, conUnidad, tip, valor, num } from '../core/format.js'
import { requiere, vacio, conEscala } from '../core/guardas.js'
import { textos } from '../core/textos.js'

export const range = o => {
  const malo = requiere('range', o, ['rows'])

  if (malo) return malo
  if (!o.rows.length) return vacio()
  o = conEscala(o)

  const u = o.unit || ''
  const min = num(o.min)
  const pos = v => n1(entre((v - min) / (o.max - min)) * 100)
  // Una marca fuera de [min, max] no se dibuja: estaría mintiendo sobre dónde cae ese valor.
  const marcas = (o.ticks || [min, o.max]).filter(t => valor(t) !== null && valor(t) >= min && valor(t) <= o.max)

  return '<div class="sc-chart sc-range" style="' + (o.hue ? '--c:' + col(o.hue) + ';' : '') + (o.hue2 ? '--c2:' + col(o.hue2) : '') + '">' +
    o.rows.map((r, i) => (valor(r.from) === null || valor(r.to) === null)
      // Sin uno de los dos extremos no hay rango: la escala queda, sin barra, y el tooltip lo dice.
      ? '<div class="sc-range-row" data-sc-s="r' + i + '" style="--i:' + i * 2 + '"' + tip(r.label, textos.empty, '', o.hue || 'sky') + '><span class="sc-nm">' + esc(r.label) + '</span><div class="sc-bar"></div><span class="sc-v"><b>—</b></span></div>'
      :
      '<div class="sc-range-row" data-sc-s="r' + i + '" style="--i:' + i * 2 + '"' + tip(r.label, r.from + ' / ' + conUnidad(r.to, u), 'Dispersión de ' + conUnidad(n1(r.to - r.from), u), o.hue || 'sky') + '><span class="sc-nm">' + esc(r.label) + '</span>' +
        '<div class="sc-bar"><div class="sc-ref sc-a-x" style="left:' + pos(r.from) + '%;width:' + n1(pos(r.to) - pos(r.from)) + '%"><i class="sc-hfill"></i></div><div class="sc-dot" style="left:' + pos(r.from) + '%"></div></div>' +
        '<span class="sc-v"><b>' + esc(r.from) + '</b> / ' + esc(conUnidad(r.to, u)) + '</span></div>'
    ).join('') +
    '<div class="sc-axis"><span></span><div>' + marcas.map((t, i, todos) => {
      // Cada marca en la posición de su valor, con la misma cuenta que las barras. La de un borde
      // se apoya hacia adentro para no salirse.
      const p = pos(t)

      return '<span style="left:' + p + '%' + (p === 0 ? '' : p === 100 ? ';translate:-100% 0' : ';translate:-50% 0') + '">' + esc(i === todos.length - 1 ? conUnidad(t, u) : t) + '</span>'
    }).join('') + '</div><span class="sc-v"><b>000</b> / ' + esc(conUnidad('000', u)) + '</span></div>' +
  '</div>'
}
