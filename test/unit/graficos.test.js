// Tests por gráfico: escala, recortes, hidden, buffer, hatched, texto hostil y submuestreo.
import { describe, test, expect, beforeEach } from 'bun:test'
import * as SC from '../../src/index.js'
import { resetIds } from '../../src/core/ids.js'
import { redibujables } from '../../src/runtime/mount.js'
import { salidas } from './casos.js'
import { veces, atributos, datos, grupos, tooltips, HOSTIL } from './ayuda.js'

beforeEach(resetIds)

const suma = xs => xs.reduce((a, x) => a + x, 0)
const porcentajes = (lista, sufijo) => lista.filter(x => x.d.endsWith(sufijo)).map(x => parseFloat(x.d))

describe('texto hostil', () => {
  const casos = {
    bullet: () => SC.bullet({ label: HOSTIL, value: 1, unit: HOSTIL, max: 10, reference: [0, 2], side: HOSTIL, key: HOSTIL }),
    rings: () => SC.rings({ center: { value: HOSTIL, label: HOSTIL }, rings: [{ key: HOSTIL, label: HOSTIL, value: 5, hue: 'blue' }] }),
    segmented: () => SC.segmented({ segments: [{ key: HOSTIL, label: HOSTIL, value: 1, detail: HOSTIL, hue: 'blue' }] }),
    ribbon: () => SC.ribbon({ label: HOSTIL, states: { a: { label: HOSTIL, hue: 'blue', lane: 0 } }, rest: 'a', segments: [[0, 24, 'a']], ticks: [{ at: 0, label: HOSTIL, sub: HOSTIL }] }),
    line: () => SC.line({ label: HOSTIL, values: [1, 2, 3], labels: [HOSTIL, HOSTIL, HOSTIL], max: 5, unit: HOSTIL, xLabels: [HOSTIL, HOSTIL], threshold: { value: 2, label: HOSTIL }, headline: { parts: [[HOSTIL, HOSTIL]], chip: HOSTIL } }),
    stackedLine: () => SC.stackedLine({ series: [{ key: HOSTIL, label: HOSTIL, hue: 'blue', values: [1, 2] }], labels: [HOSTIL, HOSTIL], max: 5, unit: HOSTIL, totalLabel: HOSTIL }),
    columns: () => SC.columns({ label: HOSTIL, data: [{ label: HOSTIL, title: HOSTIL, value: 1 }], max: 2, unit: [HOSTIL, HOSTIL] }),
    stacked: () => SC.stacked({ series: [{ key: HOSTIL, label: HOSTIL, hue: 'blue' }], data: [{ label: HOSTIL, title: HOSTIL, values: { [HOSTIL]: 1 } }], max: 2, unit: [HOSTIL, HOSTIL] }),
    pie: () => SC.pie({ label: HOSTIL, center: { value: HOSTIL, label: HOSTIL }, variant: 'donut', unit: [HOSTIL, HOSTIL], slices: [{ key: HOSTIL, label: HOSTIL, value: 1, hue: 'blue' }] }),
    heatmap: () => SC.heatmap({ label: HOSTIL, rows: [HOSTIL], values: [[1, HOSTIL]], unit: [HOSTIL, HOSTIL], emptyLabel: HOSTIL }),
    range: () => SC.range({ rows: [{ label: HOSTIL, from: 1, to: 2 }], max: 4, unit: HOSTIL }),
    state: () => SC.state({ kind: 'error', title: HOSTIL, detail: HOSTIL }),
    legend: () => SC.legend([{ key: HOSTIL, label: HOSTIL, hue: 'blue' }])
  }

  for (const [nombre, dibujar] of Object.entries(casos)) {
    test(nombre + ' no deja pasar ni una etiqueta ni una comilla del texto', () => {
      const html = dibujar()

      expect(html).not.toContain('<img')
      expect(html).not.toContain('</div> ')
      expect(html).not.toContain('"comillas"')
      expect(html).not.toContain("'simples'")
      expect(html).toContain('&lt;img')
    })
  }
})

describe('bullet', () => {
  const b = o => SC.bullet({ label: 'x', max: 100, reference: [20, 60], ...o })
  const ancho = html => parseFloat(html.match(/sc-val sc-a-x" style="width:([\d.]+)%/)?.[1] ?? 'NaN')

  test('escala: el valor ocupa su fracción de max', () => {
    expect(ancho(b({ value: 25 }))).toBe(25)
  })

  test('recorte: sobre max llena el 100%, y en cero o menos no dibuja la barra', () => {
    expect(ancho(b({ value: 900 }))).toBe(100)
    expect(b({ value: 0 })).not.toContain('sc-val')
    expect(b({ value: -5 })).not.toContain('sc-val')
  })

  test('la banda rayada de referencia va de a a b, recortada a la escala', () => {
    expect(b({ value: 30 })).toContain('class="sc-ref" style="left:20%;width:40%"')
    expect(b({ value: 30, reference: [50, 400] })).toContain('class="sc-ref" style="left:50%;width:50%"')
  })

  test('fuera de la referencia agrega el chip, dentro no', () => {
    expect(b({ value: 70 })).toContain('<span class="sc-chip">fuera de rango</span>')
    expect(b({ value: 30 })).not.toContain('sc-chip')
  })
})

describe('rings', () => {
  const arco = html => html.match(/d="M 130 24 A 106 106 0 (\d) 1 ([\d.]+) ([\d.]+)"/)

  test('escala: un cuarto de vuelta termina a la derecha del centro', () => {
    const m = arco(SC.rings({ rings: [{ key: 'a', label: 'a', value: 25, hue: 'blue' }] }))

    expect([m[1], m[2], m[3]]).toEqual(['0', '236', '130'])
  })

  test('recorte: sobre max se queda en la vuelta completa, y el máximo propio del anillo cuenta', () => {
    const lleno = arco(SC.rings({ rings: [{ key: 'a', label: 'a', value: 100, hue: 'blue' }] }))

    expect(arco(SC.rings({ rings: [{ key: 'a', label: 'a', value: 500, hue: 'blue' }] }))[0]).toBe(lleno[0])
    expect(arco(SC.rings({ rings: [{ key: 'a', label: 'a', value: 30, max: 60, hue: 'blue' }] }))[1]).toBe('0')
    expect(lleno[1]).toBe('1')
  })

  test('el fondo de la escala completa va rayado en vertical (máscara v)', () => {
    expect(SC.rings({ rings: [{ key: 'a', label: 'a', value: 5, hue: 'blue' }] })).toContain('mask="url(#scmkv1)" class="sc-hatch"')
  })
})

describe('segmented', () => {
  test('cada tramo mide su porcentaje del total, y el hatched lleva sc-hx', () => {
    const html = SC.segmented({ segments: [{ key: 'a', label: 'A', value: 3, hue: 'blue' }, { key: 'b', label: 'B', value: 1, hue: 'neutral', hatched: true }] })

    expect(html).toMatch(/data-sc-s="a" class="sc-a-x"[^>]*flex:3 0 0/)
    expect(html).toMatch(/data-sc-s="b" class="sc-a-x sc-hx"[^>]*flex:1 0 0/)
    expect(tooltips(html).map(t => t.v)).toEqual(['75%', '25%'])
  })
})

describe('ribbon', () => {
  const ESTADOS = { w: { label: 'W', hue: 'blue', lane: 0 }, c: { label: 'C', hue: 'sky', lane: 1 }, n: { label: 'N', hue: 'neutral', lane: 0, hatched: true } }

  test('los tramos medidos seguidos son UNA sola forma, pintada una vez por estado', () => {
    const html = SC.ribbon({ states: ESTADOS, rest: 'w', segments: [[0, 6, 'w'], [6, 12, 'c'], [12, 24, 'w']] })
    const formas = atributos(html, 'd').filter(d => d.startsWith('M'))

    expect(formas.length).toBe(2)
    expect(new Set(formas).size).toBe(1)
  })

  test('un tramo hatched corta la cinta y se dibuja aparte, rayado', () => {
    const html = SC.ribbon({ states: ESTADOS, rest: 'w', segments: [[0, 6, 'w'], [6, 12, 'n'], [12, 24, 'w']] })
    const formas = atributos(html, 'd').filter(d => d.startsWith('M'))

    expect(new Set(formas).size).toBe(2)
    expect(grupos(html, 'n').some(g => g.includes('class="sc-hatch"'))).toBe(true)
  })

  test('escala del dominio: el tooltip dice la duración y las horas', () => {
    const html = SC.ribbon({ states: ESTADOS, rest: 'w', segments: [[0, 1.5, 'w'], [1.5, 24, 'c']] })

    expect(tooltips(html)[0]).toEqual({ t: 'W', v: '1 h 30 min', d: '00:00 a 01:30' })
  })
})

describe('line', () => {
  const base = o => SC.line({ values: [0, 50, 100], max: 100, ...o })

  test('escala: 0 cae en la base del plot y max en el techo', () => {
    const d = datos(base(), 'data-sc-line')

    expect(base()).toContain('<circle class="sc-glow" cx="624" cy="14"')
    expect(d.v).toEqual([0, 50, 100])
    expect(d.T + d.H).toBe(204)
  })

  test('umbral: el tramo por encima cambia a alertHue', () => {
    const html = base({ values: [10, 20, 90, 95], threshold: { value: 80 }, alertHue: 'orange' })

    expect(html).toContain('stroke:var(--sc-orange);--i:5')
    expect(html).toContain('stroke:var(--sc-blue);--i:0')
  })

  test('buffer: el último tramo va punteado y rayado; sin buffer, no', () => {
    const con = grupos(base({ buffer: true }), 'buffer')[0]
    const sin = grupos(base(), 'buffer')[0]

    expect(con).toContain('stroke-dasharray="3 4"')
    expect(con).toContain('class="sc-hatch"')
    expect(sin).not.toContain('stroke-dasharray')
    expect(sin).not.toContain('sc-hatch')
  })

  test('la banda de referencia va rayada', () => {
    expect(grupos(base({ band: [20, 40] }), 'band')[0]).toContain('class="sc-hatch"')
  })

  test('submuestreo: 10 000 puntos quedan en el cupo, con el pico y su posición original', () => {
    const values = Array.from({ length: 10000 }, (_, i) => 50 + Math.sin(i) * 5)

    values[6543] = 99
    const d = datos(SC.line({ values, max: 100 }), 'data-sc-line')

    expect(d.v.length).toBeLessThanOrEqual(602)
    expect(d.n0).toBe(10000)
    expect(d.p[d.v.indexOf(99)]).toBe(6543)
  })

  test('maxPoints manda sobre el cupo por defecto', () => {
    const values = Array.from({ length: 1000 }, (_, i) => i % 100)

    expect(datos(SC.line({ values, max: 100, maxPoints: 5000 }), 'data-sc-line').p).toBeNull()
  })
})

describe('stackedLine', () => {
  const o = { max: 100, series: [{ key: 'a', label: 'A', hue: 'blue', values: [10, 20, 30] }, { key: 'b', label: 'B', hue: 'violet', values: [5, 5, 5] }] }

  test('apila: la segunda serie va encima de la suma de las anteriores', () => {
    // y(35) = 14 + (1 - 35 / 100) * 190 = 137.5: el techo de la segunda serie en el último punto.
    const techoB = SC.stackedLine(o).match(/<path[^>]*d="(M [^"]*)"[^>]*stroke:var\(--sc-violet\)/)[1]

    expect(techoB.endsWith('624 137.5')).toBe(true)
  })

  test('hidden: la serie apagada no se dibuja y las opciones viajan para redibujar', () => {
    const html = SC.stackedLine({ ...o, hidden: ['a'] })

    expect(html).not.toMatch(/<g[^>]*data-sc-s="a"/)
    expect(html).toContain('data-sc-chart="stackedLine"')
    expect(html).toMatch(/data-sc-leg="a" aria-pressed="false"/)
  })

  test('buffer: el último tramo va punteado', () => {
    expect(SC.stackedLine({ ...o, buffer: true })).toContain('stroke-dasharray="3 4"')
    expect(SC.stackedLine(o)).not.toContain('stroke-dasharray="3 4"')
  })

  test('submuestreo: todas las series se recortan en los MISMOS índices', () => {
    const n = 2000
    const series = [{ key: 'a', label: 'A', hue: 'blue', values: Array.from({ length: n }, (_, i) => i % 7) }, { key: 'b', label: 'B', hue: 'violet', values: Array.from({ length: n }, (_, i) => (i * 3) % 11) }]
    const opts = datos(SC.stackedLine({ max: 30, series }), 'data-sc-opts')

    expect(opts.series[0].values.length).toBeLessThanOrEqual(602)
    expect(opts.series[0].values.length).toBe(opts.series[1].values.length)
    expect(opts.total).toBe(n)
    opts.puntos.forEach((p, j) => expect(opts.series[1].values[j]).toBe((p * 3) % 11))
  })
})

describe('columns', () => {
  const data = [{ label: 'a', value: 2 }, { label: 'b', value: 1, projected: 3 }]
  const col = (variant, extra) => SC.columns({ data, max: 4, variant, ...extra })

  for (const variant of ['solid', 'stripped', 'gradient', 'duotone', 'hatched']) {
    test(variant + ': la columna en curso va rayada siempre', () => {
      const [, enCurso] = col(variant).split('data-sc-s="c').slice(1)

      expect(enCurso).toContain('class="sc-hatch"')
    })
  }

  test('una columna medida sólo va rayada en la variante hatched', () => {
    for (const v of ['solid', 'stripped', 'gradient', 'duotone']) expect(col(v).split('data-sc-s="c')[1]).not.toContain('sc-hatch')
    expect(col('hatched').split('data-sc-s="c')[1]).toContain('sc-hatch')
  })

  test('escala: la columna de 2 sobre 4 llega a la mitad del plot', () => {
    expect(col('solid')).toMatch(/<path d="M [\d.]+ 182 V 103 Q [\d.]+ 97/)
  })

  test('tooltip: cuenta con la unidad, y la en curso dice la proyección', () => {
    const t = tooltips(col('solid', { unit: ['ping', 'pings'] }))

    expect(t[0]).toEqual({ t: 'a', v: '2 pings', d: 'Completo' })
    expect(t[1]).toEqual({ t: 'b', v: '1 ping', d: 'En curso. Proyección al cierre: 3' })
  })

  test('sin variante, el default de hoy es solid', () => {
    resetIds()
    const sin = col(undefined)

    resetIds()
    expect(sin).toBe(col('solid'))
  })
})

test('columns: un valor en cero no dibuja cuerpo ni tapa en ninguna variante, y su tooltip dice 0', () => {
  for (const variant of ['solid', 'stripped', 'gradient', 'duotone', 'hatched']) {
    const html = SC.columns({ variant, max: 4, unit: ['ping', 'pings'], data: [{ label: 'a', value: 0 }] })
    const g = html.split('data-sc-s="c0"')[1].split('</g>')[0]

    expect(g).not.toContain('<path')
    expect(g).not.toContain('sc-hatch')
    expect(g).toContain('fill="transparent"')
    expect(tooltips(html)[0].v).toBe('0 pings')
  }
})

describe('stacked', () => {
  const o = {
    max: 10, unit: ['ping', 'pings'],
    series: [{ key: 'w', label: 'W', hue: 'blue' }, { key: 'c', label: 'C', hue: 'sky' }, { key: 'n', label: 'N', hue: 'neutral', hatched: true }],
    data: [{ label: 'd1', values: { w: 6, c: 3, n: 1 } }, { label: 'd2', values: { w: 2, c: 0, n: 0 } }]
  }

  test('los porcentajes de un día suman 100', () => {
    expect(suma(porcentajes(tooltips(SC.stacked(o)).slice(0, 3), '% del día'))).toBe(100)
  })

  test('hidden: la serie apagada no se dibuja y el resto se reparte el 100%', () => {
    const html = SC.stacked({ ...o, hidden: ['w'] })

    expect(html).not.toMatch(/<div data-sc-s="w"/)
    expect(porcentajes(tooltips(html), '% del día').slice(0, 2)).toEqual([75, 25])
    expect(html).toMatch(/data-sc-leg="w" aria-pressed="false"/)
  })

  test('un valor en cero no dibuja tramo', () => {
    expect(veces(SC.stacked(o), '<div data-sc-s="c"')).toBe(1)
  })

  test('variante line: lo hatched lleva la línea punteada y sin relleno de gradiente', () => {
    const tramo = SC.stacked(o).match(/<div data-sc-s="n"[^>]*>/)[0]

    expect(tramo).toContain('dashed')
    expect(tramo).not.toContain('linear-gradient')
  })

  test('escala: 6 de 10 sobre 190 px de alto mide 114 px', () => {
    expect(SC.stacked(o)).toMatch(/<div data-sc-s="w"[^>]*height:114px/)
  })
})

test('stacked: blend ya no existe; se dibuja como el default', () => {
  const o = { max: 4, series: [{ key: 'a', label: 'A', hue: 'blue' }, { key: 'b', label: 'B', hue: 'sky' }], data: [{ label: 'd', values: { a: 1, b: 2 } }] }

  expect(SC.stacked({ ...o, variant: 'blend' }).replace(',&quot;variant&quot;:&quot;blend&quot;', '')).toBe(SC.stacked(o))
})

describe('pie', () => {
  const o = { unit: ['ping', 'pings'], slices: [{ key: 'a', label: 'A', value: 3, hue: 'blue' }, { key: 'b', label: 'B', value: 1, hue: 'sky' }, { key: 'n', label: 'N', value: 4, hue: 'neutral', hatched: true }] }
  const filas = html => [...html.matchAll(/data-sc-leg="(\w+)" aria-pressed="(\w+)".*?<b>([^<]*)<\/b>/g)].map(m => [m[1], m[2], m[3]])

  test('porcentajes del total', () => {
    expect(filas(SC.pie(o))).toEqual([['a', 'true', '37.5%'], ['b', 'true', '12.5%'], ['n', 'true', '50%']])
  })

  test('hidden: la apagada muestra —, y las vivas se reparten el total', () => {
    expect(filas(SC.pie({ ...o, hidden: ['n'] }))).toEqual([['a', 'true', '75%'], ['b', 'true', '25%'], ['n', 'false', '—']])
  })

  test('todo apagado: un anillo neutro y ninguna porción', () => {
    const html = SC.pie({ ...o, hidden: ['a', 'b', 'n'] })

    expect(html).toContain('stroke:color-mix(in srgb, var(--sc-neutral) var(--sc-track), transparent)')
    expect(html).not.toMatch(/<g data-sc-s=/)
  })

  test('la porción hatched va rayada y con borde punteado; las medidas no', () => {
    const html = SC.pie(o)

    expect(grupos(html, 'n').join('')).toContain('class="sc-hatch"')
    expect(grupos(html, 'n').join('')).toContain('stroke-dasharray="3 4"')
    expect(grupos(html, 'a').join('')).not.toContain('sc-hatch')
    expect(grupos(html, 'a').join('')).not.toContain('stroke-dasharray')
  })
})

describe('heatmap', () => {
  const o = { rows: ['r0', 'r1'], values: [[0, 1, 2, 9], ['pausa', 3, 'otra', 'pausa']], steps: 3 }

  test('un solo trazo por nivel, más dos para las vacías', () => {
    expect(veces(SC.heatmap(o), 'stroke-linejoin="round"')).toBe(4 + 2)
  })

  test('recorte: un valor sobre steps cae en el último nivel', () => {
    const d = datos(SC.heatmap(o), 'data-sc-heat')

    expect(d.v[0][3]).toBe(9)
    expect(veces(SC.heatmap({ ...o, values: [[3, 9]], rows: ['r'] }), 'stroke-linejoin')).toBe(1)
  })

  test('una celda texto es «sin datos» y el texto viaja como motivo', () => {
    const d = datos(SC.heatmap(o), 'data-sc-heat')

    expect(d.w).toEqual(['pausa', 'otra'])
    // Sin datos viaja como TEXTO con el índice del motivo; un número es siempre un valor medido.
    expect(d.v[1]).toEqual(['0', 3, '1', '0'])
    expect(SC.heatmap(o)).toContain('class="sc-hatch"')
    expect(SC.heatmap({ ...o, values: [[0, 1, 2, 3], [0, 0, 0, 0]] })).not.toContain('class="sc-hatch"')
  })
})

test('heatmap: un negativo medido viaja con su valor real y se dibuja como cero', () => {
  const d = datos(SC.heatmap({ rows: ['r'], values: [[-3, 0, 'pausa']] }), 'data-sc-heat')

  expect(d.v[0]).toEqual([-3, 0, '0'])
  expect(d.w).toEqual(['pausa'])
})

describe('range', () => {
  test('escala y recorte a [0, max]', () => {
    const html = SC.range({ rows: [{ label: 'a', from: 100, to: 300 }, { label: 'b', from: -50, to: 900 }], max: 400 })

    expect(html).toContain('left:25%;width:50%')
    expect(html).toContain('left:0%;width:100%')
  })
})

describe('state y legend', () => {
  test('state: error lleva sc-error y sin detalle no hay span', () => {
    expect(SC.state({ kind: 'error', title: 't' })).toBe('<div class="sc-chart sc-state sc-error"><i class="sc-hfill"></i><b>t</b></div>')
  })

  test('legend: sólo los ítems con clave son botones, y off sale no presionado', () => {
    const html = SC.legend([{ key: 'a', label: 'A', hue: 'blue', off: true }, { label: 'B', hue: 'sky' }])

    expect(veces(html, '<button')).toBe(1)
    expect(html).toContain('aria-pressed="false"')
    expect(veces(SC.legend([{ key: 'a', label: 'A', hue: 'blue' }], false), '<button')).toBe(0)
  })
})

test('guarda: todo data-sc-chart de las salidas canónicas es redibujable por la entrada principal', () => {
  const nombres = new Set(salidas.flatMap(s => atributos(s.html, 'data-sc-chart')))

  expect([...nombres].sort()).toEqual(['pie', 'stacked', 'stackedLine'])
  for (const n of nombres) expect(typeof redibujables[n]).toBe('function')
})
