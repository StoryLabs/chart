import { esc } from '../core/format.js'

export const state = o =>
  '<div class="sc-chart sc-state' + (o.kind === 'error' ? ' sc-error' : '') + '"><i class="sc-hfill"></i><b>' + esc(o.title) + '</b>' + (o.detail ? '<span>' + esc(o.detail) + '</span>' : '') + '</div>'
