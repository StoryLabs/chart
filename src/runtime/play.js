let turno = 0

/** Skeleton y después la entrada animada, sobre un contenedor. */
export const play = (el, espera = 900) => {
  const mio = ++turno

  el.classList.remove('sc-play')
  el.classList.add('sc-loading')
  setTimeout(() => {
    if (mio !== turno) return
    el.classList.remove('sc-loading')
    // Leer una medida obliga al navegador a asentar el estado sin animación antes de volver a
    // ponerla: sin esto, quitar y poner la clase en el mismo cuadro no reinicia nada.
    void el.offsetWidth
    el.classList.add('sc-play')
    setTimeout(() => { if (mio === turno) el.classList.remove('sc-play') }, 2600)
  }, espera)
}
