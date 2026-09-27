// diverging(): barras desde un cero al medio, en una escala simétrica de -max a +max.
import { test, expect } from 'bun:test'
import * as SC from '../../src/index.js'
import { tooltips } from './ayuda.js'

const CASO = {
  unit: 'ms', max: 60, sides: ['más rápida', 'más lenta'], reference: [-12, 12],
  rows: [
    { key: 'a', label: 'checkout-api', value: 38, hue: 'orange' },
    { key: 'b', label: 'search-api', value: 14, hue: 'amber' },
    { key: 'c', label: 'auth-api', value: 3 },
    { key: 'd', label: 'catalog-api', value: -2 },
    { key: 'e', label: 'billing-api', value: -9 },
    { key: 'f', label: 'reports-api', value: null },
    { key: 'g', label: 'export-api', value: 240 }
  ]
}
const html = () => SC.diverging(CASO)
const fila = (h, key) => h.split('data-sc-s="' + key + '"')[1].split('</span></div>')[0]
const barra = f => f.match(/class="sc-val[^"]*" style="left:([\d.]+)%;width:([\d.]+)%/)

test('el cero queda al medio y +30 mide lo mismo que -30', () => {
  const h = SC.diverging({ max: 60, rows: [{ key: 'p', label: 'p', value: 30 }, { key: 'n', label: 'n', value: -30 }] })

  expect(barra(fila(h, 'p')).slice(1).map(Number)).toEqual([50, 25])
  expect(barra(fila(h, 'n')).slice(1).map(Number)).toEqual([25, 25])
  expect(h).toContain('class="sc-cero"')
})

test('la banda de referencia va rayada en su lugar', () => {
  expect(fila(html(), 'a')).toContain('class="sc-ref" style="left:40%;width:20%"><i class="sc-hfill"></i>')
})

test('el valor se escribe con signo', () => {
  const t = tooltips(html())

  expect(t.map(x => x.v)).toEqual(['+38 ms', '+14 ms', '+3 ms', '-2 ms', '-9 ms', 'Sin datos', '+240 ms'])
  expect(tooltips(SC.diverging({ max: 10, unit: 'ms', rows: [{ key: 'z', label: 'z', value: 0 }] }))[0].v).toBe('0 ms')
})

test('hue por fila; si no, blue para positivo y green para negativo, o los generales', () => {
  expect(fila(html(), 'a')).toContain('--c:var(--sc-orange)')
  expect(fila(html(), 'c')).toContain('--c:var(--sc-blue)')
  expect(fila(html(), 'e')).toContain('--c:var(--sc-green)')
  expect(fila(SC.diverging({ max: 10, hue: 'violet', negativeHue: 'sky', rows: [{ key: 'n', label: 'n', value: -1 }] }), 'n')).toContain('--c:var(--sc-sky)')
})

test('sin valor: la pista queda, sin barra, con — y no es un cero', () => {
  const f = fila(html(), 'f')

  expect(f).not.toContain('sc-val')
  expect(f).toContain('<b>—</b>')
})

test('fuera de escala: la barra llega al borde, lleva data-sc-over y el tooltip dice el real', () => {
  const f = fila(html(), 'g')

  expect(barra(f).slice(1).map(Number)).toEqual([50, 50])
  expect(f).toContain('data-sc-over')
  expect(fila(html(), 'a')).not.toContain('data-sc-over')
})

test('el eje: -max, 0 y +max, y los rótulos de cada mitad', () => {
  const h = html()

  expect(h).toContain('>-60</span>')
  expect(h).toContain('>0</span>')
  expect(h).toContain('>+60 ms</span>')
  expect(h).toContain('>más rápida</span>')
  expect(h).toContain('>más lenta</span>')
})
