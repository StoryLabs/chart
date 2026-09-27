# @storylabs/charts

Gráficos en SVG y CSS hechos a mano. Cero dependencias en runtime, sin framework.

- **Cada gráfico es una función pura** `(opciones) => string` de HTML. No toca el DOM, así que sirve
  igual en el navegador, en un template del servidor o dentro de un componente de Vue o React.
- **Un runtime chico** (`mount()`) atiende tooltip, hover y leyendas con listeners delegados que leen
  atributos `data-sc-*`. Se llama una vez y cubre también lo que se pinta después.
- **Tema por variables CSS** (`--sc-*`): colores y rayado cambian sin volver a dibujar.

> Estado: 0.1.0, sin publicar. La API de esta página es la del prototipo aprobado; los cambios
> pendientes (tema, `locale`, `setHatch` en inglés, recorte fuera de escala, `max` automático)
> todavía no están.

## Uso

Con bundler:

```js
import '@storylabs/charts/charts.css'
import { mount, render, bullet } from '@storylabs/charts'

mount()
render(document.getElementById('latencia'), bullet({ label: 'Warm p50', value: 69, unit: 'ms', max: 500, reference: [0, 250] }))
```

Sin bundler, con el build IIFE que deja el global `StorylabsCharts`:

```html
<link rel="stylesheet" href="dist/charts.css">
<script src="dist/storylabs-charts.iife.js"></script>
<script>
  const SC = StorylabsCharts
  SC.mount()
  SC.render(document.getElementById('latencia'), SC.bullet({ label: 'Warm p50', value: 69, unit: 'ms', max: 500, reference: [0, 250] }))
</script>
```

En el servidor, el string va directo al template; `mount()` corre después en el cliente:

```js
import { line } from '@storylabs/charts/line'
const html = `<section>${line({ values: [10, 20, 15, 30], max: 40 })}</section>`
```

Cada gráfico se puede importar por separado (`@storylabs/charts/<gráfico>`). El runtime también:
`@storylabs/charts/runtime`.

## La gramática del rayado

| Relleno | Significa |
|---|---|
| **Sólido** | Lo que se midió. |
| **Rayado** (`hatched`) | Lo que NO es una medición: referencia, rango, proyección o falta de datos. |
| **Tinte** | La escala completa: el fondo de la barra. |

Un dato medido nunca va rayado.

## Colores

`hue` es el nombre de un token, no un color: `hue: 'blue'` usa `var(--sc-blue)`. Sólo se aceptan
letras, números, guion y guion bajo; cualquier otro valor cae en `neutral`.

| Tono | Rol |
|---|---|
| `blue`, `sky`, `violet`, `indigo` | Series. |
| `green`, `amber`, `orange` | Estado: en objetivo, aviso, fallo. Sólo para decir cómo está algo. |
| `neutral` | Sin datos. |

Un tono propio se agrega definiendo la variable: `--sc-marca: #ff0080` y `hue: 'marca'`.

## Opciones comunes

| Opción | Tipo | Nota |
|---|---|---|
| `hue`, `hue2` | tono | `hue2` es el segundo color del gradiente del rayado. |
| `label` | string | Nombre del gráfico o de la serie. En los SVG va a `aria-label`. |
| `headline` | `{ parts: [[valor, unidad], …], chip? }` | El número grande de arriba. |
| `hatched` | boolean | Marca una serie, tramo o porción como «no medido». |
| `hidden` | string[] | Claves apagadas. Sólo en `pie`, `stacked` y `stackedLine`, que se redibujan. |

`unit` hoy significa dos cosas: un string (`'ms'`, `'%'`) en `bullet`, `line`, `stackedLine` y
`range`, y un par `[singular, plural]` (`['ping', 'pings']`) en `columns`, `stacked`, `pie` y `heatmap`.

Todo texto que viene de los datos se escapa.

## Gráficos

### `bullet(o)` — valor contra su rango de referencia

| Opción | Tipo | Default |
|---|---|---|
| `label` | string | requerido |
| `value` | number | requerido |
| `max` | number | requerido; la escala va de 0 a `max` |
| `reference` | `[a, b]` | requerido; la banda rayada |
| `unit` | string | `''` |
| `side` | string | texto a la derecha |
| `hue`, `hue2` | tono | `'blue'`, igual a `hue` |
| `key` | string | `label` |

Si `value` cae fuera de `reference`, agrega el chip «fuera de rango». Varios bullets dentro de
`<div class="sc-group">` comparten el hover.

```js
bullet({ label: 'Cold rate 24h', value: 11.7, unit: '%', max: 30, reference: [0, 2], side: '17 en 24 h', hue: 'sky', hue2: 'violet' })
```

### `rings(o)` — anillos concéntricos

`{ center?: { value, label }, rings: [{ key, label, value, max = 100, hue }] }`

```js
rings({ center: { value: 84, label: 'score' }, rings: [{ key: 'availability', label: 'Availability', value: 96, hue: 'blue' }, { key: 'latency', label: 'Latency', value: 82, hue: 'sky' }] })
```

### `segmented(o)` — una barra partida

`{ segments: [{ key, label, value, detail?, hue, hatched? }] }`. Al apagar un tramo desde la
leyenda, los demás se reparten el lugar.

```js
segmented({ segments: [{ key: 'warm', label: 'Warm', value: 84, detail: '20 h 10 min', hue: 'blue' }, { key: 'none', label: 'Sin datos', value: 3, hue: 'neutral', hatched: true }] })
```

### `ribbon(o)` — estados en el tiempo

| Opción | Tipo | Nota |
|---|---|---|
| `states` | `{ [clave]: { label, hue, lane, hatched? } }` | `lane` es el carril, 0 arriba. |
| `rest` | clave | El estado de reposo. |
| `domain` | `[desde, hasta]` | Default `[0, 24]`. Hoy asume horas. |
| `segments` | `[[desde, hasta, clave], …]` | Contiguos y en orden. |
| `ticks` | `[{ at, label, sub? }]` | |
| `label`, `headline` | | |

Los tramos medidos seguidos son una sola forma continua; un tramo `hatched` la corta y se dibuja aparte.

```js
ribbon({ rest: 'warm', states: { warm: { label: 'Warm', hue: 'blue', lane: 1 }, cold: { label: 'Cold start', hue: 'sky', lane: 0 } }, segments: [[0, 2.2, 'warm'], [2.2, 2.9, 'cold'], [2.9, 24, 'warm']] })
```

### `line(o)` — una serie con banda, umbral, buffer y cursor

| Opción | Tipo | Default |
|---|---|---|
| `values` | number[] | requerido |
| `max` | number | requerido |
| `labels` | string[] | rótulo de cada punto para el tooltip |
| `yTicks` | number[] | `[0, max]` |
| `xLabels` | `[primero, último]` | |
| `band` | `[lo, hi]` | rango normal, rayado |
| `threshold` | `{ value, label? }` | línea punteada; sobre ella la serie pasa a `alertHue` |
| `buffer` | boolean | el último tramo va punteado y rayado |
| `bufferLabel` | string | `'En curso'` |
| `hue`, `hue2`, `alertHue` | tono | `'blue'`, `'sky'`, `'amber'` |
| `maxPoints` | number | `600`; con más puntos se submuestrea por mínimo y máximo |
| `unit`, `label`, `headline` | | |

```js
line({ values, labels, unit: 'ms', max: 300, yTicks: [0, 100, 200, 300], band: [40, 120], threshold: { value: 218 }, buffer: true })
```

### `stackedLine(o)` — líneas apiladas

`{ series: [{ key, label, hue, values }], labels?, xTicks: [{ at, label }], max, yTicks, unit,
totalLabel = 'Total', buffer?, bufferLabel?, wide?, hidden?, maxPoints = wide ? 1000 : 600, headline? }`

La primera serie va abajo. `wide` usa un viewBox de 1100. Al apagar una serie desde la leyenda,
el gráfico se redibuja.

```js
stackedLine({ max: 160, unit: 'ms', totalLabel: 'TTFB', series: [{ key: 'shared', label: 'Shared path', hue: 'blue', values: shared }, { key: 'own', label: 'Aporte propio', hue: 'violet', values: own }] })
```

### `columns(o)` — columnas

`{ data: [{ label, title?, value, projected? }], variant = 'solid', max, yTicks, unit: [sing, plural], hue = 'sky' }`

`variant`: `solid` | `stripped` | `gradient` | `duotone` | `hatched`. Una columna con `projected`
es el período en curso y siempre va rayada.

```js
columns({ variant: 'stripped', max: 6, unit: ['cold start', 'cold starts'], data: [{ label: '25', value: 2 }, { label: '26', value: 1, projected: 2 }] })
```

### `stacked(o)` — barras apiladas

`{ series: [{ key, label, hue, hatched? }], data: [{ label, title?, current?, values: { clave: n } }],
variant = 'line', max, yTicks, height = 190, unit, hidden? }`

`variant`: `line` | `solid` | `blend`. Se redibuja al apagar una serie.

```js
stacked({ max: 144, unit: ['ping', 'pings'], series: [{ key: 'warm', label: 'Warm', hue: 'blue' }, { key: 'none', label: 'Sin pings', hue: 'neutral', hatched: true }], data: [{ label: 'lun', values: { warm: 131, none: 0 } }] })
```

### `pie(o)` — pie o donut

`{ slices: [{ key, label, value, hue, hatched? }], variant = 'pie', fill = 'line', center?, unit, hidden? }`

`variant`: `pie` | `donut`. `fill`: `line` | `solid`. Se redibuja al apagar una porción.

```js
pie({ variant: 'donut', unit: ['ping', 'pings'], center: { value: 144, label: 'pings' }, slices: [{ key: 'warm', label: 'Warm', value: 102, hue: 'blue' }, { key: 'none', label: 'Pendientes', value: 27, hue: 'neutral', hatched: true }] })
```

### `heatmap(o)` — mapa de calor

`{ rows: string[], values: (number | string)[][], steps = 3, unit, emptyLabel = 'Sin datos', colTicks, hue = 'sky' }`

Un string en lugar de un número es una celda sin datos, y el string dice por qué. Hoy asume que las
columnas son horas.

```js
heatmap({ rows: ['lun', 'mar'], values: [[0, 1, 3], [2, 'La API estaba pausada', 0]], unit: ['cold start', 'cold starts'] })
```

### `range(o)` — rango por fila

`{ rows: [{ label, from, to }], max, ticks, unit, hue, hue2 }`

```js
range({ unit: 'ms', max: 400, ticks: [0, 200, 400], rows: [{ label: 'checkout-api', from: 68, to: 257 }] })
```

### `state(o)` y `legend(items, clickable = true)`

`state({ kind: 'empty' | 'error', title, detail? })` es el estado vacío o de error. El de carga no
es una función: es la clase `sc-loading` en cualquier ancestro.

`legend([{ key?, label, hue?, color?, hatched?, off? }], clickable)` devuelve una leyenda; los ítems
con `key` son botones si `clickable`. `color` es un color CSS libre (sin `url(`).

## Runtime

| Función | Qué hace |
|---|---|
| `mount()` | Registra los listeners delegados y crea el tooltip. Idempotente. |
| `render(el, html)` | `el.innerHTML = html` sólo si cambió. Devuelve `true` si pintó. |
| `play(el, espera = 900)` | Skeleton (`sc-loading`) y después la entrada animada (`sc-play`). |
| `setHatch({ look, density, opacity })` | Cambia el rayado de todo el documento. `look`: `ref` \| `diag` \| `vert`; `density`: `fina` \| `media` \| `gruesa`; `opacity`: `suave` \| `media` \| `fuerte`. Sin argumentos, reaplica el actual. |

Leyendas: en `rings`, `segmented`, `ribbon` y `line` una serie apagada se esconde (`sc-off`); en
`pie`, `stacked` y `stackedLine` el gráfico se redibuja.

## Desarrollo

```sh
bun install
bun run test           # funciones puras: canónicos, por gráfico, inyección, opciones, presupuesto
bun run test:browser   # runtime en Chrome real (Playwright, channel chrome)
bun run lint
bun run build          # dist/: ESM, IIFE y charts.css
bun run bench          # tiempos en Chrome headless; sale con error si se pasa un tope
bash scripts/mutantes.sh           # verificación por reversión de los tests de bun
bash scripts/mutantes-runtime.sh   # ídem, del runtime
```

La demo (`demo/index.html`) consume `src/` directo; servir el repo y abrir `/demo/`.

Presupuesto: JS + CSS minificados y con gzip, 18 000 bytes como máximo (Bun.gzipSync, nivel 9).
