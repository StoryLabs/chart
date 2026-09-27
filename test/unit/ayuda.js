// Lectura mínima del HTML que devuelven los gráficos, sin DOM: las funciones puras se prueban en Bun.
export const veces = (html, re) => (html.match(new RegExp(re, 'g')) || []).length

/** Valor de un atributo en cada etiqueta que lo lleva, en orden. */
export const atributos = (html, nombre) => [...html.matchAll(new RegExp(' ' + nombre + '="([^"]*)"', 'g'))].map(m => m[1])

const desescapar = s => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

/** El JSON que viaja en un atributo data-sc-* (line, area, heat, opts). */
export const datos = (html, nombre) => JSON.parse(desescapar(atributos(html, nombre)[0]))

/** Los grupos <g ...>…</g> sin anidar cuyo data-sc-s es la clave dada. */
export const grupos = (html, clave) => [...html.matchAll(/<g [^>]*>(?:(?!<\/?g[ >]).)*<\/g>/gs)].map(m => m[0]).filter(g => g.startsWith('<g') && g.includes('data-sc-s="' + clave + '"'))

/** Todos los data-sc-t (título del tooltip) y data-sc-d (detalle), desescapados. */
export const tooltips = html => {
  const t = atributos(html, 'data-sc-t').map(desescapar)
  const v = atributos(html, 'data-sc-v').map(desescapar)
  const d = atributos(html, 'data-sc-d').map(desescapar)

  return t.map((x, i) => ({ t: x, v: v[i], d: d[i] }))
}

export const HOSTIL = '<img src=x onerror=alert(1)> "comillas" \'simples\' & </div>'
