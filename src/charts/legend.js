import { esc, col, colorLibre } from '../core/format.js'

export const legend = (items, clickable = true) =>
  '<div class="sc-legend">' + items.map(it => {
    const sq = '<i class="sc-sq' + (it.hatched ? ' sc-h' : '') + '" style="--c:' + (it.color ? colorLibre(it.color) : col(it.hue)) + '"></i>'

    return clickable && it.key
      ? '<button type="button" data-sc-leg="' + esc(it.key) + '" aria-pressed="' + !it.off + '">' + sq + esc(it.label) + '</button>'
      : '<span>' + sq + esc(it.label) + '</span>'
  }).join('') + '</div>'
