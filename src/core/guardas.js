// Una función de gráfico nunca lanza y nunca escribe NaN: un dato malo de UN gráfico no puede tirar
// abajo el pintado de toda la página. Sin datos, el estado vacío; si falta una estructura
// obligatoria o una referencia está rota, el estado de error EN EL LUGAR del gráfico.
import { esc, num } from './format.js'
import { textos } from './textos.js'

export const vacio = () => '<div class="sc-chart sc-state"><i class="sc-hfill"></i><b>' + esc(textos.empty) + '</b></div>'

// El título es para quien usa la aplicación; el detalle, para quien la programa (fijo en español).
// data-sc-error deja detectar el error sin leer el texto.
export const fallo = (fn, problema) =>
  '<div class="sc-chart sc-state sc-error" data-sc-error="' + esc(fn) + '"><i class="sc-hfill"></i><b>' + esc(textos.error) + '</b><span>' + esc(fn + ': ' + problema) + '</span></div>'

/** El primer campo obligatorio que no es una lista, o el que falta si no vinieron opciones. */
export const requiere = (fn, o, listas) => {
  if (!o || typeof o !== 'object') return fallo(fn, 'faltan las opciones')

  const k = listas.find(c => !Array.isArray(o[c]))

  return k ? fallo(fn, 'falta ' + k + ', una lista') : ''
}

/** Un max que no es un número positivo vale 1. */
export const conEscala = o => (num(o.max) > 0 ? o : { ...o, max: 1 })
