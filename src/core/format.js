export const pad = n => String(n).padStart(2, '0')

export const n1 = v => Math.round(v * 10) / 10

export const entre = v => Math.min(1, Math.max(0, v))

export const esc = s => String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

// Cada contexto tiene su defensa. Un tono es un nombre de token: se VALIDA (letras, números, guion y
// guion bajo) y no se escapa, porque va dentro de un style. Si no queda nada, neutral.
export const token = h => String(h === null || h === undefined ? '' : h).replace(/[^\w-]/g, '') || 'neutral'
// Un número que va a un style o a una cuenta: si no es finito, el default.
export const num = (v, def = 0) => (Number.isFinite(Number(v)) ? Number(v) : def)
// Un color CSS libre: lista blanca de caracteres (quedan afuera comillas, <, >, punto y coma y dos
// puntos). Si igual trae url( o paréntesis que no cierran, no es un color: se usa el neutro.
export const colorLibre = c => {
  const v = String(c).replace(/[^\w#%(),. -]/g, '')
  let abiertos = 0

  for (const ch of v) if ((abiertos += ch === '(' ? 1 : ch === ')' ? -1 : 0) < 0) break

  return /url\(/i.test(v) || abiertos !== 0 ? 'var(--sc-neutral)' : v
}
// Un solo lugar decide qué es un dato: un número (o un texto numérico), o null si falta. null,
// undefined, NaN, un texto que no es número y un booleano no son datos. Un dato que falta no es un cero.
export const valor = v => {
  const n = v === null || v === undefined || v === '' || typeof v === 'boolean' ? NaN : Number(v)

  return Number.isFinite(n) ? n : null
}
export const n1v = v => (v === null ? null : n1(v))
export const col = h => 'var(--sc-' + token(h) + ')'

export const tinte = (h, pct) => 'color-mix(in srgb, ' + col(h) + ' ' + pct + ', transparent)'

export const conUnidad = (v, u) => (u === '%' ? v + '%' : v + (u ? ' ' + u : ''))

export const cuenta = (n, par) => n + ' ' + (n === 1 ? par[0] : par[1])

export const tip = (t, v, d, h) => ' data-sc-t="' + esc(t) + '" data-sc-v="' + esc(v) + '" data-sc-d="' + esc(d || '') + '" data-sc-h="' + esc(h || 'neutral') + '"'
