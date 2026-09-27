// Tests del runtime (mount, render, play, setHatch) en Chrome real: hover, tooltip y cursor dependen del layout.
import { test, expect } from '@playwright/test'

const tip = async page => {
  const t = page.locator('.sc-tip')

  await expect(t).toBeVisible()

  return { t: await t.locator('.sc-tip-t span').textContent(), v: await t.locator('b').textContent(), d: await t.locator('small').textContent() }
}

/** Lleva el puntero a una fracción del ancho (y del alto) de un elemento. */
const apuntar = async (page, loc, fx, fy = 0.5) => {
  await loc.scrollIntoViewIfNeeded()
  const c = await loc.boundingBox()

  await page.mouse.move(c.x + c.width * fx, c.y + c.height * fy)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('body[data-listo="1"]')).toBeAttached()
})

test.describe('redibujar desde la leyenda', () => {
  test('pie: apagar warm reparte el total entre las otras tres y prenderla lo devuelve', async ({ page }) => {
    const pie = () => page.locator('#c-pie-pie-line .sc-pie')
    const pcts = async () => pie().locator('.sc-row b').allTextContents()

    expect(await pcts()).toEqual(['70.8%', '8.3%', '2.1%', '18.8%'])
    await pie().locator('[data-sc-leg="warm"]').click()
    expect(await pcts()).toEqual(['—', '28.6%', '7.1%', '64.3%'])
    await expect(pie().locator('[data-sc-leg="warm"]')).toHaveAttribute('aria-pressed', 'false')
    await expect(pie().locator('svg g[data-sc-s]:not([fill])')).toHaveCount(3)
    await pie().locator('[data-sc-leg="warm"]').click()
    expect(await pcts()).toEqual(['70.8%', '8.3%', '2.1%', '18.8%'])
    await expect(pie().locator('svg g[data-sc-s]:not([fill])')).toHaveCount(4)
  })

  test('stacked: apagar warm deja cero tramos warm en el DOM, porque se redibujó', async ({ page }) => {
    const st = () => page.locator('#c-stacked-line .sc-stacked')

    await expect(st().locator('.sc-stack [data-sc-s="warm"]')).toHaveCount(7)
    await st().locator('[data-sc-leg="warm"]').click()
    await expect(st().locator('.sc-stack [data-sc-s="warm"]')).toHaveCount(0)
    await expect(st().locator('[data-sc-leg="warm"]')).toHaveAttribute('aria-pressed', 'false')
    await st().locator('[data-sc-leg="warm"]').click()
    await expect(st().locator('.sc-stack [data-sc-s="warm"]')).toHaveCount(7)
  })

  test('stackedLine: apagar shared deja un grupo de serie; prenderla devuelve los dos', async ({ page }) => {
    const sl = () => page.locator('#c-stackedLine-demo .sc-stackedline')
    const grupos = () => sl().locator('svg g[data-sc-s]')

    await expect(grupos()).toHaveCount(2)
    await sl().locator('[data-sc-leg="shared"]').click()
    await expect(grupos()).toHaveCount(1)
    await expect(sl().locator('[data-sc-leg="shared"]')).toHaveAttribute('aria-pressed', 'false')
    await sl().locator('[data-sc-leg="shared"]').click()
    await expect(grupos()).toHaveCount(2)
  })

  test('el gráfico redibujado conserva el rayado vigente (setHatch se reaplica)', async ({ page }) => {
    await page.evaluate(() => window.SC.setHatch({ density: 'gruesa' }))
    await page.locator('#c-pie-pie-line [data-sc-leg="warm"]').click()
    await expect(page.locator('#c-pie-pie-line pattern[data-sc-g]').first()).toHaveAttribute('width', '10')
  })
})

test.describe('leyenda que esconde', () => {
  test('rings: latency se esconde con sc-off y otro click la devuelve', async ({ page }) => {
    const b = page.locator('#c-rings-demo [data-sc-leg="latency"]')
    const anillo = page.locator('#c-rings-demo svg g[data-sc-s="latency"]')

    await b.click()
    await expect(b).toHaveAttribute('aria-pressed', 'false')
    await expect(anillo).toHaveCSS('display', 'none')
    await b.click()
    await expect(b).toHaveAttribute('aria-pressed', 'true')
    await expect(anillo).not.toHaveCSS('display', 'none')
  })

  test('segmented: apagar warm ensancha cold', async ({ page }) => {
    const cold = page.locator('#c-segmented-demo .sc-comp [data-sc-s="cold"]')
    const antes = (await cold.boundingBox()).width

    await page.locator('#c-segmented-demo [data-sc-leg="warm"]').click()
    await expect.poll(async () => (await cold.boundingBox()).width).toBeGreaterThan(antes * 2)
  })
})

test.describe('hover y tooltip', () => {
  test('bullet: tooltip del segundo y el grupo entero se atenúa menos él', async ({ page }) => {
    await page.locator('#c-bullet-demo-1 .sc-bullet').hover()
    expect(await tip(page)).toEqual({ t: 'Cold rate 24h', v: '11.7%', d: 'Referencia: 0 a 2% · fuera de rango' })
    await expect(page.locator('#c-bullets')).toHaveClass(/sc-dim/)
    await expect(page.locator('#c-bullets .sc-on')).toHaveCount(1)
  })

  test('ribbon: el primer tramo cold resalta todos los cold', async ({ page }) => {
    await page.locator('#c-ribbon-demo rect[data-sc-s="cold"]').first().hover()
    expect(await tip(page)).toEqual({ t: 'Cold start', v: '42 min', d: '02:12 a 02:54' })
    const on = page.locator('#c-ribbon-demo .sc-on')

    await expect(on).toHaveCount(6)
    expect(new Set(await on.evaluateAll(es => es.map(e => e.getAttribute('data-sc-s'))))).toEqual(new Set(['cold']))
  })

  test('columns: la columna del 22', async ({ page }) => {
    await page.locator('#c-columns-stripped [data-sc-t="22 de septiembre"] rect[fill="transparent"]').hover()
    expect(await tip(page)).toEqual({ t: '22 de septiembre', v: '6 cold starts', d: 'Completo' })
  })

  test('stacked: cold de mar 22', async ({ page }) => {
    await page.locator('#c-stacked-line [data-sc-t="mar 22 · Cold start"]').hover()
    expect(await tip(page)).toEqual({ t: 'mar 22 · Cold start', v: '22 pings', d: '15.3% del día' })
    await expect(page.locator('#c-stacked-line .sc-on')).toHaveCount(7)
  })

  test('pie: la porción warm', async ({ page }) => {
    await apuntar(page, page.locator('#c-pie-pie-line svg'), 0.75, 0.6)
    expect(await tip(page)).toEqual({ t: 'Warm', v: '102 pings', d: '70.8% del total' })
  })

  test('range: la segunda fila', async ({ page }) => {
    await page.locator('#c-range-demo [data-sc-s="r1"] .sc-bar').hover()
    expect(await tip(page)).toEqual({ t: 'checkout-api', v: '68 / 257 ms', d: 'Dispersión de 189 ms' })
  })

  test('una serie apagada no muestra tooltip aunque el puntero caiga sobre ella', async ({ page }) => {
    // Con display:none el navegador nunca la elige como destino; el evento se despacha a mano para
    // probar la guarda del runtime, que es la que cubre un CSS que la deje visible.
    await page.locator('#c-rings-demo [data-sc-leg="latency"]').click()
    await page.evaluate(() => {
      const g = document.querySelector('#c-rings-demo svg g[data-sc-s="latency"]')

      g.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 50, clientY: 50 }))
    })
    await expect(page.locator('.sc-tip')).toBeHidden()
  })
})

test.describe('cursor', () => {
  const cap = (page, id, attr) => page.locator('#c-' + id + ' rect[' + attr + ']')

  test('line: al 50% del ancho, el punto más cercano y la guía visible', async ({ page }) => {
    await apuntar(page, cap(page, 'line-demo', 'data-sc-line'), 0.5)
    expect(await tip(page)).toEqual({ t: 'Sweep de las 10:17', v: '73 ms', d: 'Dentro del rango normal' })
    await expect(page.locator('#c-line-demo .sc-guia')).toHaveAttribute('visibility', 'visible')
  })

  test('line: en el borde derecho, el buffer dice En curso', async ({ page }) => {
    await apuntar(page, cap(page, 'line-demo', 'data-sc-line'), 0.999)
    expect(await tip(page)).toEqual({ t: 'Sweep de las 18:13', v: '252 ms', d: 'En curso' })
  })

  test('line recortada: el cursor encuentra el punto conservado más cercano a su posición original', async ({ page }) => {
    const c = cap(page, 'line-10000-puntos-recortada', 'data-sc-line')

    await apuntar(page, c, 0)
    expect((await tip(page)).t).toBe('p0')

    for (const fx of [0.37, 0.8123]) {
      await apuntar(page, c, fx)
      const caja = await c.boundingBox()
      const { p, n0 } = JSON.parse(await c.getAttribute('data-sc-line'))
      // Misma cuenta que el runtime, a partir del píxel donde quedó el puntero.
      const x = Math.round(caja.x + caja.width * fx)
      const meta = Math.min(1, Math.max(0, (x - caja.x) / caja.width)) * (n0 - 1)
      const esperado = p.reduce((m, q) => (Math.abs(q - meta) < Math.abs(m - meta) ? q : m), p[0])

      expect((await tip(page)).t).toBe('p' + esperado)
    }
  })

  test('stackedLine: a 18/48 del ancho, total y las dos series, con dos puntos', async ({ page }) => {
    await apuntar(page, cap(page, 'stackedLine-demo', 'data-sc-area'), 18 / 48)
    expect(await tip(page)).toEqual({ t: '09:00', v: 'TTFB 139 ms', d: 'Aporte propio  75 ms\nShared path  64 ms' })
    await expect(page.locator('#c-stackedLine-demo .sc-pto[visibility="visible"]')).toHaveCount(2)
  })

  test('heatmap: celda sin datos dice el motivo; celda medida, la cuenta', async ({ page }) => {
    const c = cap(page, 'heatmap-demo', 'data-sc-heat')

    await apuntar(page, c, 14.5 / 24, 3.5 / 7)
    expect(await tip(page)).toEqual({ t: 'mié 23 · 14:00', v: 'Sin pings', d: 'La API estaba pausada' })
    await expect(page.locator('#c-heatmap-demo .sc-celda')).toHaveAttribute('visibility', 'visible')
    await apuntar(page, c, 2.5 / 24, 0.5 / 7)
    expect(await tip(page)).toEqual({ t: 'dom 20 · 02:00', v: '0 cold starts', d: '' })
  })

  test('mover a una zona vacía suelta la guía y esconde el tooltip', async ({ page }) => {
    await apuntar(page, cap(page, 'line-demo', 'data-sc-line'), 0.5)
    await page.mouse.move(2, 2)
    await expect(page.locator('#c-line-demo .sc-guia')).toHaveAttribute('visibility', 'hidden')
    await expect(page.locator('.sc-tip')).toBeHidden()
  })

  test('heatmap: una celda con un valor negativo muestra el valor real, no «sin datos»', async ({ page }) => {
    await page.evaluate(() => {
      const el = document.getElementById('c-state-empty')

      window.SC.render(el, window.SC.heatmap({ rows: ['r'], values: [[-3, 1]], unit: ['grado', 'grados'] }))
    })
    await apuntar(page, page.locator('#c-state-empty rect[data-sc-heat]'), 0.25)
    expect(await tip(page)).toEqual({ t: 'r · 00:00', v: '-3 grados', d: '' })
  })

  test('line y stackedLine: el cursor sobre un hueco dice Sin datos y no muestra punto', async ({ page }) => {
    await page.evaluate(() => {
      const el = document.getElementById('c-state-empty')

      window.SC.render(el, window.SC.line({ values: [5, 6, null, 7, 8], labels: ['a', 'b', 'c', 'd', 'e'], max: 10 }) +
        window.SC.stackedLine({ max: 20, labels: ['a', 'b', 'c', 'd', 'e'], series: [{ key: 'a', label: 'A', hue: 'blue', values: [1, 2, 3, 4, 5] }, { key: 'b', label: 'B', hue: 'sky', values: [1, 2, null, 4, 5] }] }))
    })
    await apuntar(page, page.locator('#c-state-empty rect[data-sc-line]'), 0.5)
    expect(await tip(page)).toEqual({ t: 'c', v: 'Sin datos', d: '' })
    await expect(page.locator('#c-state-empty .sc-line .sc-pto')).toHaveAttribute('visibility', 'hidden')
    await apuntar(page, page.locator('#c-state-empty rect[data-sc-area]'), 0.5)
    expect(await tip(page)).toEqual({ t: 'c', v: 'Sin datos', d: '' })
    await expect(page.locator('#c-state-empty .sc-stackedline .sc-pto[visibility="visible"]')).toHaveCount(0)
  })

  test('la banda del hueco tapa la banda de referencia: el centro del hueco no es azul', async ({ page }) => {
    await page.evaluate(() => {
      const el = document.getElementById('c-state-empty')

      window.SC.render(el, window.SC.line({ values: [5, 5, 5, null, null, null, 5, 5, 5], max: 10, band: [2, 8] }))
    })
    const svg = page.locator('#c-state-empty svg')

    await svg.scrollIntoViewIfNeeded()
    await page.waitForTimeout(1500)
    const caja = await svg.boundingBox()
    // x del centro del hueco (índice 4 de 8) y y a mitad de la banda de referencia (valor 5).
    const escala = caja.width / 640
    const px = { x: Math.round(caja.x + (44 + (4 / 8) * 580) * escala), y: Math.round(caja.y + (14 + 0.5 * 190) * escala) }
    const png = await page.screenshot({ clip: { x: px.x - 6, y: px.y - 6, width: 12, height: 12 } })
    const color = await page.evaluate(async b64 => {
      const i = new Image()

      i.src = 'data:image/png;base64,' + b64
      await i.decode()
      const c = new OffscreenCanvas(i.width, i.height).getContext('2d')

      c.drawImage(i, 0, 0)
      const d = c.getImageData(0, 0, i.width, i.height).data
      let azul = 0

      // Un píxel «azul» domina en azul: b bien por encima de r y de g.
      for (let k = 0; k < d.length; k += 4) if (d[k + 2] > d[k] + 40 && d[k + 2] > d[k + 1] + 20) azul++

      return azul
    }, png.toString('base64'))

    expect(color).toBe(0)
  })

  test('recorte: el cursor sobre un pico fuera de escala dice el valor real y el punto queda en el borde', async ({ page }) => {
    await page.evaluate(() => {
      window.SC.render(document.getElementById('c-state-empty'), window.SC.line({ values: [70, 72, 3000, 71, 70], labels: ['a', 'b', 'c', 'd', 'e'], max: 400, unit: 'ms' }))
    })
    await apuntar(page, page.locator('#c-state-empty rect[data-sc-line]'), 0.5)
    expect(await tip(page)).toEqual({ t: 'c', v: '3000 ms', d: '' })
    await expect(page.locator('#c-state-empty .sc-pto')).toHaveAttribute('cy', '14')
  })

  test('salir de la página limpia resaltado, guía y tooltip', async ({ page }) => {
    await page.locator('#c-bullet-demo-1 .sc-bullet').hover()
    await apuntar(page, cap(page, 'line-demo', 'data-sc-line'), 0.5)
    await page.locator('#c-bullet-demo-1 .sc-bullet').hover()
    await expect(page.locator('#c-bullets')).toHaveClass(/sc-dim/)
    await page.evaluate(() => document.documentElement.dispatchEvent(new PointerEvent('pointerleave')))
    await expect(page.locator('#c-bullets')).not.toHaveClass(/sc-dim/)
    await expect(page.locator('.sc-tip')).toBeHidden()
  })
})

test('setHatch: grueso, vertical y fuerte llega a patrones y variables', async ({ page }) => {
  await page.evaluate(() => window.SC.setHatch({ look: 'vert', density: 'gruesa', opacity: 'fuerte' }))
  const p = page.locator('pattern[data-sc-g="d"]').first()

  await expect(p).toHaveAttribute('width', '10')
  await expect(p).toHaveAttribute('patternTransform', 'rotate(0)')
  const vars = await page.evaluate(() => ['--sc-hatch-gap', '--sc-hatch-angle', '--sc-hatch-op'].map(v => document.documentElement.style.getPropertyValue(v)))

  expect(vars).toEqual(['10px', '90deg', '0.8'])
})

test('render: no vuelve a pintar el mismo HTML', async ({ page }) => {
  const r = await page.evaluate(() => {
    const el = document.getElementById('c-state-empty')
    const nodo = el.firstElementChild

    return [window.SC.render(el, el.scHtml), el.firstElementChild === nodo, window.SC.render(el, el.scHtml + ' ')]
  })

  expect(r).toEqual([false, true, true])
})

test('play: skeleton, entrada animada y limpio', async ({ page }) => {
  const clases = () => page.evaluate(() => document.getElementById('c-columns-solid').className)

  await page.evaluate(() => window.SC.play(document.getElementById('c-columns-solid')))
  await page.waitForTimeout(100)
  expect(await clases()).toContain('sc-loading')
  await page.waitForTimeout(1100)
  expect(await clases()).toContain('sc-play')
  expect(await clases()).not.toContain('sc-loading')
  await page.waitForTimeout(2800)
  expect(await clases()).toBe('caso')
})

test('columns: cantidad de paths por variante', async ({ page }) => {
  const cuenta = {}

  for (const v of ['solid', 'gradient', 'duotone', 'hatched', 'stripped']) cuenta[v] = await page.locator('#c-columns-' + v + ' svg path').count()
  expect(cuenta).toEqual({ solid: 11, gradient: 11, duotone: 20, hatched: 20, stripped: 20 })
})

// PENDIENTE CONOCIDO (se arregla cuando setHatch pase a leer el CSS en vez de escribirlo): el CSS de
// quien usa la librería tiene que mandar sobre el rayado, pero setHatch() escribe las variables en
// línea sobre :root y render() lo llama al pintar. test.fail: pasa mientras siga fallando, y se
// pone rojo el día que se arregle (entonces se le saca el fail).
test('el CSS de quien usa la librería manda sobre la separación del rayado', async ({ page }) => {
  test.fail()
  await page.addStyleTag({ content: ':root { --sc-hatch-gap: 11px }' })
  await page.evaluate(() => {
    const el = document.getElementById('c-columns-hatched')

    el.scHtml = ''
    window.SC.render(el, window.SC.columns({ variant: 'hatched', max: 4, data: [{ label: 'a', value: 2 }] }))
  })
  await expect(page.locator('#c-columns-hatched pattern[data-sc-g="d"]')).toHaveAttribute('width', '11', { timeout: 1000 })
})

test('render con id: la segunda vez no toca el DOM y la leyenda apagada sobrevive', async ({ page }) => {
  const r = await page.evaluate(() => {
    const el = document.getElementById('c-state-empty')
    const o = { id: 'estable', values: [64, 71, 66, 69], max: 100, band: [60, 70] }
    const primero = window.SC.render(el, window.SC.line(o))

    el.querySelector('[data-sc-leg="band"]').click()
    const segundo = window.SC.render(el, window.SC.line(o))

    return [primero, segundo, el.querySelector('[data-sc-leg="band"]').getAttribute('aria-pressed')]
  })

  expect(r).toEqual([true, false, 'false'])
})
