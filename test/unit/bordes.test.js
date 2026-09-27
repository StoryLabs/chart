// Datos de borde, por hueco: el mismo juego para cada gráfico (vacío, un elemento, todo en cero,
// negativos, max en cero y un valor enorme) y una sola exigencia: no lanza, y la salida no trae
// NaN ni Infinity. Lo que hoy falla queda anotado como pendiente: el test se pone rojo si aparece
// otro, o si uno anotado se arregla (y entonces se saca de la lista).
import { test, expect } from 'bun:test'
import * as SC from '../../src/index.js'
import { resetIds } from '../../src/core/ids.js'

const ENORME = 1e12
const BORDES = {
  vacio: { n: 0, v: () => 0 },
  uno: { n: 1, v: () => 5 },
  ceros: { n: 4, v: () => 0 },
  negativos: { n: 4, v: i => -3 - i },
  max0: { n: 4, v: i => i, max: 0 },
  enorme: { n: 4, v: i => (i === 2 ? ENORME : i) }
}
const lista = (b, f) => Array.from({ length: b.n }, (_, i) => f(i))
const maxDe = b => ('max' in b ? b.max : 10)

const GRAFICOS = {
  bullet: b => SC.bullet({ label: 'b', value: b.n ? b.v(b.n - 1) : 0, max: maxDe(b), reference: [0, 2] }),
  rings: b => SC.rings({ rings: lista(b, i => ({ key: 'r' + i, label: 'r', value: b.v(i), max: 'max' in b ? b.max : undefined, hue: 'blue' })) }),
  segmented: b => SC.segmented({ segments: lista(b, i => ({ key: 's' + i, label: 's', value: b.v(i), hue: 'blue' })) }),
  ribbon: b => SC.ribbon({ rest: 'w', states: { w: { label: 'W', hue: 'blue', lane: 0 } }, domain: [0, 'max' in b ? b.max : 24], segments: lista(b, i => [i, i + 1, 'w']) }),
  line: b => SC.line({ values: lista(b, b.v), max: maxDe(b), buffer: true, band: [0, 1], threshold: { value: 1 } }),
  stackedLine: b => SC.stackedLine({ max: maxDe(b), buffer: true, series: [{ key: 'a', label: 'A', hue: 'blue', values: lista(b, b.v) }, { key: 'b', label: 'B', hue: 'sky', values: lista(b, b.v) }] }),
  columns: b => SC.columns({ max: maxDe(b), unit: ['x', 'xs'], data: lista(b, i => ({ label: 'c' + i, value: b.v(i) })) }),
  stacked: b => SC.stacked({ max: maxDe(b), unit: ['x', 'xs'], series: [{ key: 'a', label: 'A', hue: 'blue' }], data: lista(b, i => ({ label: 'd' + i, values: { a: b.v(i) } })) }),
  pie: b => SC.pie({ unit: ['x', 'xs'], slices: lista(b, i => ({ key: 'p' + i, label: 'p', value: b.v(i), hue: 'blue' })) }),
  heatmap: b => SC.heatmap({ rows: lista(b, i => 'f' + i), values: lista(b, () => lista(b, b.v)), steps: 'max' in b ? b.max : 3 }),
  range: b => SC.range({ max: maxDe(b), rows: lista(b, i => ({ label: 'r', from: b.v(i), to: b.v(i) * 2 })) })
}

// Lo que hoy falla. Vacío: ningún gráfico lanza ni escribe NaN con estos bordes.
const PENDIENTES = []

const fallas = () => {
  const r = []

  for (const [fn, dibujar] of Object.entries(GRAFICOS)) {
    for (const [borde, b] of Object.entries(BORDES)) {
      try {
        const html = dibujar(b)
        const malo = html.match(/NaN|Infinity/)

        if (malo) r.push(fn + ' ' + borde + ': escribe ' + malo[0])
      } catch (e) {
        r.push(fn + ' ' + borde + ': lanza ' + e.constructor.name)
      }
    }
  }

  return r
}

test('ningún gráfico lanza ni escribe NaN o Infinity con datos de borde, salvo los pendientes anotados', () => {
  expect(fallas()).toEqual(PENDIENTES)
})

test('con la lista vacía, cada gráfico devuelve el estado vacío', () => {
  const noVacios = Object.entries(GRAFICOS).filter(([fn]) => fn !== 'bullet').filter(([, dibujar]) => dibujar(BORDES.vacio) !== SC.state({ kind: 'empty', title: 'Sin datos' })).map(([fn]) => fn)

  expect(noVacios).toEqual([])
})

const error = html => ({ fn: html.match(/data-sc-error="([^"]*)"/)?.[1], detalle: html.match(/<span>([^<]*)<\/span>/)?.[1], titulo: html.match(/<b>([^<]*)<\/b>/)?.[1] })

test('una estructura obligatoria que falta dibuja el error en el lugar del gráfico, sin lanzar', () => {
  const casos = {
    bullet: () => SC.bullet({ label: 'b', value: 1, max: 2 }),
    rings: () => SC.rings({}),
    segmented: () => SC.segmented({}),
    ribbon: () => SC.ribbon({ segments: [[0, 1, 'w']] }),
    line: () => SC.line({ max: 4 }),
    stackedLine: () => SC.stackedLine({ series: [{ key: 'a' }] }),
    columns: () => SC.columns({}),
    stacked: () => SC.stacked({ data: [] }),
    pie: () => SC.pie({}),
    heatmap: () => SC.heatmap({ rows: ['a'] }),
    range: () => SC.range()
  }

  for (const [fn, dibujar] of Object.entries(casos)) {
    const e = error(dibujar())

    expect(e.fn).toBe(fn)
    expect(e.titulo).toBe('No se pudo dibujar el gráfico')
    expect(e.detalle.startsWith(fn + ': ')).toBe(true)
  }
})

test('ribbon con un estado que no existe nombra el estado, escapado', () => {
  const html = SC.ribbon({ states: { w: { label: 'W', hue: 'blue', lane: 0 } }, segments: [[0, 1, 'w'], [1, 2, '<b>x']] })

  expect(error(html)).toEqual({ fn: 'ribbon', titulo: 'No se pudo dibujar el gráfico', detalle: 'ribbon: el estado &quot;&lt;b&gt;x&quot; no está en states' })
})

test('un punto solo es un punto: line y stackedLine con un valor dibujan su círculo y ninguna línea', () => {
  const l = SC.line({ values: [5], max: 10, buffer: true })

  expect(l).toContain('class="sc-glow"')
  expect(l).not.toContain('sc-a-draw')
  expect(SC.stackedLine({ max: 10, series: [{ key: 'a', label: 'A', hue: 'blue', values: [5] }] })).toContain('sc-glow')
})

test('max en cero o negativo vale 1', () => {
  resetIds()
  const negativo = SC.line({ values: [0, 1], max: -3 })

  resetIds()
  expect(negativo).toBe(SC.line({ values: [0, 1], max: 1 }))
})
