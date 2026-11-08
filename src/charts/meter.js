import { n1, entre, esc, col, conUnidad, tip, valor, num } from '../core/format.js'
import { requiere, vacio, conEscala } from '../core/guardas.js'
import { textos, t } from '../core/textos.js'

// Un valor contra sus zonas (normal, aviso, crítico): cada zona tiene un ancho visual fijo y el
// valor cae proporcionalmente dentro de la suya, marcado con un punto. Para señales donde lo bueno
// suele ser estar en 0, una barra que crece desde 0 se lee al revés. Las zonas van de la buena a
// la mala; con better higher lo bueno está arriba y el orden visual se invierte.
export const meter = o => {
  const malo = requiere('meter', o, ['zones'])

  if (malo) return malo
  if (!o.zones.length) return vacio()
  o = conEscala(o)

  const min = num(o.min)
  const max = o.max
  const alto = o.better === 'higher'
  const n = o.zones.length
  // El corte de cada zona: su frontera hacia el lado malo. Con better lower el malo está arriba y
  // el corte es el techo; con higher está abajo y el corte es el piso.
  const cortes = o.zones.map(z => {
    const v = valor(z && z.to)

    return v === null ? null : Math.min(Math.max(v, min), max)
  })
  const los = cortes.map((c, i) => (alto ? (c ?? min) : i === 0 ? min : (cortes[i - 1] ?? min)))
  const his = cortes.map((c, i) => (alto ? (i === 0 ? max : (cortes[i - 1] ?? max)) : (c ?? max)))
  // Anchos visuales fijos: con 3 zonas, 60/25/15; si no, reparto parejo.
  const anchos = Array.isArray(o.widths) && o.widths.length === n && o.widths.every(w => valor(w) > 0)
    ? o.widths.map(Number)
    : n === 3 ? [60, 25, 15] : Array(n).fill(1)
  const total = anchos.reduce((a, w) => a + w, 0) || 1
  const tintes = o.zones.map(z => (z && z.hue) || 'neutral')

  const val = valor(o.value)
  // La zona del valor; afuera de la escala, la del borde.
  let zona = val === null ? -1 : o.zones.findIndex((_, i) => val >= los[i] && val <= his[i])

  if (val !== null && val <= min) zona = alto ? n - 1 : 0
  if (val !== null && val >= max) zona = alto ? 0 : n - 1
  if (zona < 0) zona = alto ? 0 : n - 1
  const frac = val === null ? 0 : his[zona] <= los[zona] ? (val <= los[zona] ? 0 : 1) : entre((val - los[zona]) / (his[zona] - los[zona]))
  // La posición del punto se mide en el orden visual: con better higher la barra va al revés.
  const antes = anchos.slice(0, zona < 0 ? 0 : zona).reduce((a, w) => a + w, 0)
  const previo = alto && zona >= 0 ? total - antes - anchos[zona] : antes
  const pos = val === null ? 0 : n1(((previo + frac * (zona < 0 ? 0 : anchos[zona])) / total) * 100)

  // El rango que describe cada zona, con la unidad del valor.
  const rango = i => {
    const tocaMin = los[i] <= min
    const tocaMax = his[i] >= max

    if (tocaMin && tocaMax) return t('meterBetween', { from: conUnidad(los[i], o.unit), to: conUnidad(his[i], o.unit) })
    if (tocaMax) return t('meterBeyond', { value: conUnidad(los[i], o.unit) })
    if (tocaMin) return t('meterUpTo', { value: conUnidad(his[i], o.unit) })

    return t('meterBetween', { from: conUnidad(los[i], o.unit), to: conUnidad(his[i], o.unit) })
  }
  const detalle = val === null ? o.zones.map((_, i) => rango(i)).join(' · ') : rango(zona)
  const hue = val === null ? 'neutral' : tintes[zona]
  // En la primera zona el número va neutro; fuera de ella, con el color de su zona.
  const cifra = '<b' + (val !== null && zona > 0 ? ' style="color:' + col(hue) + '"' : '') + '>' + (val === null ? '—' : esc(o.value)) + '</b>'
  const lado = o.side ? '<span class="sc-side">' + esc(o.side) + '</span>' : ''
  const raiz = ' data-sc-s="' + esc(o.key || o.label) + '"' + tip(o.label, val === null ? textos.empty : conUnidad(o.value, o.unit), detalle, hue)

  // El punto es un <i>: las franjas son los únicos div y llevan el radio de cada punta.
  const barra = '<div class="sc-meter-bar"' + (alto ? ' style="flex-direction:row-reverse"' : '') + '>' +
    o.zones.map((_, i) => '<div class="sc-meter-seg" style="flex:' + anchos[i] + ' 0 0;--c:' + col(tintes[i]) + '"></div>').join('') +
    (val === null ? '' : '<i class="sc-dot sc-a-pop" style="left:' + pos + '%;--c:' + col(hue) + '"></i>') + '</div>'

  // Compacto: el número y el medidor en una línea, para una celda de tabla. El label va al tooltip.
  if (o.compact) return '<div class="sc-chart sc-meter sc-compact" role="img" aria-label="' + esc(o.label) + '"' + raiz + '>' + cifra + barra + lado + '</div>'

  return '<div class="sc-chart sc-meter"' + raiz + '>' +
    '<div class="sc-bullet-head"><span class="sc-name">' + esc(o.label) + '</span>' + cifra + (val === null ? '' : '<span class="sc-unit">' + esc(o.unit) + '</span>') + lado + '</div>' +
    barra +
  '</div>'
}
