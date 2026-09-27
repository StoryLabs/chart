// Inyección, por hueco y no por lista: recorre las opciones de cada caso canónico hoja por hoja,
// reemplaza UNA hoja por un valor hostil y exige que la salida no traiga HTML ni CSS crudo.
// Una opción nueva queda cubierta el día que entra a un caso canónico.
import { test, expect } from 'bun:test'
import * as SC from '../../src/index.js'
import { casos } from './casos.js'

// Dos valores, porque atacan contextos distintos: uno cierra un atributo y abre una etiqueta,
// el otro se escapa de una declaración de style.
const HOSTILES = ['"><img src=x onerror=alert(1)>', 'x);background:url(//evil']
// Una etiqueta cruda en cualquier lado, o un url( dentro de un style. Ningún style legítimo de la
// librería lleva url(; en data-sc-t, como texto escapado, es inofensivo.
const estilos = html => [...html.matchAll(/ style="([^"]*)"/g)].map(m => m[1])
const inyecta = html => html.includes('<img') || estilos(html).some(e => /url\(/i.test(e))

/** Rutas a cada hoja. De un arreglo largo alcanza con el primero y el último: tienen la misma forma. */
const hojas = (v, ruta = []) => {
  if (Array.isArray(v)) {
    const idx = v.length > 2 ? [0, v.length - 1] : v.map((_, i) => i)

    return idx.flatMap(i => hojas(v[i], [...ruta, i]))
  }
  if (v && typeof v === 'object') return Object.keys(v).flatMap(k => hojas(v[k], [...ruta, k]))

  return [ruta]
}

const conHoja = (args, ruta, valor) => {
  const copia = structuredClone(args)
  let o = copia

  for (const k of ruta.slice(0, -1)) o = o[k]
  o[ruta.at(-1)] = valor

  return copia
}

const lanzan = new Map()

const agujeros = () => {
  const vistos = new Map()

  for (const c of casos) {
    for (const ruta of hojas(c.args)) {
      // La forma de la opción, sin los índices: fn + camino con [] en lugar de números.
      const forma = c.fn + ' ' + ruta.map(k => (typeof k === 'number' ? '[]' : k)).join('.')

      for (const h of HOSTILES) {
        let html

        try {
          html = SC[c.fn](...conHoja(c.args, ruta, h))
        } catch (e) {
          // Una opción mala no puede tirar abajo el pintado de toda la página.
          if (!lanzan.has(forma)) lanzan.set(forma, c.id + ' · ' + e.constructor.name + ': ' + e.message)
          continue
        }
        if (inyecta(html) && !vistos.has(forma)) vistos.set(forma, c.id + ' · ' + JSON.stringify(h))
      }
    }
  }

  return vistos
}

test('ninguna hoja de ninguna opción canónica inyecta HTML ni CSS', () => {
  const a = agujeros()

  if (a.size) console.log([...a].map(([f, d]) => f + '   (' + d + ')').join('\n'))
  expect([...a.keys()]).toEqual([])
})

test('ninguna hoja hostil hace lanzar a la función', () => {
  if (!lanzan.size) agujeros()
  if (lanzan.size) console.log([...lanzan].map(([f, d]) => f + '   (' + d + ')').join('\n'))
  expect([...lanzan.keys()]).toEqual([])
})
