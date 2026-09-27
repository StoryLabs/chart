// Entrada del build IIFE: deja la librería en el global StorylabsCharts, para quien no tiene bundler.
import * as StorylabsCharts from './index.js'

globalThis.StorylabsCharts = StorylabsCharts
