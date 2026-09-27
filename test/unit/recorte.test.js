// Recorte fuera de escala: se recorta el DIBUJO contra el área del gráfico, no el dato. El elemento
// que se pasa lleva data-sc-over y el tooltip muestra el valor real. Sin valores afuera, nada cambia.
import { test, expect, beforeEach } from 'bun:test'
import * as SC from '../../src/index.js'
import { resetIds } from '../../src/core/ids.js'
import { datos, tooltips } from './ayuda.js'

beforeEach(resetIds)

const clip = html => html.match(/<clipPath id="(sccp\d+)"><rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"><\/rect><\/clipPath>/)

test('line: un pico sobre max se recorta contra el plot, lleva data-sc-over y el dato viaja entero', () => {
  const html = SC.line({ values: [70, 72, 3000, 71], max: 400, unit: 'ms' })
  const c = clip(html)

  expect(c.slice(2).map(Number)).toEqual([44, 14, 580, 190])
  expect(html).toMatch(new RegExp('<g data-sc-s="series" clip-path="url\\(#' + c[1] + '\\)" data-sc-over>'))
  expect(datos(html, 'data-sc-line').v).toContain(3000)
})

test('line: un valor negativo también queda afuera', () => {
  expect(SC.line({ values: [5, -20, 6], max: 10 })).toContain('data-sc-over')
})

test('line: sin valores afuera no hay clipPath ni data-sc-over', () => {
  const html = SC.line({ values: [1, 2, 3], max: 4 })

  expect(html).not.toContain('clipPath')
  expect(html).not.toContain('data-sc-over')
})

test('stackedLine: el total sobre max recorta las series y marca las que se pasan', () => {
  const html = SC.stackedLine({ max: 100, series: [{ key: 'a', label: 'A', hue: 'blue', values: [40, 40, 40] }, { key: 'b', label: 'B', hue: 'sky', values: [10, 90, 10] }] })

  expect(clip(html)).not.toBeNull()
  expect(html).toMatch(/<g data-sc-s="b"[^>]*clip-path="url\(#sccp\d+\)"[^>]*data-sc-over/)
  expect(html).not.toMatch(/<g data-sc-s="a"[^>]*data-sc-over/)
})

test('columns: la columna que se pasa se recorta, lleva data-sc-over y su tooltip dice el real', () => {
  const html = SC.columns({ max: 4, unit: ['ms', 'ms'], data: [{ label: 'a', value: 2 }, { label: 'b', value: 3000 }] })
  const [a, b] = html.split('<g class="sc-a-y"').slice(1)

  expect(clip(html)).not.toBeNull()
  expect(b).toMatch(/^[^>]*clip-path="url\(#sccp\d+\)"[^>]*data-sc-over/)
  expect(a.split('>')[0]).not.toContain('data-sc-over')
  expect(tooltips(html)[1].v).toBe('3000 ms')
})

test('stacked: la pila que se pasa se recorta al alto del plot y lleva data-sc-over', () => {
  const html = SC.stacked({ max: 10, series: [{ key: 'a', label: 'A', hue: 'blue' }], data: [{ label: 'd1', values: { a: 5 } }, { label: 'd2', values: { a: 300 } }] })
  const pilas = html.match(/<div class="sc-stack sc-a-y"[^>]*>/g)

  expect(pilas[0]).not.toContain('data-sc-over')
  expect(pilas[1]).toContain('data-sc-over')
  expect(pilas[1]).toContain('overflow:hidden')
  expect(tooltips(html)[1].v).toBe('300')
})
