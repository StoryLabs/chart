import { nextId } from './ids.js'

/** Las dos máscaras de rayado de un SVG: d para barras y áreas, v para anillos. */
export const recursos = extra => {
  const k = nextId()
  const par = g =>
    '<pattern id="scst' + g + k + '" data-sc-g="' + g + '" patternUnits="userSpaceOnUse" width="7" height="7"><rect x="0" y="0" width="1.8" height="7" fill="#fff"></rect></pattern>' +
    '<mask id="scmk' + g + k + '" maskUnits="userSpaceOnUse" x="-50" y="-50" width="1500" height="1500"><rect x="-50" y="-50" width="1500" height="1500" fill="url(#scst' + g + k + ')"></rect></mask>'

  return { k, d: 'url(#scmk' + 'd' + k + ')', v: 'url(#scmk' + 'v' + k + ')', defs: '<defs>' + par('d') + par('v') + (extra ? extra(k) : '') + '</defs>' }
}
