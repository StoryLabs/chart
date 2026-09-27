// La opción gaps: el hueco lleva banda rayada neutra por defecto; 'empty' es el corte simple.
import { test, expect, beforeEach } from 'bun:test'
import * as SC from '../../src/index.js'
import { resetIds } from '../../src/core/ids.js'
import { CASOS_HUECOS } from '../fixtures/huecos-casos.js'
import congelados from '../fixtures/huecos-empty.json'
import { grupos } from './ayuda.js'

beforeEach(resetIds)

const dibujar = (fn, o) => {
  resetIds()

  return SC[fn](structuredClone(o))
}

CASOS_HUECOS.forEach(([id, fn, o], i) => {
  test("gaps: 'empty' da byte por byte el corte simple de antes: " + id, () => {
    // Los gráficos que se redibujan llevan sus opciones en data-sc-opts: ahí figura la opción nueva.
    expect(dibujar(fn, { ...o, gaps: 'empty' }).replace(',&quot;gaps&quot;:&quot;empty&quot;', '')).toBe(congelados[i].html)
  })

  test('gaps por defecto: el hueco trae su serie data-sc-s="gaps" rayada y el ítem Sin datos: ' + id, () => {
    const html = dibujar(fn, o)

    expect(html).toContain('data-sc-s="gaps"')
    expect(html).toMatch(/data-sc-s="gaps"[^>]*>(?:(?!<\/g>|<\/div><\/div>).)*sc-h/s)
    expect(html).toMatch(/<i class="sc-sq sc-h" style="--c:var\(--sc-neutral\)"><\/i>Sin datos/)
  })
})

test('un valor de gaps que no es hatched ni empty usa el default, sin lanzar', () => {
  const [, fn, o] = CASOS_HUECOS[0]

  expect(dibujar(fn, { ...o, gaps: 'x' })).toBe(dibujar(fn, o))
})

test('sin huecos, gaps no agrega nada: ni serie ni ítem de leyenda', () => {
  const html = SC.line({ values: [1, 2, 3], max: 4 })

  expect(html).not.toContain('gaps')
  expect(html).not.toContain('Sin datos')
})

const bandas = html => grupos(html, 'gaps').flatMap(g => [...g.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" style="fill:var\(--sc-surface\)"/g)].map(m => m.slice(1).map(Number)))

test('line: la banda va del último punto medido antes del hueco al primero después, de cero al máximo', () => {
  // x(i) = 44 + i / 10 * 580. Hueco en 2-3: de x(1)=102 a x(4)=276. Plot: y de 14 a 204.
  const [, , o] = CASOS_HUECOS[0]
  const html = dibujar('line', o)
  const [x, y, w, h] = bandas(html)[0]

  expect([x, y, n1(x + w), y + h]).toEqual([102, 14, 276, 204])
})

const n1 = v => Math.round(v * 10) / 10

test('line: tres capas (superficie opaca, tinte, rayado) y la banda va encima de la referencia y debajo de la línea', () => {
  const html = dibujar('line', CASOS_HUECOS[0][2])
  const g = grupos(html, 'gaps')[0]

  expect(g.indexOf('fill:var(--sc-surface)')).toBeLessThan(g.indexOf('var(--sc-track)'))
  expect(g.indexOf('var(--sc-track)')).toBeLessThan(g.indexOf('class="sc-hatch"'))
  expect(html.indexOf('data-sc-s="band"')).toBeLessThan(html.indexOf('data-sc-s="gaps"'))
  expect(html.indexOf('data-sc-s="threshold"')).toBeLessThan(html.indexOf('data-sc-s="gaps"'))
  expect(html.indexOf('data-sc-s="gaps"')).toBeLessThan(html.indexOf('data-sc-s="series"'))
})

test('line: un punto aislado entre dos huecos tiene una banda a cada lado', () => {
  // values[7] aislado: huecos en 6 y en 8. Bandas: x(5)→x(7) y x(7)→x(9).
  expect(bandas(dibujar('line', CASOS_HUECOS[0][2])).length).toBe(3)
})

test('columns: la columna que falta va rayada neutra de todo el alto; la de cero, sin nada', () => {
  const html = dibujar('columns', CASOS_HUECOS[3][2])
  const [, b, c] = html.split('data-sc-s="c').slice(1)

  expect(b).toContain('class="sc-hatch"')
  expect(b).toContain('var(--sc-neutral)')
  expect(c).not.toContain('sc-hatch')
})

test('stacked: la fila sin datos va rayada neutra; la fila en cero, vacía', () => {
  const html = dibujar('stacked', CASOS_HUECOS[4][2])
  const cols = html.split('<div class="sc-col">').slice(1)

  expect(cols[1]).toContain('data-sc-s="gaps"')
  expect(cols[3]).toContain('data-sc-s="gaps"')
  expect(cols[2]).not.toContain('data-sc-s="gaps"')
})
