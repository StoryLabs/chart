// Casos con huecos para la opción gaps. huecos-empty.json guarda lo que el código daba ANTES de
// que existiera gaps (el corte simple): con gaps: 'empty' la salida tiene que seguir siendo ésa.
export const CASOS_HUECOS = [
  ['line-huecos', 'line', { values: [5, 6, null, null, 7, 8, null, 6, null, 7, 9], labels: 'abcdefghijk'.split(''), max: 10, band: [4, 7], threshold: { value: 8.5 } }],
  ['line-hueco-al-borde', 'line', { values: [null, 5, 6, 7, null], max: 10, buffer: true }],
  ['stackedLine-huecos', 'stackedLine', { max: 20, series: [{ key: 'a', label: 'A', hue: 'blue', values: [1, 2, 3, 4, 5, 6] }, { key: 'b', label: 'B', hue: 'sky', values: [1, 2, null, 4, 5, 6] }] }],
  ['columns-huecos', 'columns', { max: 4, unit: ['ping', 'pings'], data: [{ label: 'a', value: 2 }, { label: 'b', value: null }, { label: 'c', value: 0 }, { label: 'd', value: 3 }] }],
  ['stacked-huecos', 'stacked', { max: 4, series: [{ key: 'a', label: 'A', hue: 'blue' }, { key: 'b', label: 'B', hue: 'sky' }], data: [{ label: 'd1', values: { a: 2, b: 1 } }, { label: 'd2' }, { label: 'd3', values: { a: 0, b: 0 } }, { label: 'd4', values: { a: null, b: undefined } }] }]
]
