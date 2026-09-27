import { esc } from './format.js'

export const headline = h => {
  if (!h) return ''

  return '<div class="sc-big">' + h.parts.map(p => '<b>' + esc(p[0]) + '</b><span>' + esc(p[1]) + '</span>').join('') + (h.chip ? '<span class="sc-chip">' + esc(h.chip) + '</span>' : '') + '</div>'
}
