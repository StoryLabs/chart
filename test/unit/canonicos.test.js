// Los 47 del prototipo: cada función devuelve el mismo string, byte por byte, que fuente/lib.js.
// Los extra congelan lo que el repo hace hoy (se generan con scripts/generar-extra.js, mirados antes).
// Los ids de los SVG salen de un contador: se parte de cero y se corren los casos EN ORDEN.
import { test, expect, beforeAll } from 'bun:test'
import * as SC from '../../src/index.js'
import { resetIds } from '../../src/core/ids.js'
import { casos, salidas } from './casos.js'

const obtenidas = []

beforeAll(() => {
  resetIds()
  for (const c of casos) obtenidas.push(SC[c.fn](...structuredClone(c.args)))
})

// Salieron del juego: stacked-blend y stacked-blend-sin-cold. Carlos eliminó la variante blend de
// stacked() el 2026-09-26; stacked es HTML y no consume el contador de ids, así que los demás no
// se corrieron.
test('45 casos del prototipo primero, los extra detrás, en el mismo orden que sus salidas', () => {
  expect(casos.filter(c => c.clase === 'prototipo').length).toBe(45)
  expect(casos.findIndex(c => c.clase === 'extra')).toBe(45)
  expect(casos.map(c => c.id)).toEqual(salidas.map(s => s.id))
})

casos.forEach((c, i) => {
  // Un caso del prototipo que un paso cambió a propósito lleva el motivo en salidas-canonicas.json
  // (cambio) y la salida original en html_prototipo.
  const tipo = c.clase === 'extra' ? 'igual a lo congelado: ' : salidas[i].cambio ? 'cambiado a propósito (' + salidas[i].cambio + '): ' : 'idéntico al prototipo: '

  test(tipo + c.id, () => {
    expect(obtenidas[i]).toBe(salidas[i].html)
  })
})
