// bun run bench:paint: sirve el repo y corre trazas.mjs contra tablero.html (que carga dist/) y la
// demo (que carga src/). Informativo, sin tope: los números dependen del entorno (headless o con
// ventana, zoom, CPU), así que se comparan sólo contra una corrida hecha igual.
const raiz = new URL('../', import.meta.url).pathname
const servidor = Bun.serve({
  port: 0,
  hostname: '127.0.0.1',
  fetch: async req => {
    const f = Bun.file(raiz + decodeURIComponent(new URL(req.url).pathname).slice(1))

    return (await f.exists()) ? new Response(f) : new Response('no existe', { status: 404 })
  }
})
const hijo = Bun.spawn(['bun', raiz + 'bench/trazas.mjs', ...process.argv.slice(2)], {
  env: { ...process.env, BASE: 'http://127.0.0.1:' + servidor.port, DEMO: '/demo/index.html', PLAYWRIGHT: '@playwright/test' },
  stdout: 'inherit',
  stderr: 'inherit'
})
const codigo = await hijo.exited

servidor.stop(true)
process.exit(codigo)
