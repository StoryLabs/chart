import { legend } from './legend.js'
import { pad, n1, esc, col, tinte, tip, num } from '../core/format.js'
import { headline } from '../core/headline.js'
import { recursos } from '../core/recursos.js'
import { requiere, vacio, fallo } from '../core/guardas.js'

/** Polígono con todas las esquinas redondeadas, salgan hacia afuera o hacia adentro. */
const redondear = (pts, r) => {
  const n = pts.length
  let d = ''

  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p = pts[i]
    const p1 = pts[(i + 1) % n]
    const l0 = Math.hypot(p[0] - p0[0], p[1] - p0[1]) || 1
    const l1 = Math.hypot(p1[0] - p[0], p1[1] - p[1]) || 1
    const rr = Math.min(r, l0 / 2, l1 / 2)

    d += (i ? ' L ' : 'M ') + n1(p[0] + ((p0[0] - p[0]) / l0) * rr) + ' ' + n1(p[1] + ((p0[1] - p[1]) / l0) * rr) +
      ' Q ' + n1(p[0]) + ' ' + n1(p[1]) + ' ' + n1(p[0] + ((p1[0] - p[0]) / l1) * rr) + ' ' + n1(p[1] + ((p1[1] - p[1]) / l1) * rr)
  }

  return d + ' Z'
}

/**
 * El contorno de una racha de tramos como UNA sola forma: bloques del mismo alto unidos por
 * cuellos angostos. En cada cambio de carril el borde de arriba y el de abajo dan el paso en
 * lugares distintos, separados por el ancho del cuello; de ahí sale el cuello.
 */
const contorno = (tramos, alto, cuello, radio) => {
  const hh = alto / 2
  const arriba = [[tramos[0].a, tramos[0].y - hh]]
  const abajo = [[tramos[0].a, tramos[0].y + hh]]

  for (let i = 0; i < tramos.length - 1; i++) {
    const A = tramos[i]
    const B = tramos[i + 1]

    if (A.y === B.y) continue

    const hw = Math.min(cuello / 2, (A.b - A.a) / 4, (B.b - B.a) / 4)
    const baja = B.y > A.y

    arriba.push([A.b + (baja ? hw : -hw), A.y - hh], [A.b + (baja ? hw : -hw), B.y - hh])
    abajo.push([A.b + (baja ? -hw : hw), A.y + hh], [A.b + (baja ? -hw : hw), B.y + hh])
  }

  const U = tramos[tramos.length - 1]

  arriba.push([U.b, U.y - hh])
  abajo.push([U.b, U.y + hh])

  return redondear(arriba.concat(abajo.reverse()), radio)
}

export const ribbon = o => {
  const malo = requiere('ribbon', o, ['segments']) || (o.states && typeof o.states === 'object' ? '' : fallo('ribbon', 'falta states'))

  if (malo) return malo
  if (!o.segments.length) return vacio()

  const rota = o.segments.find(t => !o.states[t[2]])

  if (rota) return fallo('ribbon', 'el estado "' + rota[2] + '" no está en states')
  if (o.domain && !(num(o.domain[1]) > num(o.domain[0]))) o = { ...o, domain: undefined }

  const claves = Object.keys(o.states)
  const carriles = Math.max(...claves.map(k => o.states[k].lane)) + 1
  const [d0, d1] = o.domain || [0, 24]
  const VB = 1100
  const x0 = 20
  const ancho = VB - 40
  const alto = 34
  const paso = 54
  const cy = k => 46 + o.states[k].lane * paso
  const fondo = 46 + (carriles - 1) * paso + 30
  const yTop = 46 - alto / 2
  const yBot = 46 + (carriles - 1) * paso + alto / 2
  const x = h => n1(x0 + ((h - d0) / (d1 - d0)) * ancho)
  // format escribe un valor del dominio (por defecto, la hora del día); unit dice en qué unidad está
  // el dominio, para calcular la duración de un tramo. Un format que no sirve usa el default.
  const reloj = h => { const m = Math.round(h * 60); return pad(Math.floor(m / 60)) + ':' + pad(m % 60) }
  const hora = h => { try { return typeof o.format === 'function' ? String(o.format(h)) : reloj(h) } catch { return reloj(h) } }
  const minutos = { s: 1 / 60, min: 1, h: 60, d: 1440 }[o.unit] || 60
  const dura = h => { const m = Math.round(h * minutos); return m >= 60 ? Math.floor(m / 60) + ' h ' + (m % 60) + ' min' : m + ' min' }
  // El color de un carril es el del estado medido que vive en él.
  const tonoDe = l => { const k = claves.find(c => o.states[c].lane === l && !o.states[c].hatched); return k ? o.states[k].hue : 'neutral' }

  // Un gradiente vertical para toda la cinta: cada carril tiene su color parejo y los cuellos
  // hacen la transición. Por eso un cuello que baja de warm a down pasa de azul a naranja.
  const R = recursos(k => {
    let g = '<linearGradient id="scgr' + k + '" gradientUnits="userSpaceOnUse" x1="0" y1="' + yTop + '" x2="0" y2="' + (carriles > 1 ? yBot : yTop + 1) + '">'

    for (let l = 0; l < carriles; l++) {
      for (const yy of [46 + l * paso - alto / 2, 46 + l * paso + alto / 2]) g += '<stop offset="' + n1(((yy - yTop) / (yBot - yTop)) * 100) + '%" style="stop-color:' + col(tonoDe(l)) + '"></stop>'
    }

    return g + '</linearGradient>'
  }, o.id)

  // Rachas de tramos medidos seguidos. Un tramo sin datos corta la cinta.
  const rachas = []

  o.segments.forEach((t, i) => {
    if (o.states[t[2]].hatched) return

    const previo = o.segments[i - 1]

    if (rachas.length && previo && !o.states[previo[2]].hatched) rachas[rachas.length - 1].push(t)
    else rachas.push([t])
  })

  let clips = ''
  let cinta = ''

  // La forma es una sola, pero se pinta una vez por estado, recortada a los tramos de ese estado:
  // así el hover y la leyenda siguen pudiendo atenuar o apagar un estado sin partir el dibujo.
  rachas.forEach((racha, ri) => {
    const d = contorno(racha.map(t => ({ a: x(t[0]), b: x(t[1]), y: cy(t[2]) })), alto, 5, 7)

    ;[...new Set(racha.map(t => t[2]))].forEach((k, ki) => {
      const id = 'sccl' + R.k + '_' + ri + '_' + ki

      clips += '<clipPath id="' + id + '">' + racha.filter(t => t[2] === k).map(t => '<rect x="' + n1(x(t[0]) - 0.3) + '" y="0" width="' + n1(x(t[1]) - x(t[0]) + 0.6) + '" height="' + (fondo + 38) + '"></rect>').join('') + '</clipPath>'
      cinta += '<g data-sc-s="' + esc(k) + '" clip-path="url(#' + id + ')"><path d="' + d + '" fill="url(#scgr' + R.k + ')"></path></g>'
    })
  })

  let s = '<svg viewBox="0 0 ' + VB + ' ' + (fondo + 38) + '" role="img" aria-label="' + esc(o.label || 'Estados en el tiempo') + '">' + R.defs + '<defs>' + clips + '</defs>'

  s += '<rect x="' + x0 + '" y="16" width="' + ancho + '" height="' + (fondo - 16) + '" rx="4" fill="none" stroke-dasharray="3 4" style="stroke:var(--sc-line)"></rect>'
  for (let l = 1; l < carriles; l++) s += '<line x1="' + x0 + '" x2="' + (x0 + ancho) + '" y1="' + (19 + l * paso) + '" y2="' + (19 + l * paso) + '" stroke-dasharray="3 4" style="stroke:var(--sc-line)"></line>'
  s += '<g class="sc-a-x">' + cinta + '</g>'

  o.segments.forEach((t, i) => {
    const e = o.states[t[2]]
    const datos = ' data-sc-s="' + esc(t[2]) + '"' + tip(e.label, dura(t[1] - t[0]), hora(t[0]) + ' a ' + hora(t[1]), e.hue)

    if (e.hatched) {
      const caja = 'x="' + n1(x(t[0]) + 3) + '" y="' + (cy(t[2]) - alto / 2) + '" width="' + n1(x(t[1]) - x(t[0]) - 6) + '" height="' + alto + '" rx="7"'

      s += '<g class="sc-a-in" style="--i:' + n1(i * 0.3) + '"' + datos + '><rect ' + caja + ' style="fill:' + tinte(e.hue, 'var(--sc-track)') + '"></rect><rect ' + caja + ' mask="' + R.d + '" class="sc-hatch" style="fill:' + col(e.hue) + '"></rect></g>'
    } else {
      // Zona de hover de toda la columna: un cuello de 5 px sería imposible de acertar.
      s += '<rect x="' + x(t[0]) + '" y="16" width="' + n1(x(t[1]) - x(t[0])) + '" height="' + (fondo - 16) + '" fill="transparent"' + datos + '></rect>'
    }
  })

  ;(o.ticks || []).forEach((t, i, todos) => {
    const ancla = i === 0 ? 'start' : i === todos.length - 1 ? 'end' : 'middle'

    s += '<text x="' + x(t.at) + '" y="' + (fondo + 18) + '" text-anchor="' + ancla + '">' + esc(t.label) + '</text>'
    if (t.sub) s += '<text x="' + x(t.at) + '" y="' + (fondo + 32) + '" text-anchor="' + ancla + '" style="fill:var(--sc-faint)">' + esc(t.sub) + '</text>'
  })

  const orden = claves.slice().sort((p, q) => Number(Boolean(o.states[p].hatched)) - Number(Boolean(o.states[q].hatched)) || o.states[p].lane - o.states[q].lane)

  return '<div class="sc-chart sc-ribbon">' + headline(o.headline) +
    legend(orden.map(k => ({ key: k, label: o.states[k].label, hue: o.states[k].hue, hatched: o.states[k].hatched }))) +
    '<div class="sc-scroll sc-xl">' + s + '</svg></div></div>'
}
