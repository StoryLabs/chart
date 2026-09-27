import { legend } from './legend.js'
import { FUERTE, SUAVE, velo } from '../core/color.js'
import { n1, esc, col, cuenta, tip, num, valor } from '../core/format.js'
import { requiere, vacio, conEscala } from '../core/guardas.js'
import { conBanda, itemHueco } from '../core/huecos.js'
import { textos } from '../core/textos.js'

export const stacked = o => {
  const malo = requiere('stacked', o, ['series', 'data'])

  if (malo) return malo
  if (!o.data.length) return vacio()
  o = conEscala(o)

  const H = num(o.height) || 190
  const ticks = o.yTicks || [0, o.max]
  const pos = t => n1((t / o.max) * 100)
  const ocultas = o.hidden || []
  const vivas = o.series.filter(se => !ocultas.includes(se.key))
  const variante = o.variant === 'solid' ? 'solid' : 'line'

  return '<div class="sc-chart sc-stacked" data-sc-chart="stacked" data-sc-opts="' + esc(JSON.stringify(o)) + '" style="--h:' + H + 'px">' +
    legend(o.series.map(se => ({ key: se.key, label: se.label, hue: se.hue, hatched: se.hatched, off: ocultas.includes(se.key) })).concat(conBanda(o) && o.data.some(d => o.series.every(se => valor((d.values || {})[se.key]) === null)) ? [itemHueco()] : [])) +
    '<div class="sc-stacked-plot">' +
      '<div class="sc-yaxis">' + ticks.map(t => '<span style="bottom:' + pos(t) + '%">' + esc(t) + '</span>').join('') + '</div>' +
      '<div class="sc-area"><div class="sc-lines">' + ticks.map(t => '<i style="bottom:' + pos(t) + '%"></i>').join('') + '</div>' +
      '<div class="sc-cols">' + o.data.map((d, i) => {
        // Una fila sin values es una fila entera sin datos; un valor que falta no entra a la pila.
        const partes = vivas.map(se => ({ se, v: valor((d.values || {})[se.key]) || 0 })).filter(q => q.v > 0)
        const total = partes.reduce((a, q) => a + q.v, 0) || 1

        // Una fila sin ningún dato: rayada neutra de todo el alto, para no confundirse con una en cero.
        const falta = conBanda(o) && o.series.every(se => valor((d.values || {})[se.key]) === null)

        // Una pila que pasa de max se recorta al alto del plot; el tooltip sigue con el valor real.
        const sePasa = partes.reduce((a, q) => a + q.v, 0) > o.max

        return '<div class="sc-col"><div class="sc-stack sc-a-y" style="--i:' + i + (sePasa ? ';max-height:' + H + 'px;overflow:hidden" data-sc-over' : '"') + '>' +
          (falta ? '<div data-sc-s="gaps" class="sc-hx" style="--c:var(--sc-neutral);height:' + H + 'px"' + tip(d.title || d.label, textos.empty, '', 'neutral') + '><i class="sc-hfill"></i></div>' : '') +
          partes.map((q, k) => {
            const h = q.se.hue
            const cima = k === partes.length - 1
            const exacto = (q.v / o.max) * H
            let estilo

            if (variante === 'line') {
              // Relleno translúcido y, arriba, la línea de su color: ésa es la frontera con el
              // tramo de encima. Lo rayado lleva la línea punteada, como el buffer de las líneas.
              estilo = 'box-sizing:border-box;height:' + n1(Math.max(3, exacto)) + 'px;border-top:2.5px ' + (q.se.hatched ? 'dashed ' : 'solid ') + col(h) + ';' +
                (q.se.hatched ? '' : 'background:linear-gradient(to bottom,' + velo(h, FUERTE) + ',' + velo(h, SUAVE) + ');') +
                (cima ? 'border-radius:4px 4px 0 0;' : '')
            } else {
              estilo = 'height:' + n1(Math.max(2, exacto - (k ? 2 : 0))) + 'px;' + (k ? 'margin-bottom:2px;' : '') + (cima ? 'border-radius:6px 6px 0 0;' : '')
            }

            return '<div data-sc-s="' + esc(q.se.key) + '"' + (q.se.hatched ? ' class="sc-hx"' : '') + ' style="--c:' + col(h) + ';' + estilo + '"' +
              tip((d.title || d.label) + ' · ' + q.se.label, o.unit ? cuenta(q.v, o.unit) : q.v, n1((q.v / total) * 100) + '% del día', h) + '>' + (q.se.hatched ? '<i class="sc-hfill"></i>' : '') + '</div>'
          }).join('') +
          '</div><span class="sc-xlab' + (d.current ? ' sc-strong' : '') + '">' + esc(d.label) + '</span></div>'
      }).join('') + '</div></div>' +
    '</div></div>'
}
