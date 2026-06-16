export const componentGroups = [
  {
    id: 'foundations',
    title: 'Foundations',
    description: 'Theme primitives and structural surfaces that establish the ChromVoid visual language.',
    items: [
      {name: 'cv-theme-provider', slug: 'theme-provider', spec: 'theme'},
      {name: 'cv-badge', slug: 'badge', spec: 'badge'},
      {name: 'cv-callout', slug: 'callout', spec: 'callout'},
      {name: 'cv-card', slug: 'card', spec: 'card'},
      {name: 'cv-link', slug: 'link', spec: 'link'},
      {name: 'cv-landmark', slug: 'landmark', spec: 'landmark'},
    ],
  },
  {
    id: 'actions-feedback',
    title: 'Actions & Feedback',
    description: 'Primary actions, inline status, and asynchronous feedback surfaces for user flows.',
    items: [
      {name: 'cv-button', slug: 'button', spec: 'button'},
      {name: 'cv-copy-button', slug: 'copy-button', spec: 'copy-button'},
      {name: 'cv-alert', slug: 'alert', spec: 'alert'},
      {name: 'cv-toast', slug: 'toast', spec: 'toast'},
      {name: 'cv-progress', slug: 'progress', spec: 'progress'},
      {name: 'cv-progress-ring', slug: 'progress-ring', spec: 'progress-ring'},
      {name: 'cv-spinner', slug: 'spinner', spec: 'spinner'},
      {name: 'cv-meter', slug: 'meter', spec: 'meter'},
    ],
  },
  {
    id: 'inputs-selection',
    title: 'Inputs & Selection',
    description: 'Form controls, range inputs, and selection primitives with accessible keyboard behavior.',
    items: [
      {name: 'cv-input', slug: 'input', spec: 'input'},
      {name: 'cv-textarea', slug: 'textarea', spec: 'textarea'},
      {name: 'cv-number', slug: 'number', spec: 'number'},
      {name: 'cv-spinbutton', slug: 'spinbutton', spec: 'spinbutton'},
      {name: 'cv-checkbox', slug: 'checkbox', spec: 'checkbox'},
      {name: 'cv-radio', slug: 'radio', spec: 'radio'},
      {name: 'cv-switch', slug: 'switch', spec: 'switch'},
      {name: 'cv-select', slug: 'select', spec: 'select'},
      {name: 'cv-combobox', slug: 'combobox', spec: 'combobox'},
      {name: 'cv-listbox', slug: 'listbox', spec: 'listbox'},
      {name: 'cv-option', slug: 'option', spec: 'option'},
      {name: 'cv-date-picker', slug: 'date-picker', spec: 'date-picker'},
    ],
  },
  {
    id: 'navigation-disclosure',
    title: 'Navigation & Disclosure',
    description: 'Wayfinding, reveal patterns, and higher-level workspace navigation surfaces.',
    items: [
      {name: 'cv-accordion', slug: 'accordion', spec: 'accordion'},
      {name: 'cv-breadcrumb', slug: 'breadcrumb', spec: 'breadcrumb'},
      {name: 'cv-disclosure', slug: 'disclosure', spec: 'disclosure'},
      {name: 'cv-tabs', slug: 'tabs', spec: 'tabs'},
      {name: 'cv-sidebar', slug: 'sidebar', spec: 'sidebar'},
      {name: 'cv-drawer', slug: 'drawer', spec: 'drawer'},
    ],
  },
  {
    id: 'overlays-floating',
    title: 'Overlays & Floating UI',
    description: 'Contextual overlays, floating actions, and transient surfaces layered above the page.',
    items: [
      {name: 'cv-bottom-sheet', slug: 'bottom-sheet', spec: 'bottom-sheet'},
      {name: 'cv-dialog', slug: 'dialog', spec: 'dialog'},
      {name: 'cv-image-viewer', slug: 'image-viewer', spec: 'image-viewer'},
      {name: 'cv-guidance-anchor', slug: 'guidance-anchor', spec: 'guidance-anchor'},
      {name: 'cv-guidance-panel', slug: 'guidance-panel', spec: 'guidance-panel'},
      {name: 'cv-popover', slug: 'popover', spec: 'popover'},
      {name: 'cv-tooltip', slug: 'tooltip', spec: 'tooltip'},
      {name: 'cv-menu', slug: 'menu', spec: 'menu'},
      {name: 'cv-context-menu', slug: 'context-menu', spec: 'context-menu'},
    ],
  },
  {
    id: 'collections-workspaces',
    title: 'Collections & Workspaces',
    description: 'Composite data surfaces for lists, grids, navigation clusters, and responsive work areas.',
    items: [
      {name: 'cv-feed', slug: 'feed', spec: 'feed'},
      {name: 'cv-carousel', slug: 'carousel', spec: 'carousel'},
      {name: 'cv-grid', slug: 'grid', spec: 'grid'},
      {name: 'cv-table', slug: 'table', spec: 'table'},
      {name: 'cv-treegrid', slug: 'treegrid', spec: 'treegrid'},
      {name: 'cv-treeview', slug: 'treeview', spec: 'treeview'},
      {name: 'cv-toolbar', slug: 'toolbar', spec: 'toolbar'},
      {name: 'cv-window-splitter', slug: 'window-splitter', spec: 'window-splitter'},
    ],
  },
]

export const componentItems = componentGroups.flatMap((group) =>
  group.items.map((item) => ({
    ...item,
    groupId: group.id,
    groupTitle: group.title,
  })),
)

export const componentCount = componentItems.length
