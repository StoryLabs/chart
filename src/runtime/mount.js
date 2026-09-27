import { pie } from '../charts/pie.js'
import { stacked } from '../charts/stacked.js'
import { stackedLine } from '../charts/stackedLine.js'
import { pad, entre, col, conUnidad, cuenta } from '../core/format.js'
import { setHatch } from './hatch.js'
import { textos } from '../core/textos.js'

// Los gráficos que se REDIBUJAN al tocar su leyenda: apagar una serie cambia la forma de las demás.
export const redibujables = { pie, stacked, stackedLine }

let montado = false

export const mount = () => {
  if (montado) return
  montado = true

  const tipEl = document.createElement('div')

  tipEl.className = 'sc-tip'
  tipEl.hidden = true
  tipEl.innerHTML = '<div class="sc-tip-t"><i></i><span></span></div><b></b><small></small>'
  document.body.appendChild(tipEl)

  let resaltado = null
  let claveResaltada = null
  let cursor = null
  // Los tramos de cada serie, por gráfico. Se arman la primera vez que el cursor entra y quedan
  // guardados: un gráfico que se vuelve a pintar es un elemento NUEVO, así que la entrada vieja
  // se va sola con el elemento y nunca queda una lista de algo que ya no está en la página.
  const series = new WeakMap()

  const seriesDe = donde => {
    let mapa = series.get(donde)

    if (!mapa) {
      mapa = new Map()
      for (const e of donde.querySelectorAll('[data-sc-s]')) {
        const k = e.getAttribute('data-sc-s')

        if (!mapa.has(k)) mapa.set(k, [])
        mapa.get(k).push(e)
      }
      series.set(donde, mapa)
      if (donde.querySelectorAll('[data-sc-s]').length > 60) donde.classList.add('sc-muchos')
    }

    return mapa
  }

  const mostrar = (ev, t, v, d, h) => {
    tipEl.querySelector('.sc-tip-t span').textContent = t
    tipEl.querySelector('b').textContent = v
    tipEl.querySelector('small').textContent = d || ''
    tipEl.querySelector('small').hidden = !d
    tipEl.style.setProperty('--c', col(h))
    tipEl.hidden = false

    const w = tipEl.offsetWidth
    const alto = tipEl.offsetHeight
    const px = ev.clientX + 16 + w > window.innerWidth - 8 ? ev.clientX - w - 16 : ev.clientX + 16
    const py = ev.clientY + 18 + alto > window.innerHeight - 8 ? ev.clientY - alto - 14 : ev.clientY + 18

    tipEl.style.transform = 'translate(' + Math.max(8, px) + 'px,' + Math.max(8, py) + 'px)'
  }

  const soltar = () => {
    if (!cursor) return
    for (const e of cursor.querySelectorAll('.sc-guia, .sc-pto, .sc-celda')) e.setAttribute('visibility', 'hidden')
    cursor = null
  }

  /**
   * El índice del punto más cercano a una fracción del ancho. Si la serie fue recortada, los
   * puntos no están repartidos parejo y hay que buscar; la búsqueda es binaria, así que el
   * cursor cuesta lo mismo con cien puntos que con diez mil.
   */
  const masCercano = (d, frac, N) => {
    if (!d.p) return Math.round(frac * (N - 1))

    const meta = frac * (d.n0 - 1)
    let a = 0
    let b = N - 1

    while (b - a > 1) {
      const m = (a + b) >> 1

      if (d.p[m] < meta) a = m
      else b = m
    }

    return meta - d.p[a] <= d.p[b] - meta ? a : b
  }

  const equis = (d, i, N) => d.L + ((d.p ? d.p[i] : i) / ((d.p ? d.n0 : N) - 1)) * d.W

  const seguirCalor = (cap, ev) => {
    const d = cap.scDatos || (cap.scDatos = JSON.parse(cap.getAttribute('data-sc-heat')))
    const svg = cap.ownerSVGElement
    const caja = cap.getBoundingClientRect()
    const cols = d.v[0].length
    const h = Math.min(cols - 1, Math.floor(entre((ev.clientX - caja.left) / caja.width) * cols))
    const f = Math.min(d.v.length - 1, Math.floor(entre((ev.clientY - caja.top) / caja.height) * d.v.length))
    const n = d.v[f][h]
    const marco = svg.querySelector('.sc-celda')

    if (cursor && cursor !== svg) soltar()
    cursor = svg
    marco.setAttribute('x', d.L + h * d.s - 2)
    marco.setAttribute('y', d.T + f * d.s - 2)
    marco.setAttribute('visibility', 'visible')
    const vacia = typeof n === 'string'

    mostrar(ev, d.r[f] + ' · ' + pad(h) + ':00', vacia ? d.e : d.u ? cuenta(n, d.u) : n, vacia ? d.w[+n] : '', !vacia && n > 0 ? d.hue : 'neutral')
  }

  const seguir = (cap, ev) => {
    const d = cap.scDatos || (cap.scDatos = JSON.parse(cap.getAttribute('data-sc-line')))
    const svg = cap.ownerSVGElement
    const caja = cap.getBoundingClientRect()
    const N = d.v.length
    // El punto MÁS CERCANO al cursor, no una interpolación: entre dos puntos no se midió nada.
    const i = masCercano(d, entre((ev.clientX - caja.left) / caja.width), N)
    const v = d.v[i]
    const arriba = d.thr !== null && v >= d.thr
    const hue = arriba ? d.alerta : d.hue
    const x = equis(d, i, N)
    const guia = svg.querySelector('.sc-guia')
    const pto = svg.querySelector('.sc-pto')

    if (cursor && cursor !== svg) soltar()
    cursor = svg
    guia.setAttribute('x1', x)
    guia.setAttribute('x2', x)
    guia.setAttribute('visibility', 'visible')
    // Un hueco: la guía marca el lugar, sin punto, y el tooltip dice que no hay dato.
    if (v === null) {
      pto.setAttribute('visibility', 'hidden')

      return mostrar(ev, d.l ? d.l[i] : 'Punto ' + (i + 1), textos.empty, '', 'neutral')
    }
    pto.setAttribute('cx', x)
    // Un valor fuera de escala: el punto queda en el borde del plot, el tooltip dice el real.
    pto.setAttribute('cy', d.T + entre(1 - v / d.max) * d.H)
    pto.style.fill = col(hue)
    pto.setAttribute('visibility', 'visible')

    const detalle = d.buf && i === N - 1 ? 'En curso'
      : arriba ? 'Sobre el umbral de ' + conUnidad(d.thr, d.u)
        : d.band ? (v >= d.band[0] && v <= d.band[1] ? 'Dentro del rango normal' : 'Fuera del rango normal') : ''

    mostrar(ev, d.l ? d.l[i] : 'Punto ' + (i + 1), conUnidad(Math.round(v), d.u), detalle, hue)
  }

  const seguirArea = (cap, ev) => {
    const d = cap.scDatos || (cap.scDatos = JSON.parse(cap.getAttribute('data-sc-area')))
    const svg = cap.ownerSVGElement
    const caja = cap.getBoundingClientRect()
    const N = d.s.length ? d.s[0].v.length : 0

    if (!N) return

    const i = masCercano(d, entre((ev.clientX - caja.left) / caja.width), N)
    const x = equis(d, i, N)
    const guia = svg.querySelector('.sc-guia')
    const ptos = svg.querySelectorAll('.sc-pto')
    let suma = 0

    if (cursor && cursor !== svg) soltar()
    cursor = svg
    guia.setAttribute('x1', x)
    guia.setAttribute('x2', x)
    guia.setAttribute('visibility', 'visible')

    if (d.s[0].v[i] === null) {
      for (const p of ptos) p.setAttribute('visibility', 'hidden')

      return mostrar(ev, d.l ? d.l[i] : 'Punto ' + (i + 1), textos.empty, '', 'neutral')
    }

    d.s.forEach((se, k) => {
      suma += se.v[i]
      ptos[k].setAttribute('cx', x)
      ptos[k].setAttribute('cy', d.T + entre(1 - suma / d.max) * d.H)
      ptos[k].setAttribute('visibility', 'visible')
    })

    // De arriba hacia abajo, en el mismo orden en que se ven las bandas.
    const filas = d.s.map(se => se.n + '  ' + conUnidad(Math.round(se.v[i]), d.u)).reverse()

    if (d.buf && i === N - 1) filas.push('En curso')
    mostrar(ev, d.l ? d.l[i] : 'Punto ' + (i + 1), d.tot + ' ' + conUnidad(Math.round(suma), d.u), filas.join('\n'), d.s.length ? d.s[d.s.length - 1].h : 'neutral')
  }

  const alMover = ev => {
    const t = ev.target && ev.target.closest ? ev.target : null

    if (t && t.hasAttribute('data-sc-line')) return seguir(t, ev)
    if (t && t.hasAttribute('data-sc-area')) return seguirArea(t, ev)
    if (t && t.hasAttribute('data-sc-heat')) return seguirCalor(t, ev)

    soltar()

    const el = t ? t.closest('[data-sc-t]') : null

    if (!el || el.classList.contains('sc-off')) { tipEl.hidden = true; return }

    mostrar(ev, el.getAttribute('data-sc-t'), el.getAttribute('data-sc-v'), el.getAttribute('data-sc-d'), el.getAttribute('data-sc-h'))
  }

  const limpiar = () => {
    if (!resaltado) return
    resaltado.classList.remove('sc-dim')
    for (const e of seriesDe(resaltado).get(claveResaltada) || []) e.classList.remove('sc-on')
    resaltado = null
    claveResaltada = null
  }

  const alcance = el => el.closest('.sc-group') || el.closest('.sc-chart')

  const alEntrar = ev => {
    const el = ev.target && ev.target.closest ? ev.target.closest('[data-sc-s], [data-sc-leg]') : null
    const donde = el ? alcance(el) : null

    const clave = el ? el.getAttribute('data-sc-s') || el.getAttribute('data-sc-leg') : null

    // Moverse DENTRO de la misma serie es lo más frecuente y no cambia nada: no se toca el DOM.
    if (donde && donde === resaltado && clave === claveResaltada) return

    limpiar()
    if (!el || !donde) return

    const serie = (seriesDe(donde).get(clave) || []).filter(e => !e.classList.contains('sc-off'))

    if (!serie.length) return

    donde.classList.add('sc-dim')
    for (const e of serie) e.classList.add('sc-on')
    resaltado = donde
    claveResaltada = clave
  }

  document.addEventListener('pointermove', alMover)
  document.addEventListener('pointerdown', alMover)
  document.addEventListener('pointerover', alEntrar)
  document.documentElement.addEventListener('pointerleave', () => { limpiar(); soltar(); tipEl.hidden = true })

  document.addEventListener('click', ev => {
    const b = ev.target.closest ? ev.target.closest('[data-sc-leg]') : null

    if (!b) return

    const donde = alcance(b)
    const apagar = b.getAttribute('aria-pressed') !== 'false'
    const clave = b.getAttribute('data-sc-leg')
    const redibujable = b.closest('[data-sc-opts]')

    if (redibujable) {
      const o = JSON.parse(redibujable.getAttribute('data-sc-opts'))
      const molde = document.createElement('div')

      o.hidden = apagar ? (o.hidden || []).concat(clave) : (o.hidden || []).filter(k => k !== clave)
      molde.innerHTML = redibujables[redibujable.getAttribute('data-sc-chart')](o)
      redibujable.replaceWith(molde.firstElementChild)
      setHatch()
      limpiar()
      tipEl.hidden = true

      return
    }

    b.setAttribute('aria-pressed', String(!apagar))
    limpiar()
    for (const e of seriesDe(donde).get(clave) || []) e.classList.toggle('sc-off', apagar)
    tipEl.hidden = true
  })
}
