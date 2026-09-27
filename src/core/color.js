import { col } from './format.js'

// El relleno de una banda: fuerte contra su línea y apagándose al alejarse. Es el mismo de las
// líneas apiladas, para que barras, porciones y áreas hablen igual.
export const FUERTE = 62

export const SUAVE = 20

export const velo = (h, pct) => 'color-mix(in srgb, ' + col(h) + ' ' + pct + '%, transparent)'
