import type {UikitVisualCase} from '../component-visual-types'
import {setElementProps, visualCase} from './helpers'

export const inputsSelectionCases: readonly UikitVisualCase[] = [
  visualCase({
    id: 'cv-input/states',
    component: 'cv-input',
    title: 'Input sizes, variants, disabled, readonly, invalid, clearable, and password states',
    states: [
      'outlined',
      'filled',
      'small',
      'large',
      'disabled',
      'readonly',
      'invalid',
      'clearable',
      'password-toggle',
      'prefix',
      'suffix',
      'long-value',
    ],
    interaction: {focus: 'cv-input[data-visual-id="focus"]'},
    html: `
      <div class="visual-grid">
        <cv-input placeholder="Default input" value="Default value"></cv-input>
        <cv-input variant="filled" value="Filled variant"></cv-input>
        <cv-input size="small" value="Small"></cv-input>
        <cv-input size="large" value="Large"></cv-input>
        <cv-input disabled value="Disabled"></cv-input>
        <cv-input readonly value="Readonly"></cv-input>
        <cv-input invalid value="Invalid value"></cv-input>
        <cv-input clearable value="Clearable"></cv-input>
        <cv-input type="password" password-toggle value="secret-value"></cv-input>
        <cv-input value="chromvoid.app">
          <span slot="prefix">https://</span>
          <span slot="suffix">.onion</span>
        </cv-input>
        <cv-input data-visual-id="focus" class="visual-long-text" value="Focused long value with wrapping pressure"></cv-input>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-field/states',
    component: 'cv-field',
    title: 'Field label, description, error, required, disabled, invalid, and horizontal states',
    states: ['label', 'description', 'error', 'required', 'disabled', 'invalid', 'horizontal'],
    html: `
      <div class="visual-stack">
        <div class="visual-grid">
          <cv-field required>
            <span slot="label">Vault name</span>
            <cv-input value="Primary vault"></cv-input>
            <span slot="description">Visible helper copy stays below the control.</span>
          </cv-field>
          <cv-field invalid>
            <span slot="label">Recovery email</span>
            <cv-input invalid value="invalid@"></cv-input>
            <span slot="error">Enter a complete email address.</span>
          </cv-field>
        </div>
        <cv-field class="visual-wide-row" orientation="horizontal" disabled>
          <span slot="label">Disabled field</span>
          <cv-input disabled value="Disabled value"></cv-input>
          <span slot="description">Horizontal field layout.</span>
        </cv-field>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-fieldset/states',
    component: 'cv-fieldset',
    title: 'Fieldset legend, description, error, invalid, disabled, and horizontal states',
    states: ['legend', 'description', 'error', 'invalid', 'disabled', 'horizontal'],
    html: `
      <div class="visual-grid">
        <cv-fieldset invalid>
          <span slot="legend">Security options</span>
          <span slot="description">Choose one or more controls.</span>
          <cv-checkbox checked>Enable sync</cv-checkbox>
          <cv-checkbox indeterminate>Partial recovery</cv-checkbox>
          <span slot="error">At least one required option is incomplete.</span>
        </cv-fieldset>
        <cv-fieldset orientation="horizontal" disabled>
          <span slot="legend">Disabled group</span>
          <cv-switch disabled>Telemetry</cv-switch>
          <cv-switch disabled checked>Backups</cv-switch>
        </cv-fieldset>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-code-input/states',
    component: 'cv-code-input',
    title: 'Code input complete, masked, invalid, disabled, readonly, and different length states',
    states: ['complete', 'masked', 'invalid', 'disabled', 'readonly', 'length-4'],
    html: `
      <div class="visual-stack">
        <cv-code-input value="123456"></cv-code-input>
        <div class="visual-row">
          <cv-code-input length="4" value="19" invalid></cv-code-input>
          <cv-code-input value="123456" mask></cv-code-input>
          <cv-code-input value="654321" disabled></cv-code-input>
          <cv-code-input value="111222" readonly></cv-code-input>
        </div>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-textarea/basic',
    component: 'cv-textarea',
    title: 'Textarea default, filled, and size states',
    states: ['outlined', 'filled', 'small', 'large'],
    html: `
      <div class="visual-grid">
        <cv-textarea value="Default textarea content" rows="3"></cv-textarea>
        <cv-textarea variant="filled" value="Filled textarea content" rows="3"></cv-textarea>
        <cv-textarea size="small" value="Small textarea" rows="2"></cv-textarea>
        <cv-textarea size="large" value="Large textarea" rows="2"></cv-textarea>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-textarea/validation',
    component: 'cv-textarea',
    title: 'Textarea readonly, disabled, invalid, resize, and long content states',
    states: ['readonly', 'disabled', 'invalid', 'resize-none', 'long-content'],
    html: `
      <div class="visual-grid">
        <cv-textarea readonly value="Readonly textarea" rows="2"></cv-textarea>
        <cv-textarea disabled value="Disabled textarea" rows="2"></cv-textarea>
        <cv-textarea invalid resize="none" rows="4" value="Invalid textarea with a deliberately longer value that checks wrapping inside the control."></cv-textarea>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-number/states',
    component: 'cv-number',
    title: 'Number input variants, stepper, clearable, invalid, disabled, readonly, and size states',
    states: ['outlined', 'filled', 'stepper', 'clearable', 'invalid', 'disabled', 'readonly', 'small', 'large'],
    html: `
      <div class="visual-grid">
        <cv-number value="42" min="0" max="100"></cv-number>
        <cv-number variant="filled" value="64"></cv-number>
        <cv-number stepper value="12"></cv-number>
        <cv-number clearable value="7"></cv-number>
        <cv-number invalid value="1000" max="100"></cv-number>
        <cv-number disabled value="5"></cv-number>
        <cv-number read-only value="9"></cv-number>
        <cv-number size="small" value="1"></cv-number>
        <cv-number size="large" value="99"></cv-number>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-spinbutton/states',
    component: 'cv-spinbutton',
    title: 'Spinbutton value, min, max, disabled, readonly, and required states',
    states: ['value', 'bounded', 'disabled', 'readonly', 'required'],
    html: `
      <div class="visual-row">
        <cv-spinbutton aria-label="Quantity" value="4" min="0" max="10"></cv-spinbutton>
        <cv-spinbutton aria-label="Disabled quantity" disabled value="2"></cv-spinbutton>
        <cv-spinbutton aria-label="Readonly quantity" read-only value="8"></cv-spinbutton>
        <cv-spinbutton aria-label="Required quantity" required value="1"></cv-spinbutton>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-checkbox/states',
    component: 'cv-checkbox',
    title: 'Checkbox checked, unchecked, indeterminate, disabled, readonly, required, hover, and focus',
    states: ['unchecked', 'checked', 'indeterminate', 'disabled', 'readonly', 'required', 'hover', 'focus'],
    html: `
      <div class="visual-row">
        <cv-checkbox>Unchecked</cv-checkbox>
        <cv-checkbox checked>Checked</cv-checkbox>
        <cv-checkbox indeterminate>Indeterminate</cv-checkbox>
        <cv-checkbox disabled>Disabled</cv-checkbox>
        <cv-checkbox read-only checked>Readonly</cv-checkbox>
        <cv-checkbox required>Required</cv-checkbox>
        <cv-checkbox data-visual-state="focus">Focused</cv-checkbox>
        <cv-checkbox data-visual-state="hover">Hovered</cv-checkbox>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-radio/states',
    component: 'cv-radio',
    title: 'Radio checked, active, disabled, sizes, and segmented variant',
    states: ['unchecked', 'checked', 'active', 'disabled', 'small', 'large', 'segmented'],
    html: `
      <div class="visual-row">
        <cv-radio value="one">Unchecked</cv-radio>
        <cv-radio value="two" checked>Checked</cv-radio>
        <cv-radio value="three" active>Active</cv-radio>
        <cv-radio value="four" disabled>Disabled</cv-radio>
        <cv-radio value="small" size="small">Small</cv-radio>
        <cv-radio value="large" size="large">Large</cv-radio>
        <cv-radio value="segmented" variant="segmented" checked>Segmented</cv-radio>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-switch/states',
    component: 'cv-switch',
    title: 'Switch checked, unchecked, disabled, required, sizes, and help text',
    states: ['unchecked', 'checked', 'disabled', 'required', 'small', 'large', 'help-text'],
    html: `
      <div class="visual-row">
        <cv-switch>Unchecked</cv-switch>
        <cv-switch checked>Checked</cv-switch>
        <cv-switch disabled>Disabled</cv-switch>
        <cv-switch required>Required</cv-switch>
        <cv-switch size="small" checked>Small</cv-switch>
        <cv-switch size="large" checked help-text="Longer help text wraps below the label">Large with help</cv-switch>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-select/states',
    component: 'cv-select',
    title: 'Select closed, grouped, multiple, clearable, invalid, disabled, and sizes',
    states: ['closed', 'grouped', 'multiple', 'clearable', 'invalid', 'disabled', 'small', 'large'],
    html: `
      <div class="visual-stack">
        <div class="visual-grid">
          <cv-select value="personal" placeholder="Choose vault">
            <cv-select-option value="personal">Personal vault</cv-select-option>
            <cv-select-option value="work">Work vault</cv-select-option>
            <cv-select-option value="archive" disabled>Archive vault</cv-select-option>
          </cv-select>
          <cv-select selection-mode="multiple" clearable placeholder="Multiple select">
            <cv-select-option value="notes">Notes</cv-select-option>
            <cv-select-option value="files">Files</cv-select-option>
            <cv-select-option value="media">Media</cv-select-option>
          </cv-select>
          <cv-select invalid size="small" placeholder="Invalid select"></cv-select>
          <cv-select disabled size="large" value="disabled">
            <cv-select-option value="disabled">Disabled select</cv-select-option>
          </cv-select>
        </div>
      </div>
    `,
    afterMount(root) {
      setElementProps(root, 'cv-select[selection-mode="multiple"]', {
        selectedValues: ['notes', 'media'],
      })
    },
  }),
  visualCase({
    id: 'cv-select/open',
    component: 'cv-select',
    title: 'Select open grouped listbox state',
    states: ['open', 'grouped'],
    diagnosticsIgnoredSelectors: ['.visual-overlay-frame'],
    html: `
      <div class="visual-overlay-frame">
        <cv-select open value="sync" placeholder="Open select">
          <cv-select-group label="Actions">
            <cv-select-option value="sync">Sync now</cv-select-option>
            <cv-select-option value="export">Export</cv-select-option>
          </cv-select-group>
        </cv-select>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-combobox/closed',
    component: 'cv-combobox',
    title: 'Combobox editable, select-only, and clearable closed states',
    states: ['editable', 'select-only', 'clearable'],
    html: `
      <div class="visual-grid">
        <cv-combobox value="alpha" input-value="Alpha" clearable placeholder="Search entries">
          <cv-combobox-option value="alpha">Alpha</cv-combobox-option>
          <cv-combobox-option value="beta">Beta</cv-combobox-option>
          <cv-combobox-option value="gamma" disabled>Gamma disabled</cv-combobox-option>
        </cv-combobox>
        <cv-combobox type="select-only" value="work" placeholder="Select vault">
          <cv-combobox-option value="personal">Personal vault</cv-combobox-option>
          <cv-combobox-option value="work">Work vault</cv-combobox-option>
        </cv-combobox>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-combobox/open',
    component: 'cv-combobox',
    title: 'Combobox open grouped listbox state',
    states: ['open', 'grouped', 'select-only'],
    diagnosticsIgnoredSelectors: ['.visual-overlay-frame'],
    requiredSelectors: [
      'cv-combobox[data-visual-id="open"] [part="listbox"]',
      'cv-combobox[data-visual-id="open"] [part="group-label"]',
    ],
    html: `
      <div class="visual-overlay-frame visual-overlay-frame--wide">
        <cv-combobox data-visual-id="open" open type="select-only" value="work" placeholder="Open combobox">
          <cv-combobox-group label="Vaults">
            <cv-combobox-option value="personal">Personal vault</cv-combobox-option>
            <cv-combobox-option value="work">Work vault</cv-combobox-option>
          </cv-combobox-group>
        </cv-combobox>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-combobox/multiple',
    component: 'cv-combobox',
    title: 'Combobox multiple tags, clearable control, and overflow tag state',
    states: ['multiple', 'tags', 'clearable', 'tag-overflow'],
    requiredSelectors: ['cv-combobox[multiple] [part="tag"]', 'cv-combobox[multiple] [part="clear-button"]'],
    html: `
      <div class="visual-wide-row">
        <cv-combobox multiple clearable max-tags-visible="2" value="secret shared archive" placeholder="Tags">
          <cv-combobox-option value="secret">Secret</cv-combobox-option>
          <cv-combobox-option value="shared">Shared</cv-combobox-option>
          <cv-combobox-option value="archive">Archive</cv-combobox-option>
        </cv-combobox>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-combobox/invalid',
    component: 'cv-combobox',
    title: 'Combobox invalid typed value state',
    states: ['invalid', 'typed-value'],
    html: `
      <div class="visual-wide-row">
        <cv-combobox invalid input-value="Invalid value" placeholder="Invalid combobox">
          <cv-combobox-option value="valid">Valid</cv-combobox-option>
        </cv-combobox>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-listbox/states',
    component: 'cv-listbox',
    title: 'Listbox single, multiple, horizontal, grouped, selected, active, and disabled option states',
    states: ['single', 'multiple', 'horizontal', 'grouped', 'selected', 'active', 'disabled'],
    html: `
      <div class="visual-grid">
        <cv-listbox aria-label="Single listbox">
          <cv-option value="one" selected>One</cv-option>
          <cv-option value="two" active>Two active</cv-option>
          <cv-option value="three" disabled>Three disabled</cv-option>
        </cv-listbox>
        <cv-listbox selection-mode="multiple" aria-label="Multiple listbox">
          <cv-listbox-group label="Vaults">
            <cv-option value="notes" selected>Notes</cv-option>
            <cv-option value="files" selected>Files</cv-option>
            <cv-option value="media">Media</cv-option>
          </cv-listbox-group>
        </cv-listbox>
        <cv-listbox orientation="horizontal" aria-label="Horizontal listbox">
          <cv-option value="day" selected>Day</cv-option>
          <cv-option value="week">Week</cv-option>
          <cv-option value="month">Month</cv-option>
        </cv-listbox>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-option/states',
    component: 'cv-option',
    title: 'Standalone option selected, active, disabled, prefix, suffix, and long label states',
    states: ['default', 'selected', 'active', 'disabled', 'prefix', 'suffix', 'long-label'],
    html: `
      <div class="visual-stack">
        <cv-option value="default">Default option</cv-option>
        <cv-option value="selected" selected>Selected option</cv-option>
        <cv-option value="active" active>Active option</cv-option>
        <cv-option value="disabled" disabled>Disabled option</cv-option>
        <cv-option class="visual-long-text" value="rich">
          <span slot="prefix">#</span>
          Long option label that should wrap without clipping
          <cv-badge slot="suffix" variant="primary">New</cv-badge>
        </cv-option>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-date-picker/states',
    component: 'cv-date-picker',
    title: 'Date picker value, disabled, readonly, invalid, and size states',
    states: ['value', 'disabled', 'readonly', 'invalid', 'small', 'large'],
    html: `
      <div class="visual-grid">
        <cv-date-picker value="2026-06-18"></cv-date-picker>
        <cv-date-picker disabled value="2026-06-18"></cv-date-picker>
        <cv-date-picker readonly value="2026-06-18"></cv-date-picker>
        <cv-date-picker input-invalid value="not-a-date"></cv-date-picker>
        <cv-date-picker size="small" value="2026-01-04"></cv-date-picker>
        <cv-date-picker size="large" value="2026-12-24"></cv-date-picker>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-date-picker/open',
    component: 'cv-date-picker',
    title: 'Date picker open calendar dialog state',
    states: ['open', 'calendar-dialog'],
    diagnosticsIgnoredSelectors: ['cv-date-picker[data-visual-id="open"]'],
    requiredSelectors: [
      'cv-date-picker[data-visual-id="open"] [part="dialog"]',
      'cv-date-picker[data-visual-id="open"] [part="calendar-grid"]',
    ],
    html: `
      <div class="visual-overlay-frame visual-overlay-frame--wide visual-overlay-frame--tall">
        <cv-date-picker data-visual-id="open" open value="2026-06-18"></cv-date-picker>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-date-time-picker/states',
    component: 'cv-date-time-picker',
    title: 'Date-time picker value, 12h/24h, invalid, disabled, and size states',
    states: ['value', 'hour-cycle-12', 'hour-cycle-24', 'invalid', 'disabled', 'large'],
    html: `
      <div class="visual-grid">
        <cv-date-time-picker value="2026-06-18T14:30"></cv-date-time-picker>
        <cv-date-time-picker value="2026-06-18T14:30" hour-cycle="12"></cv-date-time-picker>
        <cv-date-time-picker input-invalid value="bad-date-time"></cv-date-time-picker>
        <cv-date-time-picker disabled value="2026-06-18T14:30"></cv-date-time-picker>
        <cv-date-time-picker size="large" value="2026-12-24T09:15"></cv-date-time-picker>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-date-time-picker/open',
    component: 'cv-date-time-picker',
    title: 'Date-time picker open dialog with time controls',
    states: ['open', 'calendar-dialog', 'time-inputs'],
    diagnosticsIgnoredSelectors: ['cv-date-time-picker[data-visual-id="open"]'],
    requiredSelectors: [
      'cv-date-time-picker[data-visual-id="open"] [part="dialog"]',
      'cv-date-time-picker[data-visual-id="open"] [part="calendar-grid"]',
      'cv-date-time-picker[data-visual-id="open"] [part="hour-input"]',
    ],
    html: `
      <div class="visual-overlay-frame visual-overlay-frame--wide visual-overlay-frame--tall">
        <cv-date-time-picker data-visual-id="open" open value="2026-06-18T14:30" hour-cycle="12"></cv-date-time-picker>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-time-picker/states',
    component: 'cv-time-picker',
    title: 'Time picker value, 12h/24h, invalid, disabled, readonly, minute step, and size states',
    states: ['value', 'hour-cycle-12', 'hour-cycle-24', 'invalid', 'disabled', 'readonly', 'minute-step', 'small', 'large'],
    html: `
      <div class="visual-grid">
        <cv-time-picker value="14:30"></cv-time-picker>
        <cv-time-picker value="09:15" hour-cycle="12"></cv-time-picker>
        <cv-time-picker input-invalid value="27:99"></cv-time-picker>
        <cv-time-picker disabled value="10:00"></cv-time-picker>
        <cv-time-picker readonly value="11:45"></cv-time-picker>
        <cv-time-picker minute-step="15" value="16:15"></cv-time-picker>
        <cv-time-picker size="small" value="08:00"></cv-time-picker>
        <cv-time-picker size="large" value="22:10"></cv-time-picker>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-chip/states',
    component: 'cv-chip',
    title: 'Chip variants, selected, removable, disabled, sizes, pill, and long label',
    states: ['neutral', 'primary', 'success', 'warning', 'danger', 'selected', 'removable', 'disabled', 'small', 'large', 'pill', 'long-label'],
    html: `
      <div class="visual-row">
        <cv-chip value="neutral">Neutral</cv-chip>
        <cv-chip value="primary" variant="primary" selected>Primary</cv-chip>
        <cv-chip value="success" variant="success">Success</cv-chip>
        <cv-chip value="warning" variant="warning">Warning</cv-chip>
        <cv-chip value="danger" variant="danger">Danger</cv-chip>
        <cv-chip value="remove" removable>Removable</cv-chip>
        <cv-chip value="disabled" disabled>Disabled</cv-chip>
        <cv-chip size="small" value="small">Small</cv-chip>
        <cv-chip size="large" value="large">Large</cv-chip>
        <cv-chip pill class="visual-long-text" value="long">Long chip label that wraps pressure</cv-chip>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-chip-group/states',
    component: 'cv-chip-group',
    title: 'Chip group single, multiple, vertical, disabled, selected, and removable child states',
    states: ['none', 'single', 'multiple', 'vertical', 'disabled', 'selected', 'removable'],
    html: `
      <div class="visual-grid">
        <cv-chip-group selection-mode="single" value="work">
          <cv-chip value="personal">Personal</cv-chip>
          <cv-chip value="work">Work</cv-chip>
          <cv-chip value="archive" disabled>Archive</cv-chip>
        </cv-chip-group>
        <cv-chip-group selection-mode="multiple" value="notes files">
          <cv-chip value="notes" removable>Notes</cv-chip>
          <cv-chip value="files">Files</cv-chip>
          <cv-chip value="media">Media</cv-chip>
        </cv-chip-group>
        <cv-chip-group orientation="vertical" disabled>
          <cv-chip value="one">Disabled one</cv-chip>
          <cv-chip value="two">Disabled two</cv-chip>
        </cv-chip-group>
      </div>
    `,
  }),
]
