// El README no puede mentir sin que un test se ponga rojo: cada bloque js que es una llamada a un
// gráfico se ejecuta con las funciones de la librería, y no puede devolver el estado de error, ni
// el vacío, ni escribir NaN o Infinity.
import { test, expect } from 'bun:test'
import { readFileSync } from 'node:fs'
import * as SC from '../../src/index.js'

const GRAFICOS = ['bullet', 'rings', 'segmented', 'ribbon', 'line', 'stackedLine', 'columns', 'stacked', 'pie', 'heatmap', 'range', 'diverging', 'state', 'legend']
const readme = readFileSync(new URL('../../README.md', import.meta.url), 'utf8')
const bloques = [...readme.matchAll(/```js\n([\s\S]*?)```/g)].map(m => m[1].trim())
const llamadas = bloques.filter(b => new RegExp('^(' + GRAFICOS.join('|') + ')\\(').test(b))
const correr = codigo => new Function(...GRAFICOS, 'return (' + codigo + ')')(...GRAFICOS.map(g => SC[g]))

test('el README trae una llamada de ejemplo por cada gráfico', () => {
  const nombres = new Set(llamadas.map(b => b.match(/^(\w+)\(/)[1]))

  for (const g of GRAFICOS.filter(g => !['state', 'legend'].includes(g))) expect(nombres.has(g)).toBe(true)
})

llamadas.forEach((codigo, i) => {
  test('ejemplo ' + (i + 1) + ' del README: ' + codigo.slice(0, 50).replace(/\s+/g, ' '), () => {
    const html = correr(codigo)

    expect(typeof html).toBe('string')
    expect(html).not.toContain('data-sc-error')
    expect(html).not.toContain('sc-state')
    expect(html).not.toMatch(/NaN|Infinity/)
  })
})

// Las llamadas que van dentro de una tabla o de otro bloque (Empezar, Vue, React, estados).
test('las llamadas de la tabla de estados y de Empezar también corren', () => {
  const sueltas = [...readme.matchAll(/`((?:bullet|state)\(\{[^`]*\}\))`/g)].map(m => m[1])

  expect(sueltas.length).toBeGreaterThan(1)
  for (const c of sueltas) expect(correr(c)).not.toMatch(/NaN|data-sc-error/)
  expect(correr("bullet({ label: 'Warm p50', value: 69, unit: 'ms', max: 500, reference: [0, 250] })")).toContain('sc-bullet')
})
