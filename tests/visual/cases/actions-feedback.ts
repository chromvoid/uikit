import type {UikitVisualCase} from '../component-visual-types'
import {setElementProps, visualCase} from './helpers'

export const actionsFeedbackCases: readonly UikitVisualCase[] = [
  visualCase({
    id: 'cv-button/states',
    component: 'cv-button',
    title: 'Button variants, sizes, pressed, disabled, loading, hover, and focus',
    states: [
      'default',
      'primary',
      'danger',
      'ghost',
      'small',
      'large',
      'pressed',
      'disabled',
      'loading',
      'hover',
      'focus',
      'long-label',
    ],
    interaction: {
      focus: 'cv-button[data-visual-id="focus"]',
      hover: 'cv-button[data-visual-id="hover"]',
    },
    html: `
      <div class="visual-stack">
        <div class="visual-row">
          <cv-button>Default</cv-button>
          <cv-button variant="primary">Primary</cv-button>
          <cv-button variant="danger">Danger</cv-button>
          <cv-button variant="ghost">Ghost</cv-button>
        </div>
        <div class="visual-row">
          <cv-button size="small">Small</cv-button>
          <cv-button size="large">Large</cv-button>
          <cv-button toggle pressed>Pressed</cv-button>
          <cv-button disabled>Disabled</cv-button>
          <cv-button loading>Loading</cv-button>
        </div>
        <div class="visual-row">
          <cv-button data-visual-id="focus">Focused</cv-button>
          <cv-button data-visual-id="hover">Hovered</cv-button>
        </div>
        <div class="visual-row">
          <cv-button class="visual-long-text">A long label that must not overflow the button shell</cv-button>
        </div>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-button-group/states',
    component: 'cv-button-group',
    title: 'Button group attached, vertical, and mixed child states',
    states: ['attached', 'vertical', 'small', 'disabled-child'],
    html: `
      <div class="visual-row">
        <cv-button-group attached aria-label="Attached actions">
          <cv-button variant="primary">One</cv-button>
          <cv-button>Two</cv-button>
          <cv-button disabled>Three</cv-button>
        </cv-button-group>
        <cv-button-group orientation="vertical" size="small" aria-label="Vertical actions">
          <cv-button size="small">Top</cv-button>
          <cv-button size="small">Middle</cv-button>
          <cv-button size="small">Bottom</cv-button>
        </cv-button-group>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-copy-button/states',
    component: 'cv-copy-button',
    title: 'Copy button default, plain, sizes, disabled, and long value states',
    states: ['default', 'plain', 'small', 'large', 'disabled', 'long-value'],
    html: `
      <div class="visual-row">
        <cv-copy-button value="vault-key"></cv-copy-button>
        <cv-copy-button appearance="plain" value="plain-copy"></cv-copy-button>
        <cv-copy-button size="small" value="small"></cv-copy-button>
        <cv-copy-button size="large" value="large"></cv-copy-button>
        <cv-copy-button disabled value="disabled"></cv-copy-button>
        <cv-copy-button value="long-copy-value-for-layout-validation"></cv-copy-button>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-alert/visible',
    component: 'cv-alert',
    title: 'Alert visible message and polite live region',
    states: ['visible', 'assertive', 'polite', 'long-message'],
    html: `
      <div class="visual-grid">
        <cv-alert data-visual-id="assertive"></cv-alert>
        <cv-alert data-visual-id="polite" aria-live="polite"></cv-alert>
      </div>
    `,
    afterMount(root) {
      const assertive = root.querySelector('cv-alert[data-visual-id="assertive"]') as {
        show: (message: string) => void
      } | null
      const polite = root.querySelector('cv-alert[data-visual-id="polite"]') as {
        show: (message: string) => void
      } | null
      assertive?.show('Assertive alert with a visible message.')
      polite?.show('Polite alert with a longer message that checks wrapping and spacing.')
    },
  }),
  visualCase({
    id: 'cv-toast/states',
    component: 'cv-toast',
    title: 'Toast levels, progress, paused, closable, and actions',
    states: ['info', 'success', 'warning', 'error', 'loading', 'progress', 'paused', 'actions'],
    html: `
      <div class="visual-grid">
        <cv-toast level="info" title="Info" message="Informational toast message."></cv-toast>
        <cv-toast level="success" title="Saved" message="The vault item was saved." progress paused></cv-toast>
        <cv-toast level="warning" title="Review" message="Check the pending sync result."></cv-toast>
        <cv-toast level="error" title="Failed" message="The export could not be completed."></cv-toast>
        <cv-toast data-visual-id="actions" level="loading" title="Uploading" message="Uploading encrypted attachment."></cv-toast>
      </div>
    `,
    afterMount(root) {
      setElementProps(root, 'cv-toast[data-visual-id="actions"]', {
        actions: [
          {label: 'Cancel', value: 'cancel'},
          {label: 'Details', value: 'details'},
        ],
      })
    },
  }),
  visualCase({
    id: 'cv-empty-state/states',
    component: 'cv-empty-state',
    title: 'Empty state panel, dropzone variant, actions, and long copy',
    states: ['panel', 'dropzone', 'actions', 'long-content'],
    html: `
      <div class="visual-grid">
        <cv-empty-state
          icon="search"
          headline="No matching entries"
          description="Try another query or clear filters to show all entries."
        >
          <cv-button slot="actions" size="small" variant="primary">Clear filters</cv-button>
        </cv-empty-state>
        <cv-empty-state
          variant="dropzone"
          icon="upload"
          headline="Drop encrypted files here"
          description="This longer empty-state copy validates wrapping inside the centered layout."
        ></cv-empty-state>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-skeleton/states',
    component: 'cv-skeleton',
    title: 'Skeleton text, block, circle, and animation states',
    states: ['text', 'block', 'circle', 'animated'],
    html: `
      <div class="visual-stack">
        <cv-skeleton variant="text"></cv-skeleton>
        <cv-skeleton variant="text"></cv-skeleton>
        <div class="visual-row">
          <cv-skeleton variant="circle"></cv-skeleton>
          <cv-skeleton variant="block"></cv-skeleton>
        </div>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-progress/states',
    component: 'cv-progress',
    title: 'Progress determinate, indeterminate, and tone states',
    states: ['determinate', 'indeterminate', 'success', 'warning', 'danger', 'label'],
    html: `
      <div class="visual-stack visual-wide-control">
        <cv-progress aria-label="Upload" value="45" value-text="45%">45%</cv-progress>
        <cv-progress tone="success" value="82"></cv-progress>
        <cv-progress tone="warning" value="64"></cv-progress>
        <cv-progress tone="danger" value="28"></cv-progress>
        <cv-progress indeterminate aria-label="Loading"></cv-progress>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-progress-ring/states',
    component: 'cv-progress-ring',
    title: 'Progress ring determinate and indeterminate states',
    states: ['determinate', 'indeterminate', 'label'],
    html: `
      <div class="visual-row">
        <cv-progress-ring value="68" value-text="68%">68%</cv-progress-ring>
        <cv-progress-ring value="24" value-text="24%">24%</cv-progress-ring>
        <cv-progress-ring indeterminate aria-label="Loading ring"></cv-progress-ring>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-spinner/states',
    component: 'cv-spinner',
    title: 'Spinner sizes and labelled state',
    states: ['default', 'small-context', 'large-context', 'labelled'],
    html: `
      <div class="visual-row">
        <span><cv-spinner label="Loading small"></cv-spinner></span>
        <cv-button loading>Button loading</cv-button>
        <span class="visual-demo-box"><cv-spinner label="Loading large"></cv-spinner></span>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-meter/states',
    component: 'cv-meter',
    title: 'Meter low, normal, high, and optimum ranges',
    states: ['low', 'normal', 'high', 'optimum'],
    html: `
      <div class="visual-stack visual-wide-control">
        <cv-meter aria-label="Storage low" value="24" low="30" high="80" optimum="60"></cv-meter>
        <cv-meter aria-label="Storage normal" value="58" low="30" high="80" optimum="60"></cv-meter>
        <cv-meter aria-label="Storage high" value="88" low="30" high="80" optimum="60"></cv-meter>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-status-indicator/states',
    component: 'cv-status-indicator',
    title: 'Status indicator tones, sizes, pulse, and decorative states',
    states: ['neutral', 'primary', 'info', 'success', 'warning', 'danger', 'small', 'large', 'pulse'],
    html: `
      <div class="visual-row">
        <cv-status-indicator tone="neutral">Neutral</cv-status-indicator>
        <cv-status-indicator tone="primary">Primary</cv-status-indicator>
        <cv-status-indicator tone="info">Info</cv-status-indicator>
        <cv-status-indicator tone="success" pulse>Success</cv-status-indicator>
        <cv-status-indicator tone="warning" size="small">Warning</cv-status-indicator>
        <cv-status-indicator tone="danger" size="large">Danger</cv-status-indicator>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-status-pill/states',
    component: 'cv-status-pill',
    title: 'Status pill tones, sizes, pulse, and long label states',
    states: ['neutral', 'primary', 'success', 'warning', 'danger', 'small', 'large', 'pulse', 'long-label'],
    html: `
      <div class="visual-row">
        <cv-status-pill tone="neutral">Neutral</cv-status-pill>
        <cv-status-pill tone="primary">Primary</cv-status-pill>
        <cv-status-pill tone="success" pulse>Synced</cv-status-pill>
        <cv-status-pill tone="warning" size="small">Queued</cv-status-pill>
        <cv-status-pill tone="danger" size="large">Blocked</cv-status-pill>
        <cv-status-pill class="visual-long-text" tone="info">Long status pill label that wraps pressure</cv-status-pill>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-kbd/states',
    component: 'cv-kbd',
    title: 'Keyboard token sizes and tones',
    states: ['small', 'medium', 'large', 'strong'],
    html: `
      <div class="visual-row">
        <cv-kbd size="small">Esc</cv-kbd>
        <cv-kbd>Enter</cv-kbd>
        <cv-kbd size="large">⌘</cv-kbd>
        <cv-kbd tone="strong">K</cv-kbd>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-shortcut/states',
    component: 'cv-shortcut',
    title: 'Shortcut parsed label and JS keys state',
    states: ['parsed-label', 'custom-separator', 'keys-property'],
    html: `
      <div class="visual-row">
        <cv-shortcut label="Ctrl+K"></cv-shortcut>
        <cv-shortcut label="Shift / Enter" separator="/"></cv-shortcut>
        <cv-shortcut data-visual-id="keys"></cv-shortcut>
      </div>
    `,
    afterMount(root) {
      setElementProps(root, 'cv-shortcut[data-visual-id="keys"]', {
        keys: ['⌘', 'Shift', 'P'],
        ariaLabel: 'Command Shift P',
      })
    },
  }),
  visualCase({
    id: 'cv-dropzone/states',
    component: 'cv-dropzone',
    title: 'Dropzone idle, active, loading, and disabled states',
    states: ['idle', 'active', 'loading', 'disabled', 'long-message'],
    html: `
      <div class="visual-grid">
        <cv-dropzone message="Drop files to import">
          <cv-empty-state headline="Idle dropzone" description="Ready for files."></cv-empty-state>
        </cv-dropzone>
        <cv-dropzone active message="Release to upload">
          <cv-empty-state headline="Active dropzone" description="The overlay is visible."></cv-empty-state>
        </cv-dropzone>
        <cv-dropzone loading loading-label="Encrypting files">
          <cv-empty-state headline="Loading dropzone" description="Loading overlay is visible."></cv-empty-state>
        </cv-dropzone>
        <cv-dropzone disabled message="Disabled dropzone">
          <cv-empty-state headline="Disabled dropzone" description="Disabled state remains readable."></cv-empty-state>
        </cv-dropzone>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-task-list/states',
    component: 'cv-task-list',
    title: 'Task list comfortable, compact, busy, and empty states',
    states: ['comfortable', 'compact', 'busy', 'empty', 'footer'],
    html: `
      <div class="visual-grid">
        <cv-task-list label="Tasks">
          <strong slot="header">Import tasks</strong>
          <div class="visual-list-row" role="listitem"><span>Validate archive</span><cv-badge variant="success">Done</cv-badge></div>
          <div class="visual-list-row" role="listitem"><span>Encrypt payload</span><cv-badge variant="primary">Running</cv-badge></div>
          <span slot="footer">2 of 4 complete</span>
        </cv-task-list>
        <cv-task-list label="Compact tasks" density="compact" busy>
          <strong slot="header">Compact queue</strong>
          <div class="visual-list-row" role="listitem"><span>Upload chunk</span><cv-badge>Queued</cv-badge></div>
        </cv-task-list>
        <cv-task-list label="Empty tasks" empty>
          <span slot="empty">No pending tasks.</span>
        </cv-task-list>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-operation-queue/states',
    component: 'cv-operation-queue',
    title: 'Operation queue tones, busy, compact, actions, and empty states',
    states: ['summary', 'actions', 'busy', 'compact', 'success-tone', 'empty'],
    html: `
      <div class="visual-grid">
        <cv-operation-queue label="Operations" busy tone="primary">
          <cv-status-indicator slot="icon" tone="primary" pulse></cv-status-indicator>
          <span slot="summary">3 operations running</span>
          <cv-button slot="actions" size="small">Pause</cv-button>
          <div class="visual-list-row"><span>Sync metadata</span><cv-progress value="42"></cv-progress></div>
          <span slot="footer">Updated just now</span>
        </cv-operation-queue>
        <cv-operation-queue label="Finished" tone="success" density="compact">
          <span slot="summary">Completed operations</span>
          <div class="visual-list-row"><span>Export package</span><cv-badge variant="success">Done</cv-badge></div>
        </cv-operation-queue>
        <cv-operation-queue label="Empty queue" empty>
          <span slot="empty">No active operations.</span>
        </cv-operation-queue>
      </div>
    `,
  }),
]
