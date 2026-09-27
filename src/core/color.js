import { col } from './format.js'

export const mezcla = (a, b) => 'color-mix(in srgb, ' + col(a) + ' 50%, ' + col(b) + ')'

// El relleno de una banda: fuerte contra su línea y apagándose al alejarse. Es el mismo de las
// líneas apiladas, para que barras, porciones y áreas hablen igual.
export const FUERTE = 62

export const SUAVE = 20

export const velo = (h, pct) => 'color-mix(in srgb, ' + col(h) + ' ' + pct + '%, transparent)'
