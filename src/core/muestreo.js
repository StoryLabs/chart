/**
 * Qué puntos conservar cuando hay más puntos que lugar para dibujarlos. De cada tramo se queda
 * con su mínimo y su máximo, no con un promedio: lo que se mira en estas series son los picos, y
 * un promedio los aplana. Un hueco (null) también se conserva: si el recorte lo salteara, la
 * línea cruzaría por encima de lo que no se midió. Devuelve los índices originales, o null si no
 * hace falta recortar.
 */
export const muestreo = (valores, cupo) => {
  const n = valores.length

  if (n <= cupo) return null

  const tramos = Math.max(1, Math.floor(cupo / 2))
  const idx = [0]

  for (let t = 0; t < tramos; t++) {
    const a = 1 + Math.floor((t * (n - 2)) / tramos)
    const b = 1 + Math.floor(((t + 1) * (n - 2)) / tramos)
    let lo = -1
    let hi = -1
    let hueco = -1

    for (let i = a; i < b; i++) {
      if (valores[i] === null) {
        if (hueco < 0) hueco = i
        continue
      }
      if (lo < 0 || valores[i] < valores[lo]) lo = i
      if (hi < 0 || valores[i] > valores[hi]) hi = i
    }

    idx.push(...[...new Set([lo, hi, hueco])].filter(i => i >= 0).sort((p, q) => p - q))
  }

  idx.push(n - 1)

  return idx
}
