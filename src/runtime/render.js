import { setHatch } from './hatch.js'

/**
 * Pinta un gráfico en un elemento SÓLO si cambió. Un tablero que se refresca cada pocos
 * segundos casi siempre trae lo mismo, y volver a insertar lo mismo obliga al navegador a
 * tirar los nodos, crearlos de nuevo y recalcular el layout para dejar todo igual.
 */
export const render = (el, html) => {
  if (el.scHtml === html) return false

  el.innerHTML = html
  el.scHtml = html
  setHatch()

  return true
}
