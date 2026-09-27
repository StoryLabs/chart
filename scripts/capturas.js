// Genera las imágenes del README en docs/img/: cada gráfico dibujado con el MISMO código de ejemplo
// que muestra el README, en dark y en light, más una miniatura, el hero y el ejemplo de huecos.
// Uso: bun scripts/capturas.js      (necesita Chrome instalado; sips de macOS para las miniaturas)
// El hero va a escala 1.5 para quedar por debajo de 200 KB.
import { chromium } from '@playwright/test'
import { readFileSync, statSync, readdirSync } from 'node:fs'

const raiz = new URL('../', import.meta.url).pathname
const readme = readFileSync(raiz + 'README.md', 'utf8')
const bloques = [...readme.matchAll(/```js\n([\s\S]*?)```/g)].map(m => m[1].trim())
const ejemplo = (fn, extra = '') => bloques.find(b => b.startsWith(fn + '(') && b.includes(extra))

// ribbon dibuja en un viewBox de 1100 y no se achica: a menos ancho se desplaza de costado.
const ANCHO = { stackedLine: 860, ribbon: 1140, state: 860, hero: 860 }
const GRAFICOS = ['bullet', 'rings', 'segmented', 'line', 'stackedLine', 'ribbon', 'columns', 'stacked', 'pie', 'heatmap', 'range', 'diverging']

// Cada pieza es código que corre en la página, con SC a mano, y devuelve el HTML a pintar.
const piezas = {
  ...Object.fromEntries(GRAFICOS.map(g => [g, 'SC.' + ejemplo(g)])),
  // Los tres estados, uno al lado del otro: cargando (un gráfico con sc-loading), vacío y error.
  state: `'<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px">' +
    '<div class="sc-loading">' + SC.columns({ max: 6, data: [{ label: 'a', value: 3 }, { label: 'b', value: 5 }, { label: 'c', value: 2 }] }) + '</div>' +
    SC.state({ kind: 'empty', title: 'Sin datos en este período' }) +
    SC.state({ kind: 'error', title: 'No se pudo leer la serie', detail: 'Se reintenta en 5 min.' }) + '</div>'`,
  gaps: 'SC.' + ejemplo('line', 'null'),
  hero: `'<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:28px 32px;align-items:start">' +
    SC.${ejemplo('rings')} + SC.${ejemplo('pie')} +
    '<div style="grid-column:1/-1">' + SC.${ejemplo('stackedLine')} + '</div>' +
    SC.${ejemplo('stacked')} + SC.${ejemplo('heatmap')} + '</div>'`
}

const servidor = Bun.serve({
  port: 0,
  hostname: '127.0.0.1',
  fetch: async req => {
    const ruta = decodeURIComponent(new URL(req.url).pathname)

    if (ruta === '/') {
      return new Response('<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"><link rel="stylesheet" href="/src/charts.css"><style>body{margin:0;background:var(--sc-surface)}#caja{box-sizing:border-box;padding:20px;background:var(--sc-surface)}</style></head><body><div id="caja"></div><script type="module">import * as SC from "/src/index.js"; window.SC = SC; document.body.dataset.listo = 1</script></body></html>', { headers: { 'content-type': 'text/html' } })
    }
    const f = Bun.file(raiz + ruta.slice(1))

    return (await f.exists()) ? new Response(f) : new Response('no existe', { status: 404 })
  }
})
// Raster determinista: sin GPU, los bordes salen iguales en cada corrida.
const browser = await chromium.launch({ channel: 'chrome', args: ['--disable-gpu', '--disable-gpu-rasterization', '--disable-partial-raster', '--force-color-profile=srgb'] })

for (const [nombre, codigo] of Object.entries(piezas)) {
  if (!codigo || codigo.includes('SC.undefined')) throw new Error('el README no trae un ejemplo para ' + nombre)
  for (const tema of ['dark', 'light']) {
    const ancho = ANCHO[nombre] || 560
    const page = await browser.newPage({ viewport: { width: ancho, height: 900 }, deviceScaleFactor: nombre === 'hero' ? 1.5 : 2, reducedMotion: 'reduce' })

    await page.goto('http://127.0.0.1:' + servidor.port + '/')
    await page.locator('body[data-listo="1"]').waitFor({ state: 'attached' })
    await page.evaluate(([t, c, w]) => {
      document.documentElement.setAttribute('data-theme', t)
      const caja = document.getElementById('caja')

      caja.style.width = w + 'px'
      window.SC.render(caja, new Function('SC', 'return ' + c)(window.SC))
    }, [tema, codigo, ancho])
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(300)
    if ((await page.content()).includes('data-sc-error')) throw new Error(nombre + ': el ejemplo dibujó un error')
    await page.locator('#caja').screenshot({ path: raiz + 'docs/img/' + nombre + '-' + tema + '.png' })
    await page.close()
  }
  // La miniatura: la captura en dark, llevada a 500 px de ancho.
  if (nombre !== 'hero' && nombre !== 'gaps') {
    const salida = Bun.spawnSync(['sips', '--resampleWidth', '500', raiz + 'docs/img/' + nombre + '-dark.png', '--out', raiz + 'docs/img/' + nombre + '-mini.png'])

    if (salida.exitCode) throw new Error('sips: ' + salida.stderr)
  }
}

await browser.close()
servidor.stop(true)

let total = 0

for (const f of readdirSync(raiz + 'docs/img').sort()) {
  const kb = statSync(raiz + 'docs/img/' + f).size / 1000

  total += kb
  console.log(f.padEnd(24) + kb.toFixed(0).padStart(5) + ' KB' + (kb > 200 ? '   SE PASA de 200 KB' : ''))
}
console.log('total ' + (total / 1000).toFixed(2) + ' MB' + (total > 4000 ? '   SE PASA de 4 MB' : ''))
