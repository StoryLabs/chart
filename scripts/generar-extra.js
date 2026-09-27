// Casos canónicos EXTRA: opciones documentadas que los 47 del prototipo no usan. Van DESPUÉS de los
// 47 (el contador de ids sigue desde ahí) y son de otra clase: los 47 comparan contra el prototipo;
// éstos congelan lo que el repo hace hoy, después de haberlos dibujado y mirado.
// Uso: bun scripts/generar-extra.js   (reescribe test/fixtures/casos-extra.json y salidas-extra.json)
import { writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import * as SC from '../src/index.js'
import { resetIds } from '../src/core/ids.js'
import casos from '../test/fixtures/casos-canonicos.json'

const dir = new URL('../test/fixtures/', import.meta.url)
const lista = (n, f) => Array.from({ length: n }, (_, i) => f(i))
const onda = (n, base, amp, fase) => lista(n, i => Math.round((base + amp * Math.sin(i / 5 + fase)) * 10) / 10)

const EXTRA = [
  ['line-hue2', 'line', [{ label: 'Latencia con banda en dos tonos', values: onda(40, 80, 30, 0), max: 160, yTicks: [0, 80, 160], unit: 'ms', band: [60, 110], hue: 'blue', hue2: 'violet' }]],
  ['stackedLine-chip-y-maxPoints', 'stackedLine', [{
    label: 'Recortada a 120 puntos', headline: { parts: [[88, 'ms']], chip: 'estable' }, unit: 'ms', max: 160, yTicks: [0, 80, 160], maxPoints: 120,
    labels: lista(400, i => 'p' + i), xTicks: [{ at: 0, label: 'inicio' }, { at: 399, label: 'fin' }],
    series: [{ key: 'a', label: 'Shared path', hue: 'blue', values: onda(400, 60, 10, 0) }, { key: 'b', label: 'Aporte propio', hue: 'violet', values: onda(400, 20, 8, 1) }]
  }]],
  ['stacked-alto-y-titulos', 'stacked', [{
    label: 'Pings por día, más alto', variant: 'line', unit: ['ping', 'pings'], max: 144, yTicks: [0, 72, 144], height: 260,
    series: [{ key: 'warm', label: 'Warm', hue: 'blue' }, { key: 'cold', label: 'Cold start', hue: 'sky' }, { key: 'none', label: 'Sin pings', hue: 'neutral', hatched: true }],
    data: [['lun', 'lunes 21', 120, 20, 4], ['mar', 'martes 22', 100, 30, 14], ['mié', 'miércoles 23', 90, 10, 44]].map((d, i) => ({ label: d[0], title: d[1], current: i === 2, values: { warm: d[2], cold: d[3], none: d[4] } }))
  }]],
  ['ribbon-chip', 'ribbon', [{
    label: 'Estado con chip', headline: { parts: [[3, 'h'], [20, 'min cold']], chip: 'revisar' }, rest: 'warm', domain: [0, 12],
    states: { warm: { label: 'Warm', hue: 'blue', lane: 1 }, cold: { label: 'Cold start', hue: 'sky', lane: 0 } },
    segments: [[0, 4, 'warm'], [4, 7.33, 'cold'], [7.33, 12, 'warm']], ticks: [{ at: 0, label: '00:00' }, { at: 12, label: '12:00' }]
  }]],
  ['ribbon-minutos', 'ribbon', [{ rest: 'w', unit: 'min', domain: [0, 120], states: { w: { label: 'Warm', hue: 'blue', lane: 0 }, c: { label: 'Cold start', hue: 'sky', lane: 1 } }, segments: [[0, 90, 'w'], [90, 120, 'c']], ticks: [{ at: 0, label: '-2 h' }, { at: 120, label: 'ahora' }] }]],
  ['bullet-min', 'bullet', [{ label: 'Uptime 30d', value: 99.95, unit: '%', min: 99, max: 100, reference: [99.5, 100], side: 'objetivo 99.5%' }]],
  ['range-min', 'range', [{ unit: 'ms', min: 100, max: 300, ticks: [100, 200, 300], rows: [{ label: 'checkout-api', from: 68, to: 257 }, { label: 'search-api', from: 30, to: 320 }] }]],
  // La opción id: ids del SVG estables, sin contador.
  ['rings-id', 'rings', [{ id: 'score', rings: [{ key: 'a', label: 'A', value: 60, hue: 'blue' }] }]],
  ['ribbon-id', 'ribbon', [{ id: 'estado', rest: 'w', states: { w: { label: 'W', hue: 'blue', lane: 0 } }, segments: [[0, 24, 'w']] }]],
  ['line-id', 'line', [{ id: 'ttfb', values: [64, 71, 66, 69], max: 100, unit: 'ms' }]],
  ['stackedLine-id', 'stackedLine', [{ id: 'partes', max: 100, series: [{ key: 'a', label: 'A', hue: 'blue', values: [1, 2, 3] }] }]],
  ['columns-id', 'columns', [{ id: 'dias', max: 4, data: [{ label: 'a', value: 2 }] }]],
  ['pie-id', 'pie', [{ id: 'torta', slices: [{ key: 'a', label: 'A', value: 2, hue: 'blue' }, { key: 'b', label: 'B', value: 1, hue: 'sky' }] }]],
  ['heatmap-id', 'heatmap', [{ id: 'horas', rows: ['a'], values: [[1, 'x']] }]]
]

resetIds()
for (const c of casos) SC[c.fn](...structuredClone(c.args))
const extra = EXTRA.map(([id, fn, args]) => ({ id, fn, args: JSON.parse(JSON.stringify(args)) }))
const salidas = extra.map(c => {
  const html = SC[c.fn](...structuredClone(c.args))

  return { id: c.id, fn: c.fn, bytes: Buffer.byteLength(html), sha256: createHash('sha256').update(html).digest('hex'), html }
})

writeFileSync(new URL('casos-extra.json', dir), JSON.stringify(extra, null, 1))
writeFileSync(new URL('salidas-extra.json', dir), JSON.stringify(salidas, null, 1))
console.log(extra.length + ' casos extra: ' + extra.map(c => c.id).join(', '))
