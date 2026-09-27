// Sirve la raíz del repo para los tests del runtime: la página de prueba importa src/ tal cual, sin build.
const raiz = new URL('../../', import.meta.url).pathname
const puerto = Number(process.env.SC_PUERTO || 8791)

Bun.serve({
  port: puerto,
  hostname: '127.0.0.1',
  fetch: async req => {
    const ruta = decodeURIComponent(new URL(req.url).pathname)
    const archivo = Bun.file(raiz + (ruta === '/' ? 'test/browser/pagina.html' : ruta.slice(1)))

    return (await archivo.exists()) ? new Response(archivo) : new Response('no existe', { status: 404 })
  }
})
console.log('storylabs-charts: tests en http://127.0.0.1:' + puerto)
