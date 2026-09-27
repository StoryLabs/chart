// Salida estable: con la opción id, las mismas opciones dan el mismo HTML byte por byte, así
// render() saltea lo que no cambió. Sin id, el contador de siempre.
import { test, expect } from 'bun:test'
import * as SC from '../../src/index.js'

const CASOS = {
  line: { values: [64, 71, 66, 69], max: 100, unit: 'ms' },
  stackedLine: { max: 100, series: [{ key: 'a', label: 'A', hue: 'blue', values: [1, 2, 3] }] },
  columns: { max: 4, data: [{ label: 'a', value: 2 }] },
  pie: { slices: [{ key: 'a', label: 'A', value: 2, hue: 'blue' }, { key: 'b', label: 'B', value: 1, hue: 'sky' }] },
  rings: { rings: [{ key: 'a', label: 'A', value: 40, hue: 'blue' }] },
  heatmap: { rows: ['a'], values: [[1, 'x']] },
  ribbon: { rest: 'w', states: { w: { label: 'W', hue: 'blue', lane: 0 } }, segments: [[0, 24, 'w']] }
}
const ids = html => [...html.matchAll(/ id="([^"]+)"/g)].map(m => m[1])

for (const [fn, o] of Object.entries(CASOS)) {
  test(fn + ' con id: dos llamadas dan el mismo HTML, y los ids llevan el id', () => {
    const a = SC[fn]({ ...o, id: 'comun' })

    expect(SC[fn]({ ...o, id: 'comun' })).toBe(a)
    expect(ids(a).length).toBeGreaterThan(0)
    for (const i of ids(a)) expect(i).toContain('-comun')
  })

  test(fn + ' con ids distintos no comparte ningún id', () => {
    const a = ids(SC[fn]({ ...o, id: 'uno' }))
    const b = ids(SC[fn]({ ...o, id: 'dos' }))

    expect(a.filter(i => b.includes(i))).toEqual([])
  })
}

test('un id hostil se valida como token: no rompe el atributo', () => {
  const html = SC.line({ ...CASOS.line, id: '"><img src=x>' })

  expect(html).not.toContain('<img')
  expect(ids(html)[0]).toBe('scstd-imgsrcx')
})

test('el id viaja en data-sc-opts de los redibujables', () => {
  expect(SC.pie({ ...CASOS.pie, id: 'torta' })).toContain('&quot;id&quot;:&quot;torta&quot;')
})
