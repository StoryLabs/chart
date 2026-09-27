import { n1, esc, col, tip, num, valor } from '../core/format.js'
import { requiere, vacio } from '../core/guardas.js'

export const segmented = o => {
  const malo = requiere('segmented', o, ['segments'])

  if (malo) return malo
  if (!o.segments.length) return vacio()

  // Un tramo sin valor no entra al reparto; en la lista figura con el guion largo.
  const total = o.segments.reduce((a, s) => a + (valor(s.value) ?? 0), 0) || 1
  const pct = s => (valor(s.value) === null ? '—' : n1((valor(s.value) / total) * 100) + '%')

  return '<div class="sc-chart sc-segmented"><div class="sc-comp">' +
    o.segments.map((s, i) => valor(s.value) === null ? '' : '<div data-sc-s="' + esc(s.key) + '" class="sc-a-x' + (s.hatched ? ' sc-hx' : '') + '" style="--c:' + col(s.hue) + ';--i:' + i * 2 + ';flex:' + num(s.value) + ' 0 0"' + tip(s.label, pct(s), s.detail, s.hue) + '>' + (s.hatched ? '<i class="sc-hfill"></i>' : '') + '</div>').join('') +
    '</div><div class="sc-rows">' +
    o.segments.map(s => '<button type="button" class="sc-row" data-sc-leg="' + esc(s.key) + '" aria-pressed="true"><i class="sc-sq' + (s.hatched ? ' sc-h' : '') + '" style="--c:' + col(s.hue) + '"></i><span>' + esc(s.label) + '</span><span class="sc-t">' + esc(s.detail || '') + '</span><b>' + pct(s) + '</b></button>').join('') +
  '</div></div>'
}
