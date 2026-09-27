// Los casos canónicos en el orden en que se corren: los 47 del prototipo y, detrás, los extra.
// El orden importa porque los ids de los SVG salen de un contador.
import canonicos from '../fixtures/casos-canonicos.json'
import salidasCanonicas from '../fixtures/salidas-canonicas.json'
import extra from '../fixtures/casos-extra.json'
import salidasExtra from '../fixtures/salidas-extra.json'

export const casos = [...canonicos.map(c => ({ ...c, clase: 'prototipo' })), ...extra.map(c => ({ ...c, clase: 'extra' }))]
export const salidas = [...salidasCanonicas, ...salidasExtra]
