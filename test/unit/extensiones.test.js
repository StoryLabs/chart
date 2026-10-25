// Extensiones aditivas: unit con formato, min, compare, events y textos configurables.
import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import * as SC from '../../src/index.js'
import { resetIds } from '../../src/core/ids.js'
import { textos } from '../../src/core/textos.js'

beforeEach(resetIds)

const base = { ...textos }

afterEach(() => SC.setTextos(base))

const o = { values: [100, 120, 90, 150], max: 200, labels: ['a', 'b', 'c', 'd'] }

describe('textos configurables', () => {
  test('setTextos cambia el texto y reemplaza {nombre}', () => {
    SC.setTextos({ thresholdLegend: 'Limit {value}' })
    expect(SC.line({ ...o, threshold: { value: 100 } })).toContain('Limit 100')
  })

  test('sin setTextos la salida es la de siempre', () => {
    expect(SC.line({ ...o, threshold: { value: 100 } })).toContain('Umbral de 100')
  })

  test('el vacío y los rótulos aria salen de textos', () => {
    SC.setTextos({ empty: 'No data', lineLabel: 'Over time' })
    expect(SC.line({ values: [], max: 1 })).toContain('No data')
    expect(SC.line(o)).toContain('aria-label="Over time"')
  })
})

describe('line: opciones nuevas', () => {
  test('sin opciones nuevas los datos del cursor no crecen', () => {
    const h = SC.line(o)

    expect(h).not.toContain('&quot;min&quot;')
    expect(h).not.toContain('&quot;cn&quot;')
    expect(h).not.toContain('&quot;ev&quot;')
  })

  test('unit con formato escribe moneda y marcas compactas', () => {
    const h = SC.line({ ...o, unit: { currency: 'USD' } })

    expect(h).toContain('$200')
    expect(h).not.toContain('[object Object]')
  })

  test('min con valores negativos marca el cero', () => {
    expect(SC.line({ values: [-5, 3, 8], min: -10, max: 10 })).toContain('stroke-dasharray="3 4"')
  })

  test('compare y events dibujan sus capas y su leyenda', () => {
    const h = SC.line({ ...o, compare: { values: [90, 100, 100, 100], label: 'Invested' }, events: [{ at: 1, label: 'Deposit' }], eventsLabel: 'Moves' })

    expect(h).toContain('data-sc-s="compare"')
    expect(h).toContain('data-sc-s="events"')
    expect(h).toContain('Invested')
    expect(h).toContain('Moves')
  })

  test('el color de la leyenda de eventos sigue al de los marcadores', () => {
    expect(SC.line({ ...o, events: [{ at: 1, hue: 'amber' }] })).toContain('--c:var(--sc-amber)')
  })
})
