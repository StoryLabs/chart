// Pintado, CPU frenada, interacción, animación de entrada y memoria, medidos en Chrome real por
// el protocolo DevTools. Es lo que bench.html NO puede medir: ahí sólo se ve script, DOM y layout.
//
// Uso, desde la carpeta que contiene bench/ y fuente/:
//
//   python3 -m http.server 8777 --bind 127.0.0.1 &
//   node bench/trazas.mjs                      # todo
//   node bench/trazas.mjs tablero memoria      # sólo esas partes
//
// En el repo se corre con `bun run bench:paint` (bench/pintado.js levanta el servidor y fija BASE,
// DEMO y PLAYWRIGHT).
// Variables: DEMO (ruta de la demo, /bench/demo.html), BASE (http://127.0.0.1:8777), FRENO (6), PLAYWRIGHT (ruta al paquete playwright, si
// no está instalado en este proyecto), VENTANA=1 para correr con ventana.
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright')
const BASE = process.env.BASE || 'http://127.0.0.1:8777'
const FRENO = Number(process.env.FRENO || 6)
const partes = process.argv.slice(2)
const corre = p => !partes.length || partes.includes(p)
const mediana = xs => xs.slice().sort((a, b) => a - b)[xs.length >> 1]
const r2 = v => Math.round(v * 100) / 100

// El trabajo del hilo principal. Raster y GPU corren en otros hilos y el freno de CPU no los toca.
const HILO = ['FunctionCall', 'UpdateLayoutTree', 'Layout', 'PrePaint', 'Paint', 'Layerize', 'Commit']
const NOMBRES = [...HILO, 'ParseHTML', 'EventDispatch', 'RasterTask', 'GPUTask']

const browser = await chromium.launch({ channel: 'chrome', headless: !process.env.VENTANA })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const cdp = await page.context().newCDPSession(page)
const out = { chrome: browser.version(), freno: FRENO }

const frenar = rate => cdp.send('Emulation.setCPUThrottlingRate', { rate })

/** Corre una acción con la traza prendida y devuelve los ms sumados por tipo de evento. */
const trazar = async accion => {
  const eventos = []
  const alDato = e => { for (const v of e.value) eventos.push(v) }

  cdp.on('Tracing.dataCollected', alDato)

  const fin = new Promise(r => cdp.once('Tracing.tracingComplete', r))

  await cdp.send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'cc', 'gpu', 'viz'] } })

  const extra = await accion()

  await cdp.send('Tracing.end')
  await fin
  cdp.off('Tracing.dataCollected', alDato)

  const suma = {}

  // OJO: FunctionCall y EventDispatch CONTIENEN a ParseHTML y a lo que corra adentro. No sumar
  // ParseHTML con FunctionCall, ni mirar Layout sin UpdateLayoutTree: con container queries el
  // estilo se calcula dentro de Layout y sin ellas afuera, así que uno solo de los dos engaña.
  for (const e of eventos) if (e.ph === 'X' && e.dur && NOMBRES.includes(e.name)) suma[e.name] = (suma[e.name] || 0) + e.dur / 1000

  return { suma, extra }
}

/** Llama a window[fn] tantas veces, dejando pasar dos cuadros entre una y otra. */
const ciclo = (fn, veces) => page.evaluate(([fn, veces]) => new Promise(done => {
  const ts = []
  let k = 0
  const paso = () => {
    if (k++ >= veces) return done(ts)

    const t0 = performance.now()

    window[fn]()
    ts.push(performance.now() - t0)
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(paso, 30)))
  }

  paso()
}), [fn, veces])

// ---------------------------------------------------------------------------------------------
// 1. El tablero de 55 gráficos: repintar todo, contra render() cuando nada cambió
// ---------------------------------------------------------------------------------------------
if (corre('tablero')) {
  await page.goto(BASE + '/bench/tablero.html')
  await page.waitForFunction(() => typeof window.repintarSiCambio === 'function')

  const VECES = 20

  out.tablero = await page.evaluate(() => ({ graficos: document.querySelectorAll('#ancho .sc-chart').length, nodos: document.querySelectorAll('#ancho *').length }))

  for (const rate of [1, FRENO]) {
    await frenar(rate)
    await ciclo('repintar', 3)

    const todo = await trazar(() => ciclo('repintar', VECES))

    await page.evaluate(() => window.repintarSiCambio())

    const igual = await trazar(() => ciclo('repintarSiCambio', VECES))
    const armar = await ciclo('armar', VECES)
    const hilo = s => r2(HILO.reduce((a, k) => a + (s[k] || 0), 0) / VECES)

    out.tablero['cpu ' + rate + '×'] = {
      repintarTodo_hiloPrincipal_ms: hilo(todo.suma),
      detalle_ms: Object.fromEntries(Object.entries(todo.suma).map(([k, v]) => [k, r2(v / VECES)])),
      renderSinCambios_hiloPrincipal_ms: hilo(igual.suma),
      soloArmarElHtml_ms: r2(mediana(armar))
    }
  }

  // Cuánto cuesta cada efecto: el mismo repintado, con el efecto apagado.
  await frenar(FRENO)
  for (const [nombre, css] of [['base', '/* nada */'], ['sin rayado', '.sc-hatch,.sc-hfill{display:none!important}'], ['sin glow', '.sc-glow{filter:none!important}']]) {
    const st = await page.addStyleTag({ content: css })

    await ciclo('repintar', 3)

    const r = await trazar(() => ciclo('repintar', VECES))

    out.tablero['efecto a cpu ' + FRENO + '×: ' + nombre] = { Paint: r2((r.suma.Paint || 0) / VECES), RasterTask: r2((r.suma.RasterTask || 0) / VECES), GPUTask: r2((r.suma.GPUTask || 0) / VECES) }
    await st.evaluate(e => e.remove())
  }
  await frenar(1)
}

// ---------------------------------------------------------------------------------------------
// 2. Memoria: ¿crece sin tope al repintar?
// ---------------------------------------------------------------------------------------------
if (corre('memoria')) {
  await page.goto(BASE + '/bench/tablero.html')
  await page.waitForFunction(() => typeof window.repintar === 'function')
  await cdp.send('Performance.enable')
  await cdp.send('HeapProfiler.enable')

  // Tres pasadas de recolección: con una sola queda colgado el árbol anterior y parece una fuga.
  const foto = async () => {
    for (let i = 0; i < 3; i++) { await cdp.send('HeapProfiler.collectGarbage'); await page.waitForTimeout(150) }

    const m = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]))

    return { heapMB: r2(m.JSHeapUsedSize / 1048576), nodos: m.Nodes, listeners: m.JSEventListeners }
  }
  const tanda = n => page.evaluate(n => new Promise(done => { let k = 0; const paso = () => { if (k++ >= n) return done(); window.repintar(); setTimeout(paso, 0) }; paso() }), n)

  await tanda(20)
  out.memoria = { inicio: await foto() }
  await tanda(400)
  out.memoria.tras400 = await foto()
  await tanda(1600)
  out.memoria.tras2000 = await foto()
}

// ---------------------------------------------------------------------------------------------
// 3. Interacción con el mouse de verdad, y 4. animación de entrada
// ---------------------------------------------------------------------------------------------
if (corre('interaccion') || corre('entrada')) {
  await page.goto(BASE + (process.env.DEMO || '/bench/demo.html'))
  await page.waitForSelector('#sRange .sc-range-row')
}

const cuadros = fr => {
  const base = mediana(fr)

  return { cuadros: fr.length, cuadroMediano_ms: r2(base), peorCuadro_ms: r2(Math.max(...fr)), cuadrosLargos: fr.filter(t => t > base * 1.8).length }
}

if (corre('interaccion')) {
  await frenar(FRENO)

  const barrido = async (selector, enDiagonal) => {
    const PASOS = 80

    await page.locator(selector).first().scrollIntoViewIfNeeded()
    await page.waitForTimeout(150)

    const b = await page.locator(selector).first().boundingBox()

    await page.evaluate(() => { window.__fr = []; window.__on = true; let a = performance.now(); const f = t => { window.__fr.push(t - a); a = t; if (window.__on) requestAnimationFrame(f) }; requestAnimationFrame(f) })

    const r = await trazar(async () => {
      for (let i = 0; i <= PASOS; i++) {
        await page.mouse.move(b.x + 2 + (b.width - 4) * (i / PASOS), enDiagonal ? b.y + 4 + (b.height - 8) * (((i * 7) % PASOS) / PASOS) : b.y + b.height / 2)
        await page.waitForTimeout(16)
      }
    })
    const fr = await page.evaluate(() => { window.__on = false; return window.__fr.slice(2) })

    return { ...cuadros(fr), porEvento_ms: r2((r.suma.EventDispatch || 0) / (PASOS + 1)) }
  }

  out.interaccion = { nota: 'CPU frenada ' + FRENO + '×. porEvento_ms es el EventDispatch medio, o sea el handler entero.' }
  out.interaccion['cursor sobre line'] = await barrido('#sLine [data-sc-line]')
  out.interaccion['cursor sobre stackedLine'] = await barrido('#sStackedLine [data-sc-area]')
  out.interaccion['cursor sobre heatmap'] = await barrido('#sHeatmap [data-sc-heat]', true)
  out.interaccion['hover sobre stacked'] = await barrido('#sStacked .sc-cols', true)

  const sinBlur = await page.addStyleTag({ content: '.sc-tip{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}' })

  out.interaccion['cursor sobre line, tooltip sin blur'] = await barrido('#sLine [data-sc-line]')
  await sinBlur.evaluate(e => e.remove())
  await frenar(1)
}

if (corre('entrada')) {
  for (const rate of [1, FRENO]) {
    await frenar(rate)
    await page.evaluate(() => window.scrollTo(0, 500))
    await page.waitForTimeout(200)

    const fr = await page.evaluate(() => new Promise(done => {
      const fr = []
      let a = performance.now()
      const t0 = a
      const f = t => { fr.push(t - a); a = t; t - t0 < 3800 ? requestAnimationFrame(f) : done(fr.slice(2)) }

      document.getElementById('btnCarga').click()
      requestAnimationFrame(f)
    }))

    out['entrada cpu ' + rate + '×'] = { ...cuadros(fr), fps: r2(1000 / (fr.reduce((x, y) => x + y, 0) / fr.length)) }
  }
  await frenar(1)
}

await browser.close()
console.log(JSON.stringify(out, null, 2))
