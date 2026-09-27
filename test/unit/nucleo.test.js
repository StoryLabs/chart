import { describe, test, expect } from 'bun:test'
import { esc, n1, entre, conUnidad, cuenta } from '../../src/core/format.js'
import { muestreo } from '../../src/core/muestreo.js'
import { HOSTIL } from './ayuda.js'

describe('esc', () => {
  test('neutraliza los cinco caracteres que abren HTML o cortan un atributo', () => {
    expect(esc(HOSTIL)).toBe('&lt;img src=x onerror=alert(1)&gt; &quot;comillas&quot; &#39;simples&#39; &amp; &lt;/div&gt;')
  })

  test('null y undefined salen vacíos; números y ceros, como texto', () => {
    expect(esc(null)).toBe('')
    expect(esc(undefined)).toBe('')
    expect(esc(0)).toBe('0')
  })
})

test('n1 redondea a un decimal y entre recorta a [0, 1]', () => {
  expect(n1(1.25)).toBe(1.3)
  expect(n1(-0.04)).toBe(-0)
  expect([entre(-2), entre(0.4), entre(9)]).toEqual([0, 0.4, 1])
})

test('conUnidad pega el %; cuenta elige singular o plural', () => {
  expect(conUnidad(5, '%')).toBe('5%')
  expect(conUnidad(5, 'ms')).toBe('5 ms')
  expect(conUnidad(5, '')).toBe('5')
  expect(cuenta(1, ['ping', 'pings'])).toBe('1 ping')
  expect(cuenta(0, ['ping', 'pings'])).toBe('0 pings')
})

describe('muestreo', () => {
  const serie = n => Array.from({ length: n }, (_, i) => Math.sin(i / 7) * 10)

  test('con menos puntos que cupo no recorta', () => {
    expect(muestreo(serie(600), 600)).toBeNull()
  })

  test('recorta al cupo, conserva el primero y el último y los índices van en orden', () => {
    const idx = muestreo(serie(10000), 600)

    expect(idx.length).toBeLessThanOrEqual(602)
    expect(idx[0]).toBe(0)
    expect(idx.at(-1)).toBe(9999)
    for (let i = 1; i < idx.length; i++) expect(idx[i]).toBeGreaterThan(idx[i - 1])
  })

  test('conserva los picos: un máximo y un mínimo aislados sobreviven al recorte', () => {
    const v = serie(10000)

    v[4321] = 999
    v[7777] = -999
    const idx = muestreo(v, 600)

    expect(idx).toContain(4321)
    expect(idx).toContain(7777)
  })
})
