// Lo que no se midió se dibuja como lo que es: por defecto, una banda rayada neutra en el
// hueco; con gaps: 'empty', el corte simple. Un valor desconocido usa el default.
import { tinte } from './format.js'
import { textos } from './textos.js'

export const conBanda = o => o.gaps !== 'empty'

/** Rachas de posiciones sin dato: [[desde, hasta], …], índices inclusive. */
export const rachasNulas = v => {
  const r = []

  v.forEach((n, i) => {
    if (n !== null) return
    if (r.length && r[r.length - 1][1] === i - 1) r[r.length - 1][1] = i
    else r.push([i, i])
  })

  return r
}

// Base OPACA del color de la superficie: el hueco interrumpe todo lo de abajo (incluida la banda
// de referencia, que ya va rayada) y se lee como una sola cosa. Encima, tinte y rayado neutros.
export const franja = (caja, R) =>
  '<rect ' + caja + ' style="fill:var(--sc-surface)"></rect><rect ' + caja + ' style="fill:' + tinte('neutral', 'var(--sc-track)') + '"></rect><rect ' + caja + ' mask="' + R.d + '" class="sc-hatch" style="fill:var(--sc-neutral)"></rect>'

export const itemHueco = () => ({ key: 'gaps', label: textos.empty, hue: 'neutral', hatched: true })
