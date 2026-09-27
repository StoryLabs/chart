const LOOKS = { ref: { d: 45, v: 0 }, diag: { d: 45, v: 45 }, vert: { d: 0, v: 0 } }

const DENS = { fina: { gap: 5, w: 1.2 }, media: { gap: 7, w: 1.8 }, gruesa: { gap: 10, w: 3 } }

const OPS = { suave: 0.35, media: 0.5, fuerte: 0.8 }

const rayado = { look: 'ref', density: 'media', opacity: 'media' }

export const setHatch = cambio => {
  Object.assign(rayado, cambio || {})

  const Lk = LOOKS[rayado.look] || LOOKS.ref
  const D = DENS[rayado.density] || DENS.media
  const raiz = document.documentElement

  raiz.style.setProperty('--sc-hatch-gap', D.gap + 'px')
  raiz.style.setProperty('--sc-hatch-w', D.w + 'px')
  // Una franja vertical girada A grados equivale a un gradiente de A + 90.
  raiz.style.setProperty('--sc-hatch-angle', Lk.d + 90 + 'deg')
  raiz.style.setProperty('--sc-hatch-op', OPS[rayado.opacity] || OPS.media)

  for (const p of document.querySelectorAll('pattern[data-sc-g]')) {
    p.setAttribute('width', D.gap)
    p.setAttribute('height', D.gap)
    p.setAttribute('patternTransform', 'rotate(' + Lk[p.getAttribute('data-sc-g')] + ')')
    p.firstElementChild.setAttribute('width', D.w)
    p.firstElementChild.setAttribute('height', D.gap)
  }

  return { ...rayado, gap: D.gap, width: D.w, angle: Lk.d, op: OPS[rayado.opacity] || OPS.media }
}
