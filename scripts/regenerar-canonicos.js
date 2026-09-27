// Regenera la salida de casos canónicos que un paso cambió A PROPÓSITO. Guarda la del prototipo en
// html_prototipo y el motivo en cambio, para que el vínculo con el prototipo quede a la vista.
// Uso: bun scripts/regenerar-canonicos.js "<motivo>" <id> [<id>…]
import { writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import * as SC from '../src/index.js'
import { resetIds } from '../src/core/ids.js'
import casos from '../test/fixtures/casos-canonicos.json'
import salidas from '../test/fixtures/salidas-canonicas.json'

const [motivo, ...ids] = process.argv.slice(2)

if (!motivo || !ids.length) throw new Error('uso: bun scripts/regenerar-canonicos.js "<motivo>" <id> [<id>…]')

resetIds()
for (const [i, c] of casos.entries()) {
  const html = SC[c.fn](...structuredClone(c.args))
  const s = salidas[i]

  if (!ids.includes(c.id)) continue
  if (!s.html_prototipo) s.html_prototipo = s.html
  s.html = html
  s.bytes = Buffer.byteLength(html)
  s.sha256 = createHash('sha256').update(html).digest('hex')
  s.cambio = (s.cambio ? s.cambio + ' | ' : '') + motivo
  console.log('regenerado ' + c.id)
}
writeFileSync(new URL('../test/fixtures/salidas-canonicas.json', import.meta.url), JSON.stringify(salidas, null, 1))
