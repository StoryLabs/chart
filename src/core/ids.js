// Contador de los ids de los SVG (máscaras y gradientes). Avanza con cada gráfico que dibuja un SVG.
let uid = 0

export const nextId = () => ++uid

/** Sólo para los tests: vuelve el contador a cero. index.js no lo reexporta. */
export const resetIds = () => {
  uid = 0
}
