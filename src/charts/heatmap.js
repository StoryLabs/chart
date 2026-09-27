import { legend } from './legend.js'
import { pad, esc, col, num, valor } from '../core/format.js'
import { recursos } from '../core/recursos.js'
import { requiere, vacio } from '../core/guardas.js'

export const heatmap = o => {
  const malo = requiere('heatmap', o, ['rows', 'values'])

  if (malo) return malo
  if (!o.values.length || !Array.isArray(o.values[0]) || !o.values[0].length) return vacio()

  const hue = o.hue || 'sky'
  const cols = o.values[0].length
  const L = 52, T = 6, celda = 21, salto = 24
  // Una opción escalar mala nunca lanza: usa el default.
  const tope = Math.max(1, Math.floor(num(o.steps)) || 3)
  const tono = n => (n ? 'color-mix(in srgb, ' + col(hue) + ' ' + Math.round(30 + 70 * ((Math.min(n, tope) - 1) / Math.max(1, tope - 1))) + '%, var(--sc-inset))' : 'var(--sc-inset)')
  // Todas las casillas de un mismo nivel son UN solo trazo, y el tooltip lo arma el cursor al
  // pasar. Antes cada casilla era un nodo con su forma, su color y su texto: 168 casillas
  // pesaban 36 KB y eran dos tercios de los nodos de un tablero.
  //
  // Cada casilla se dibuja como un cuadrado chico engordado con un trazo de unión redonda: el
  // trazo lo lleva al tamaño y le redondea las esquinas, en 20 caracteres en vez de 80.
  const R = recursos(null, o.id)
  const radio = 5
  const lado = celda - radio * 2
  const niveles = Array.from({ length: tope + 1 }, () => [])
  const vacias = []
  const motivos = []
  // Una fila que falta es una fila entera sin datos.
  const compacto = o.values.map((fila, f) => Array.from({ length: cols }, (_, h) => (Array.isArray(fila) ? fila[h] : null)).map((n, h) => {
    const uso = 'M' + (L + h * salto + radio) + ' ' + (T + f * salto + radio) + 'h' + lado + 'v' + lado + 'h-' + lado + 'z'

    const v = valor(n)

    if (v !== null) {
      // Un negativo se dibuja como cero; un valor con decimales, en el nivel de arriba.
      niveles[Math.min(Math.max(0, Math.ceil(v)), tope)].push(uso)

      return v
    }

    // Un texto en vez de un número quiere decir «no se midió», y el texto dice por qué. Viaja como
    // texto con el índice del motivo: un número, de cualquier signo, es siempre un valor medido.
    vacias.push(uso)
    if (!motivos.includes(n || '')) motivos.push(n || '')

    return String(motivos.indexOf(n || ''))
  }))
  let s = '<svg viewBox="0 0 640 ' + (T + o.rows.length * salto + 22) + '" role="img" aria-label="' + esc(o.label || 'Mapa de calor') + '">' + R.defs

  for (let f = 0; f < o.rows.length; f++) s += '<text x="' + (L - 10) + '" y="' + (T + f * salto + 15) + '" text-anchor="end">' + esc(o.rows[f]) + '</text>'

  const trazo = (d, color, extra) => '<path d="' + d.join('') + '" stroke-width="' + radio * 2 + '" stroke-linejoin="round"' + (extra || '') + ' style="fill:' + color + ';stroke:' + color + '"></path>'

  s += '<g class="sc-a-in">'
  niveles.forEach((usos, n) => { if (usos.length) s += trazo(usos, tono(n)) })
  // El tinte va opaco, mezclado con la superficie: relleno y trazo translúcidos se oscurecen
  // donde se pisan.
  if (vacias.length) s += trazo(vacias, 'color-mix(in srgb, var(--sc-neutral) var(--sc-track), var(--sc-surface))') + trazo(vacias, 'var(--sc-neutral)', ' mask="' + R.d + '" class="sc-hatch"')
  s += '</g>'

  for (const h of o.colTicks || [0, cols - 1]) s += '<text x="' + (L + h * salto + celda / 2) + '" y="' + (T + o.rows.length * salto + 14) + '" text-anchor="middle">' + esc(pad(h)) + '</text>'

  const datos = { v: compacto, w: motivos, r: o.rows, L, T, s: salto, c: celda, u: o.unit || null, e: o.emptyLabel || 'Sin datos', hue }

  s += '<rect class="sc-celda" x="0" y="0" width="' + (celda + 4) + '" height="' + (celda + 4) + '" rx="7" fill="none" stroke-width="2" visibility="hidden" style="stroke:var(--sc-text)"></rect>'
  s += '<rect data-sc-heat="' + esc(JSON.stringify(datos)) + '" x="' + L + '" y="' + T + '" width="' + cols * salto + '" height="' + o.rows.length * salto + '" fill="transparent"></rect>'

  const escala = []

  for (let n = 1; n <= tope; n++) escala.push({ label: n === tope ? n + ' o más' : String(n), color: tono(n) })
  escala.push({ label: o.emptyLabel || 'Sin datos', hue: 'neutral', hatched: true })

  return '<div class="sc-chart sc-heatmap"><div class="sc-scroll">' + s + '</svg></div>' + legend(escala, false) + '</div>'
}
