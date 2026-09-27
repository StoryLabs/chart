// Datos que faltan ADENTRO de una lista: a cada lista de valores de cada caso canónico se le
// meten un null, un undefined y un texto en el medio, y la última lista se acorta. Exigencia: no
// lanza y no escribe NaN ni Infinity. Un dato que falta no es un cero.
import { test, expect } from 'bun:test'
import * as SC from '../../src/index.js'
import { casos } from './casos.js'

// Las listas de valores, por gráfico: rutas desde las opciones.
const LISTAS = {
  bullet: () => [['value']],
  rings: o => (o.rings || []).map((_, i) => ['rings', i, 'value']),
  segmented: o => (o.segments || []).map((_, i) => ['segments', i, 'value']),
  line: () => [['values']],
  stackedLine: o => (o.series || []).map((_, i) => ['series', i, 'values']),
  columns: o => (o.data || []).map((_, i) => ['data', i, 'value']),
  stacked: o => (o.data || []).map((_, i) => ['data', i, 'values']),
  pie: o => (o.slices || []).map((_, i) => ['slices', i, 'value']),
  heatmap: o => (o.values || []).map((_, i) => ['values', i]),
  diverging: o => (o.rows || []).map((_, i) => ['rows', i, 'value']),
  range: o => (o.rows || []).flatMap((_, i) => [['rows', i, 'from'], ['rows', i, 'to']])
}
const HUECOS = [null, undefined, 'x']

const leer = (o, ruta) => ruta.reduce((a, k) => (a == null ? a : a[k]), o)
const poner = (o, ruta, v) => { const p = leer(o, ruta.slice(0, -1)); p[ruta.at(-1)] = v }

/** Variantes de las opciones con un hueco metido: cada lista con cada hueco, y la última acortada. */
const variantes = (fn, o) => {
  const rutas = LISTAS[fn](o)
  const r = []

  for (const ruta of rutas) {
    const v = leer(o, ruta)

    for (const h of HUECOS) {
      const copia = structuredClone(o)

      if (Array.isArray(v)) {
        const lista = leer(copia, ruta)

        lista[Math.floor(lista.length / 2)] = h
      } else if (v && typeof v === 'object') {
        const k = Object.keys(v)[0]

        leer(copia, ruta)[k] = h
      } else {
        poner(copia, ruta, h)
      }
      r.push([ruta.join('.') + ' = ' + String(h), copia])
    }
    if (Array.isArray(v) && v.length > 1) {
      const copia = structuredClone(o)

      poner(copia, ruta, v.slice(0, -1))
      r.push([ruta.join('.') + ' acortada', copia])
    }
  }
  // Una fila sin su objeto de valores.
  if (fn === 'stacked' && o.data?.length) {
    const copia = structuredClone(o)

    delete copia.data[0].values
    r.push(['data.0 sin values', copia])
  }

  return r
}

// Lo que hoy falla con un hueco. Vacío: todo gráfico lo trata como dato que falta.
const PENDIENTES = []

const fallas = () => {
  const vistas = new Set()

  for (const c of casos) {
    if (!LISTAS[c.fn]) continue
    for (const [nombre, o] of variantes(c.fn, c.args[0])) {
      // La forma del hueco, sin índices: una por gráfico y tipo de lista.
      const forma = c.fn + ' ' + nombre.replace(/\.\d+(?=\.|\s|$)/g, '[]')
      let html

      try {
        html = SC[c.fn](o, ...c.args.slice(1))
      } catch (e) {
        vistas.add(forma + ': lanza ' + e.constructor.name)
        continue
      }
      const malo = html.match(/NaN|Infinity/)

      if (malo) vistas.add(forma + ': escribe ' + malo[0])
    }
  }

  return [...vistas].sort()
}

test('un dato que falta adentro de una lista no hace lanzar ni escribe NaN, salvo los pendientes', () => {
  const f = fallas()

  if (f.length) console.log(f.join('\n'))
  expect(f).toEqual(PENDIENTES)
})

// Un dato que falta no es un cero: qué hace cada gráfico con el hueco.
import { valor } from '../../src/core/format.js'
import { tooltips, datos } from './ayuda.js'

test('valor(): número o null; un texto numérico vale su número', () => {
  expect([3, '3', 0, -2.5, '  7 '].map(valor)).toEqual([3, 3, 0, -2.5, 7])
  expect([null, undefined, NaN, 'x', '', true, Infinity, {}].map(valor)).toEqual([null, null, null, null, null, null, null, null])
})

const trazos = html => [...html.matchAll(/class="sc-a-draw"[^>]* d="([^"]*)"/g)].map(m => m[1])

test('line: un hueco corta la línea en dos, y no baja a cero', () => {
  const html = SC.line({ values: [5, 6, null, 7, 8], max: 10 })

  expect(trazos(html).length).toBe(2)
  // y(0) = 204: ningún vértice de la línea cae en la base.
  expect(trazos(html).join(' ')).not.toMatch(/ 204(?: |$)/)
  expect(datos(html, 'data-sc-line').v).toEqual([5, 6, null, 7, 8])
})

test('line: un punto aislado entre dos huecos se dibuja como punto', () => {
  const html = SC.line({ values: [5, null, 6, null, 7, 8], max: 10 })

  expect(html).toMatch(/<circle class="sc-a-in" cx="[\d.]+" cy="[\d.]+" r="2.5"/)
})

test('line: con más puntos que cupo, el hueco sobrevive al submuestreo', () => {
  const values = Array.from({ length: 5000 }, (_, i) => 50 + (i % 7))

  values[2500] = null
  expect(datos(SC.line({ values, max: 100 }), 'data-sc-line').v).toContain(null)
})

test('stackedLine: si falta el dato de una serie, se cortan todas en esa posición', () => {
  const html = SC.stackedLine({ max: 20, series: [{ key: 'a', label: 'A', hue: 'blue', values: [1, 2, 3, 4, 5] }, { key: 'b', label: 'B', hue: 'sky', values: [1, 2, null, 4, 5] }] })
  const d = datos(html, 'data-sc-area')

  expect(d.s.map(se => se.v[2])).toEqual([null, null])
  expect(trazos(html).length).toBe(4)
})

test('stackedLine: una serie más corta tiene huecos al final', () => {
  const d = datos(SC.stackedLine({ max: 20, series: [{ key: 'a', label: 'A', hue: 'blue', values: [1, 2, 3, 4] }, { key: 'b', label: 'B', hue: 'sky', values: [1, 2] }] }), 'data-sc-area')

  expect(d.s[0].v).toEqual([1, 2, null, null])
})

test("columns con gaps: 'empty': la columna sin dato no se dibuja y su tooltip dice Sin datos", () => {
  const html = SC.columns({ max: 4, gaps: 'empty', data: [{ label: 'a', value: 2 }, { label: 'b', value: null }] })
  const [, b] = html.split('data-sc-s="c').slice(1)

  expect(b).not.toContain('<path')
  expect(tooltips(html)[1].v).toBe('Sin datos')
})

test('stacked: una fila sin values es una fila sin datos, sin lanzar', () => {
  const html = SC.stacked({ max: 4, series: [{ key: 'a', label: 'A', hue: 'blue' }], data: [{ label: 'd1', values: { a: 2 } }, { label: 'd2' }] })

  expect(html.split('sc-xlab')[1]).toBeDefined()
  expect((html.match(/<div data-sc-s="a"/g) || []).length).toBe(1)
})

test('pie y segmented: la porción sin valor no entra al reparto y figura con —', () => {
  const pie = SC.pie({ slices: [{ key: 'a', label: 'A', value: 3, hue: 'blue' }, { key: 'b', label: 'B', value: undefined, hue: 'sky' }, { key: 'c', label: 'C', value: '1', hue: 'violet' }] })
  const seg = SC.segmented({ segments: [{ key: 'a', label: 'A', value: 3, hue: 'blue' }, { key: 'b', label: 'B', value: 'x', hue: 'sky' }, { key: 'c', label: 'C', value: 1, hue: 'violet' }] })

  expect([...pie.matchAll(/<b>([^<]*)<\/b><\/button>/g)].map(m => m[1])).toEqual(['75%', '—', '25%'])
  expect([...seg.matchAll(/<b>([^<]*)<\/b><\/button>/g)].map(m => m[1])).toEqual(['75%', '—', '25%'])
  expect(seg).not.toContain('data-sc-s="b" class')
})

test('bullet, rings y range: sin valor queda la escala, sin barra, con — y tooltip Sin datos', () => {
  const b = SC.bullet({ label: 'b', value: null, max: 10, reference: [2, 4] })
  const r = SC.rings({ rings: [{ key: 'a', label: 'A', value: undefined, hue: 'blue' }] })
  const g = SC.range({ max: 10, rows: [{ label: 'r', from: 2, to: null }] })

  expect(b).not.toContain('sc-val')
  expect(b).toContain('<b>—</b>')
  expect(b).not.toContain('fuera de rango')
  expect(r).not.toContain('sc-a-draw')
  expect(r).toContain('<b>—</b>')
  expect(g).not.toContain('sc-ref')
  for (const h of [b, r, g]) expect(tooltips(h)[0].v).toBe('Sin datos')
})

test('heatmap: un texto numérico es un valor; una fila que falta, sin datos', () => {
  const d = datos(SC.heatmap({ rows: ['a', 'b'], values: [['2', 1], null] }), 'data-sc-heat')

  expect(d.v).toEqual([[2, 1], ['0', '0']])
})
