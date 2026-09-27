// Meta-test: la lista de opciones (test/fixtures/opciones.txt) y los casos canónicos se cubren en
// las dos direcciones. Así el recorrido hoja por hoja de inyeccion.test.js ve todas las opciones.
import { test, expect } from 'bun:test'
import { readFileSync } from 'node:fs'
import { casos } from './casos.js'

const lista = {}
let actual = null

for (const linea of readFileSync(new URL('../fixtures/opciones.txt', import.meta.url), 'utf8').split('\n')) {
  if (!linea.trim() || linea.startsWith('#')) continue
  const partes = linea.trim().split(/\s+/)

  if (!linea.startsWith(' ')) actual = partes.shift()
  lista[actual] = (lista[actual] || []).concat(partes)
}

/** La ruta de una hoja en notación de la lista: índices como [], el segundo argumento como #1. */
const rutas = (v, ruta = '') => {
  if (Array.isArray(v)) return v.flatMap(x => rutas(x, ruta + '[]'))
  if (v && typeof v === 'object') return Object.keys(v).flatMap(k => rutas(v[k], ruta ? ruta + '.' + k : k))

  return [ruta]
}
const deCaso = c => [...rutas(c.args[0]), ...c.args.slice(1).map((_, i) => '#' + (i + 1))]
const patron = p => new RegExp('^' + p.replace(/[.[\]]/g, '\\$&').replace(/\*/g, '[^.[]+') + '$')
const encaja = (fn, r) => lista[fn].some(p => patron(p).test(r))

test('toda hoja de un caso canónico está en la lista de opciones', () => {
  const fuera = [...new Set(casos.flatMap(c => deCaso(c).filter(r => !encaja(c.fn, r)).map(r => c.fn + ' ' + r)))]

  expect(fuera).toEqual([])
})

test('toda opción de la lista aparece en algún caso canónico', () => {
  const usadas = casos.flatMap(c => deCaso(c).map(r => [c.fn, r]))
  const sinCaso = Object.entries(lista).flatMap(([fn, ps]) => ps.filter(p => !usadas.some(([f, r]) => f === fn && patron(p).test(r))).map(p => fn + ' ' + p))

  expect(sinCaso).toEqual([])
})

test('la lista cubre las doce funciones que dibujan', () => {
  expect(Object.keys(lista).sort()).toEqual(['bullet', 'columns', 'heatmap', 'legend', 'line', 'pie', 'range', 'rings', 'segmented', 'stacked', 'stackedLine', 'state'].concat(['ribbon']).sort())
})
