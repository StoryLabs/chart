// Dos salidas, las dos necesarias: ESM para quien tiene bundler, e IIFE con el global
// StorylabsCharts para quien no (el monitor). Más la hoja minificada.
import { rmSync } from 'node:fs'

const raiz = new URL('../', import.meta.url).pathname
const salidas = [
  { entrypoints: [raiz + 'src/index.js'], format: 'esm', naming: 'storylabs-charts.esm.js' },
  { entrypoints: [raiz + 'src/global.js'], format: 'iife', naming: 'storylabs-charts.iife.js' },
  { entrypoints: [raiz + 'src/charts.css'], naming: 'charts.css' }
]

rmSync(raiz + 'dist', { recursive: true, force: true })

for (const s of salidas) {
  const r = await Bun.build({ ...s, outdir: raiz + 'dist', minify: true })

  if (!r.success) {
    console.error(r.logs)
    process.exit(1)
  }
  for (const o of r.outputs) {
    const bytes = new Uint8Array(await o.arrayBuffer())

    console.log(o.path.slice(raiz.length).padEnd(34) + String(bytes.length).padStart(7) + ' B   gzip ' + Bun.gzipSync(bytes, { level: 9 }).length + ' B')
  }
}
