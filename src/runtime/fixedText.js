// El texto del SVG vive en unidades del viewBox: al estirar el lienzo escala con la
// geometría. Para que el rótulo quede en 11 px de pantalla se compensa la fuente con el
// cociente entre el ancho del viewBox y el ancho real; el trazo y las celdas no se tocan
// y sí se estiran.
export const BASE_FONT = 11

export const scaleFor = (viewBoxWidth, clientWidth) => {
  if (!Number.isFinite(viewBoxWidth) || !Number.isFinite(clientWidth) || clientWidth <= 0) return 1

  return viewBoxWidth / clientWidth
}

export const compensatedSize = (viewBoxWidth, clientWidth) => BASE_FONT * scaleFor(viewBoxWidth, clientWidth)

// Lo que se ve en pantalla: la fuente compensada vuelve a escalar con el lienzo y cae en 11 px.
export const screenSize = (viewBoxWidth, clientWidth) => compensatedSize(viewBoxWidth, clientWidth) * clientWidth / viewBoxWidth

export const applyFixedText = svg => {
  if (!svg || !svg.style) return 1

  const box = svg.viewBox && svg.viewBox.baseVal
  const factor = scaleFor(box ? box.width : NaN, svg.clientWidth)

  svg.style.setProperty('--sc-fix', String(factor))

  return factor
}

export const watchFixedText = (root = document.body) => {
  const watched = new WeakSet()
  const resize = new ResizeObserver(entries => {
    for (const entry of entries) applyFixedText(entry.target)
  })
  const attach = svg => {
    if (watched.has(svg)) return
    watched.add(svg)
    applyFixedText(svg)
    resize.observe(svg)
  }
  const collect = scope => {
    if (scope.tagName === 'svg' && scope.closest && scope.closest('.sc-line, .sc-heatmap')) attach(scope)
    if (scope.querySelectorAll) for (const svg of scope.querySelectorAll('.sc-line svg, .sc-heatmap svg')) attach(svg)
  }

  collect(root)

  const mutations = new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue
        collect(node)
      }
    }
  })

  mutations.observe(root, { childList: true, subtree: true })

  return () => {
    resize.disconnect()
    mutations.disconnect()
  }
}
