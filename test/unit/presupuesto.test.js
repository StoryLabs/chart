// Presupuesto de desempeño, la parte determinista: da lo mismo en cualquier máquina.
// Los tiempos dependen de la máquina y van aparte (bun run bench).
import { test, expect, beforeAll } from 'bun:test'
import * as SC from '../../src/index.js'
import { resetIds } from '../../src/core/ids.js'
import { casos, salidas } from './casos.js'

const TOPE_GZIP = 18000
const HOLGURA = 1.1
const raiz = new URL('../../', import.meta.url).pathname

// Nodos = etiquetas que abren. Manda la cantidad de nodos, no el peso del HTML:
// pasar el heatmap a un trazo por nivel bajó de 207 nodos a 40 y de 0.6 a 0.13 ms.
const nodos = html => (html.match(/<[a-zA-Z]/g) || []).length

const gzip = async (entrada, extra = {}) => {
  const r = await Bun.build({ entrypoints: [raiz + entrada], minify: true, ...extra })

  if (!r.success) throw new AggregateError(r.logs, 'no compiló ' + entrada)

  return Bun.gzipSync(new Uint8Array(await r.outputs[0].arrayBuffer()), { level: 9 }).length
}

test('peso: IIFE completo más charts.css, minificados y con gzip, no pasan de 18 000 bytes', async () => {
  const js = await gzip('src/global.js', { format: 'iife' })
  const css = await gzip('src/charts.css')

  console.log('peso gzip: JS ' + js + ' + CSS ' + css + ' = ' + (js + css) + ' de ' + TOPE_GZIP)
  expect(js + css).toBeLessThanOrEqual(TOPE_GZIP)
})

const obtenidas = []

beforeAll(() => {
  resetIds()
  for (const c of casos) obtenidas.push(SC[c.fn](...structuredClone(c.args)))
})

casos.forEach((c, i) => {
  test('bytes y nodos dentro de lo registrado + 10%: ' + c.id, () => {
    const html = obtenidas[i]
    const ref = salidas[i].html

    expect(Buffer.byteLength(html)).toBeLessThanOrEqual(Math.ceil(Buffer.byteLength(ref) * HOLGURA))
    expect(nodos(html)).toBeLessThanOrEqual(Math.ceil(nodos(ref) * HOLGURA))
  })
})
