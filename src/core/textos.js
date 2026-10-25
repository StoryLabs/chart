// Los textos que escribe la librería. Las claves son API (en inglés); setTextos() cambia cualquiera
// (por ejemplo, al cambiar de idioma). Un {nombre} se reemplaza por su valor al escribir el texto.
export const textos = {
  empty: 'Sin datos',
  error: 'No se pudo dibujar el gráfico',
  inProgress: 'En curso',
  point: 'Punto {n}',
  series: 'Serie',
  total: 'Total',
  compare: 'Referencia',
  events: 'Movimientos',
  measured: 'Medido',
  complete: 'Completo',
  projection: 'En curso. Proyección al cierre: {value}',
  aboveThreshold: 'Sobre el umbral de {value}',
  thresholdLabel: 'umbral {value}',
  thresholdLegend: 'Umbral de {value}',
  band: 'Rango normal, {from} a {to}',
  inRange: 'Dentro del rango normal',
  outRange: 'Fuera del rango normal',
  ofDay: 'del día',
  ofTotal: 'del total',
  dispersion: 'Dispersión de {value}',
  reference: 'Referencia: {from} a {to}',
  scale: 'Escala de {from} a {to}',
  more: '{n} o más',
  ringOf: '{value} de {max}',
  ringLeft: 'Faltan {n} puntos',
  lineLabel: 'Serie en el tiempo',
  stackedLineLabel: 'Series apiladas',
  columnsLabel: 'Columnas',
  pieLabel: 'Reparto',
  ribbonLabel: 'Estados en el tiempo',
  heatmapLabel: 'Mapa de calor'
}

/** Un texto con sus {nombre} reemplazados: t('point', { n: 3 }). */
export const t = (clave, v) => String(textos[clave]).replace(/\{(\w+)\}/g, (_, k) => (v && v[k] !== undefined ? v[k] : ''))

/** Cambia los textos de la librería. Solo toca las claves que se le pasan. */
export const setTextos = o => Object.assign(textos, o)
