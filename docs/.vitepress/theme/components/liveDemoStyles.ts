const LIVE_DEMO_STYLE_URLS: Record<string, string> = {
  accordion: new URL('../live-demo-examples/accordion.css?direct', import.meta.url).href,
  alert: new URL('../live-demo-examples/alert.css?direct', import.meta.url).href,
  badge: new URL('../live-demo-examples/badge.css?direct', import.meta.url).href,
  base: new URL('../live-demo-examples/base.css?direct', import.meta.url).href,
  'bottom-sheet': new URL('../live-demo-examples/bottom-sheet.css?direct', import.meta.url).href,
  breadcrumb: new URL('../live-demo-examples/breadcrumb.css?direct', import.meta.url).href,
  button: new URL('../live-demo-examples/button.css?direct', import.meta.url).href,
  'button-group': new URL('../live-demo-examples/button-group.css?direct', import.meta.url).href,
  callout: new URL('../live-demo-examples/callout.css?direct', import.meta.url).href,
  card: new URL('../live-demo-examples/card.css?direct', import.meta.url).href,
  carousel: new URL('../live-demo-examples/carousel.css?direct', import.meta.url).href,
  checkbox: new URL('../live-demo-examples/checkbox.css?direct', import.meta.url).href,
  chip: new URL('../live-demo-examples/chip.css?direct', import.meta.url).href,
  'chip-group': new URL('../live-demo-examples/chip-group.css?direct', import.meta.url).href,
  'code-input': new URL('../live-demo-examples/code-input.css?direct', import.meta.url).href,
  combobox: new URL('../live-demo-examples/combobox.css?direct', import.meta.url).href,
  'context-menu': new URL('../live-demo-examples/context-menu.css?direct', import.meta.url).href,
  'copy-button': new URL('../live-demo-examples/copy-button.css?direct', import.meta.url).href,
  'date-picker': new URL('../live-demo-examples/date-picker.css?direct', import.meta.url).href,
  dialog: new URL('../live-demo-examples/dialog.css?direct', import.meta.url).href,
  drawer: new URL('../live-demo-examples/drawer.css?direct', import.meta.url).href,
  disclosure: new URL('../live-demo-examples/disclosure.css?direct', import.meta.url).href,
  dropzone: new URL('../live-demo-examples/dropzone.css?direct', import.meta.url).href,
  'empty-state': new URL('../live-demo-examples/empty-state.css?direct', import.meta.url).href,
  feed: new URL('../live-demo-examples/feed.css?direct', import.meta.url).href,
  field: new URL('../live-demo-examples/field.css?direct', import.meta.url).href,
  fieldset: new URL('../live-demo-examples/fieldset.css?direct', import.meta.url).href,
  grid: new URL('../live-demo-examples/grid.css?direct', import.meta.url).href,
  'guidance-anchor': new URL('../live-demo-examples/guidance-anchor.css?direct', import.meta.url).href,
  'guidance-panel': new URL('../live-demo-examples/guidance-panel.css?direct', import.meta.url).href,
  'image-viewer': new URL('../live-demo-examples/image-viewer.css?direct', import.meta.url).href,
  input: new URL('../live-demo-examples/input.css?direct', import.meta.url).href,
  kbd: new URL('../live-demo-examples/kbd.css?direct', import.meta.url).href,
  link: new URL('../live-demo-examples/link.css?direct', import.meta.url).href,
  listbox: new URL('../live-demo-examples/listbox.css?direct', import.meta.url).href,
  meter: new URL('../live-demo-examples/meter.css?direct', import.meta.url).href,
  menu: new URL('../live-demo-examples/menu.css?direct', import.meta.url).href,
  number: new URL('../live-demo-examples/number.css?direct', import.meta.url).href,
  option: new URL('../live-demo-examples/option.css?direct', import.meta.url).href,
  'operation-queue': new URL('../live-demo-examples/operation-queue.css?direct', import.meta.url).href,
  pagination: new URL('../live-demo-examples/pagination.css?direct', import.meta.url).href,
  popover: new URL('../live-demo-examples/popover.css?direct', import.meta.url).href,
  progress: new URL('../live-demo-examples/progress.css?direct', import.meta.url).href,
  'progress-ring': new URL('../live-demo-examples/progress-ring.css?direct', import.meta.url).href,
  'qr-code': new URL('../live-demo-examples/qr-code.css?direct', import.meta.url).href,
  'radio-group': new URL('../live-demo-examples/radio-group.css?direct', import.meta.url).href,
  select: new URL('../live-demo-examples/select.css?direct', import.meta.url).href,
  shortcut: new URL('../live-demo-examples/shortcut.css?direct', import.meta.url).href,
  sidebar: new URL('../live-demo-examples/sidebar.css?direct', import.meta.url).href,
  skeleton: new URL('../live-demo-examples/skeleton.css?direct', import.meta.url).href,
  spinner: new URL('../live-demo-examples/spinner.css?direct', import.meta.url).href,
  'status-indicator': new URL('../live-demo-examples/status-indicator.css?direct', import.meta.url).href,
  steps: new URL('../live-demo-examples/steps.css?direct', import.meta.url).href,
  switch: new URL('../live-demo-examples/switch.css?direct', import.meta.url).href,
  table: new URL('../live-demo-examples/table.css?direct', import.meta.url).href,
  tabs: new URL('../live-demo-examples/tabs.css?direct', import.meta.url).href,
  'task-list': new URL('../live-demo-examples/task-list.css?direct', import.meta.url).href,
  textarea: new URL('../live-demo-examples/textarea.css?direct', import.meta.url).href,
  'theme-provider': new URL('../live-demo-examples/theme-provider.css?direct', import.meta.url).href,
  'time-picker': new URL('../live-demo-examples/time-picker.css?direct', import.meta.url).href,
  toast: new URL('../live-demo-examples/toast.css?direct', import.meta.url).href,
  toolbar: new URL('../live-demo-examples/toolbar.css?direct', import.meta.url).href,
  tooltip: new URL('../live-demo-examples/tooltip.css?direct', import.meta.url).href,
  treegrid: new URL('../live-demo-examples/treegrid.css?direct', import.meta.url).href,
  treeview: new URL('../live-demo-examples/treeview.css?direct', import.meta.url).href,
  'window-splitter': new URL('../live-demo-examples/window-splitter.css?direct', import.meta.url).href,
}

const styleCache = new Map<string, Promise<string>>()

function warnMissingStyleChunk(key: string): void {
  if (!import.meta.env.DEV) return

  console.warn(`No live demo CSS chunk found for data-demo="${key}".`)
}

async function loadStyleChunk(key: string): Promise<string> {
  const cached = styleCache.get(key)
  if (cached) return cached

  const url = LIVE_DEMO_STYLE_URLS[key]
  if (!url) {
    warnMissingStyleChunk(key)
    return ''
  }

  const promise = fetch(url).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Failed to load live demo CSS chunk "${key}": ${response.status}`)
    }

    return response.text()
  })
  styleCache.set(key, promise)
  return promise
}

export async function loadLiveDemoCss(keys: readonly string[]): Promise<string> {
  const chunks = await Promise.all(keys.map((key) => loadStyleChunk(key)))

  return chunks.filter(Boolean).join('\n\n')
}
