// El texto de line() y heatmap() queda en 11 px de pantalla aunque el lienzo se estire:
// se monta cada gráfico en 640 y en 1500 px y se compara el tamaño en pantalla del rótulo.
import { test, expect, beforeEach } from 'bun:test'
import * as SC from '../../src/index.js'
import { resetIds } from '../../src/core/ids.js'
import { scaleFor, compensatedSize, screenSize, applyFixedText, BASE_FONT } from '../../src/runtime/fixedText.js'

beforeEach(resetIds)

const anchoViewBox = html => Number(html.match(/viewBox="0 0 ([\d.]+)/)[1])

test('line y heatmap: el rótulo se ve a 11 px en 640 y en 1500, y la geometría sí se estira', async () => {
  const linea = SC.line({ values: [0, 50, 100], max: 100 })
  const calor = SC.heatmap({ rows: ['r0', 'r1'], values: [[0, 1, 2], [3, 2, 1]] })

  for (const html of [linea, calor]) {
    const vista = anchoViewBox(html)

    expect(html).toContain('<text')
    // El tamaño en pantalla sale de la misma cuenta que aplica el runtime en el navegador.
    for (const lienzo of [640, 1500]) expect(screenSize(vista, lienzo)).toBeCloseTo(BASE_FONT, 9)
    // La compensación que el runtime escribe en cada svg es el cociente viewBox/lienzo.
    for (const lienzo of [640, 1500]) {
      const fijado = {}

      applyFixedText({ viewBox: { baseVal: { width: vista } }, clientWidth: lienzo, style: { setProperty: (k, v) => { fijado[k] = v } } })
      expect(Number(fijado['--sc-fix'])).toBeCloseTo(scaleFor(vista, lienzo), 9)
      expect(compensatedSize(vista, lienzo) * lienzo / vista).toBeCloseTo(BASE_FONT, 9)
    }
  }

  // La geometría sí se estira: el svg ocupa el 100% del contenedor en ambos anchos.
  const css = await Bun.file(new URL('../../src/charts.css', import.meta.url).pathname).text()

  expect(css).toContain('width: 100%')
  expect(css).toMatch(/\.sc-line svg text[^{]*\{[^}]*var\(--sc-fix/)
  expect(css).toMatch(/\.sc-heatmap svg text[^{]*\{[^}]*var\(--sc-fix/)
  expect(linea).toContain('class="sc-chart sc-line"')
  expect(calor).toContain('class="sc-chart sc-heatmap"')
})
