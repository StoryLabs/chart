// bun run bench: corre bench.html en Chrome headless contra dist/ y sale con error si se pasa un tope
// de desempeño (1 ms por gráfico, 8 ms el tablero de 55, 1 ms por interacción). Depende de la
// máquina: es un control antes de publicar, no va en bun test.
// Topes medidos en un Apple M4 Max con Chrome 153; comparar siempre contra una corrida hecha igual.
import { chromium } from '@playwright/test'

const TOPES = { grafico_normal_ms: 1, tablero_55_ms: 8, interaccion_ms: 1 }
const raiz = new URL('../', import.meta.url).pathname
const servidor = Bun.serve({
  port: 0,
  hostname: '127.0.0.1',
  fetch: async req => {
    const f = Bun.file(raiz + decodeURIComponent(new URL(req.url).pathname).slice(1))

    return (await f.exists()) ? new Response(f) : new Response('no existe', { status: 404 })
  }
})
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

await page.goto('http://127.0.0.1:' + servidor.port + '/bench/bench.html')
const r = JSON.parse(await page.locator('#out').textContent({ timeout: 120000 }))

await browser.close()
servidor.stop()

// «Tamaño normal» son los casos de la demo; los de carga (1 000 puntos, 144 tramos…) se informan sin tope.
const normales = r.casos.filter(c => c.caso.startsWith('demo'))
const peorNormal = normales.reduce((m, c) => (c.total_ms > m.total_ms ? c : m))
// Las interacciones reales; el bloque de experimentos de bench.html (sin transición) no cuenta.
const interacciones = { ...r.cursor, 'stacked 90 × 4: pasar a otra serie': r.hover['stacked 90 × 4: pasar a otra serie'] }
const peorInteraccion = Object.entries(interacciones).reduce((m, e) => (e[1] > m[1] ? e : m))
const medido = {
  grafico_normal_ms: peorNormal.total_ms,
  tablero_55_ms: +(r.monitor.texto_ms + r.monitor.dom_ms).toFixed(2),
  interaccion_ms: peorInteraccion[1]
}

console.log(r.maquina)
for (const c of r.casos) console.log('  ' + (c.grafico + ' ' + c.caso).padEnd(44) + String(c.total_ms).padStart(7) + ' ms' + (c.caso.startsWith('demo') ? '' : '   (carga, sin tope)'))
console.log('')
const pasados = Object.keys(TOPES).filter(k => medido[k] > TOPES[k])

for (const k of Object.keys(TOPES)) console.log((pasados.includes(k) ? 'PASADO ' : 'ok     ') + k.padEnd(20) + String(medido[k]).padStart(7) + ' de ' + TOPES[k])
console.log('  peor gráfico normal: ' + peorNormal.grafico + ' ' + peorNormal.caso + ' · peor interacción: ' + peorInteraccion[0])
process.exit(pasados.length ? 1 : 0)
