# cv-date-picker

Date/date-time control with an editable combobox trigger and a popup calendar dialog. The default mode is `date-time`; `mode="date"` hides time controls and uses `YYYY-MM-DD` public values.

**Headless:** [`createDatePicker`](https://github.com/chromvoid/headless-ui/blob/main/specs/components/date-picker.md)

## Cross-Spec Consistency

This document is the UIKit surface contract for `cv-date-picker`.

- Headless `createDatePicker` is the source of truth for state, transitions, keyboard, and ARIA contracts.
- UIKit reflects headless state into DOM attributes and spreads contract props.
- UIKit adds only layout, styling, slots, and event adaptation.

## Anatomy

```
<cv-date-picker> (host)
└── <div part="base">
    ├── <div part="input-wrap">
    │   ├── <span part="prefix">
    │   │   └── <slot name="prefix">
    │   ├── <span part="label">
    │   │   └── <input part="input">
    │   ├── <span part="suffix">
    │   │   └── <slot name="suffix">
    │   └── <button part="clear-button">
    └── <div part="dialog" hidden>
        ├── <div part="calendar-shell">
        │   ├── <button part="year-nav-button" data-dir="prev">
        │   ├── <button part="month-nav-button" data-dir="prev">
        │   ├── <span part="month-label">
        │   ├── <button part="month-nav-button" data-dir="next">
        │   └── <button part="year-nav-button" data-dir="next">
        ├── <div part="calendar-grid">
        │   └── <button part="calendar-day"> ...42 cells from contracts.getVisibleDays()...</button>
        ├── <div part="time-row"> (date-time mode only)
        │   ├── <input part="hour-input" inputmode="numeric" maxlength="2">
        │   ├── <span part="time-separator">:</span>
        │   └── <input part="minute-input" inputmode="numeric" maxlength="2">
        ├── <div part="actions">
        │   ├── <button part="apply-button">
        │   └── <button part="cancel-button">
        └── <span part="dialog-caption">Apply/CANCEL + keyboard hints</span>
```

## Attributes

| Attribute         | Type                    | Default                  | Description                                                                                             |
| ----------------- | ----------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------- |
| `value`           | String                  | `""`                     | Current committed value: `YYYY-MM-DDTHH:mm` in date-time mode, `YYYY-MM-DD` in date mode                |
| `mode`            | `"date" \| "date-time"` | `"date-time"`            | Public value/display mode; unknown values normalize to `date-time`                                      |
| `open`            | Boolean                 | `false`                  | Popup dialog open state                                                                                 |
| `disabled`        | Boolean                 | `false`                  | Blocks all interaction                                                                                  |
| `readonly`        | Boolean                 | `false`                  | Input editing blocked; calendar/time actions blocked                                                    |
| `required`        | Boolean                 | `false`                  | Required marker for form/validation                                                                     |
| `placeholder`     | String                  | `"Select date and time"` | Placeholder shown in the input; default becomes `Select date` in date mode unless consumer overrides it |
| `size`            | String                  | `"medium"`               | Size: `small` \| `medium` \| `large`                                                                    |
| `locale`          | String                  | `"en-US"`                | Locale for formatting/parsing hook context                                                              |
| `time-zone`       | String                  | `"local"`                | Time basis: `local` \| `utc`                                                                            |
| `min`             | String                  | `""`                     | Minimum accepted value; date mode compares date portion, date-time mode compares full date-time         |
| `max`             | String                  | `""`                     | Maximum accepted value; date mode compares date portion, date-time mode compares full date-time         |
| `minute-step`     | Number                  | `1`                      | Minute granularity for draft editing in date-time mode                                                  |
| `hour-cycle`      | Number                  | `24`                     | Time input style in date-time mode: `12` \| `24`                                                        |
| `close-on-escape` | Boolean                 | `true`                   | Closes dialog on `Escape`                                                                               |
| `aria-label`      | String                  | `""`                     | Input and dialog accessible label                                                                       |
| `input-invalid`   | Boolean                 | `false`                  | Read-only derived state: input parse/validation failed                                                  |
| `has-value`       | Boolean                 | `false`                  | Read-only derived state: committed value present                                                        |

## Sizes

| Size     | `--cv-date-picker-input-min-height` | `--cv-date-picker-input-padding-inline` | `--cv-date-picker-input-padding-block` |
| -------- | ----------------------------------- | --------------------------------------- | -------------------------------------- |
| `small`  | `30px`                              | `var(--cv-space-2, 8px)`                | `var(--cv-space-1, 4px)`               |
| `medium` | `36px`                              | `var(--cv-space-3, 12px)`               | `var(--cv-space-2, 8px)`               |
| `large`  | `42px`                              | `var(--cv-space-4, 16px)`               | `var(--cv-space-2, 8px)`               |

## Slots

| Slot     | Description                  |
| -------- | ---------------------------- |
| `prefix` | Icon or element before input |
| `suffix` | Icon or element after input  |

## CSS Parts

| Part               | Element    | Description                                            |
| ------------------ | ---------- | ------------------------------------------------------ |
| `base`             | `<div>`    | Root layout wrapper                                    |
| `input-wrap`       | `<div>`    | Input + optional action row container                  |
| `prefix`           | `<span>`   | Prefix icon/element wrapper                            |
| `label`            | `<span>`   | Main text wrapper around the input value               |
| `cv-input`         | `<input>`  | Editable combobox input                                |
| `suffix`           | `<span>`   | Suffix icon/element wrapper                            |
| `clear-button`     | `<button>` | Clear committed value                                  |
| `dialog`           | `<div>`    | Popup shell for calendar/time panel                    |
| `calendar-shell`   | `<div>`    | Calendar header + grid wrapper                         |
| `month-label`      | `<span>`   | Visible month/year label                               |
| `month-nav-button` | `<button>` | Previous/next month navigation button                  |
| `year-nav-button`  | `<button>` | Previous/next year navigation button                   |
| `calendar-grid`    | `<div>`    | Calendar grid surface                                  |
| `calendar-day`     | `<button>` | Day cell for each visible calendar day                 |
| `time-row`         | `<div>`    | Time editing row, rendered only in date-time mode      |
| `hour-input`       | `<input>`  | Hour segment editor, rendered only in date-time mode   |
| `minute-input`     | `<input>`  | Minute segment editor, rendered only in date-time mode |
| `time-separator`   | `<span>`   | Time separator, rendered only in date-time mode        |
| `actions`          | `<div>`    | Footer actions area                                    |
| `apply-button`     | `<button>` | Commit draft selection                                 |
| `cancel-button`    | `<button>` | Discard draft selection                                |
| `dialog-caption`   | `<span>`   | Optional helper text/status label                      |

## CSS Custom Properties

| Property                                    | Default                          | Description                      |
| ------------------------------------------- | -------------------------------- | -------------------------------- |
| `--cv-date-picker-width`                    | `360px`                          | Host inline size                 |
| `--cv-date-picker-min-width`                | `260px`                          | Host minimum width               |
| `--cv-date-picker-input-min-height`         | `36px`                           | Input control minimum block size |
| `--cv-date-picker-input-padding-inline`     | `var(--cv-space-3, 12px)`        | Horizontal input padding         |
| `--cv-date-picker-input-padding-block`      | `var(--cv-space-2, 8px)`         | Vertical input padding           |
| `--cv-date-picker-dialog-width`             | `min(360px, calc(100vw - 32px))` | Dialog inline size               |
| `--cv-date-picker-calendar-size`            | `304px`                          | Calendar body block size         |
| `--cv-date-picker-day-size`                 | `40px`                           | Calendar cell block size         |
| `--cv-date-picker-day-gap`                  | `var(--cv-space-1, 4px)`         | Calendar grid gap                |
| `--cv-date-picker-font-size`                | `inherit`                        | Component font size              |
| `--cv-date-picker-border-radius`            | `var(--cv-radius-md, 10px)`      | Dialog/calendar border radius    |
| `--cv-date-picker-button-gap`               | `var(--cv-space-2, 8px)`         | Spacing between footer actions   |
| `--cv-date-picker-nav-button-size`          | `32px`                           | Month/year nav button size       |
| `--cv-date-picker-action-button-min-height` | `36px`                           | Apply/Cancel minimum height      |
| `--cv-date-picker-action-button-min-width`  | `72px`                           | Apply/Cancel minimum width       |
| `--cv-date-picker-time-input-width`         | `48px`                           | Hour/minute input width          |
| `--cv-date-picker-time-input-min-height`    | `36px`                           | Hour/minute input minimum height |
| `--cv-date-picker-clear-button-size`        | `28px`                           | Clear button size                |

Additionally, styles may rely on theme tokens (no separate listing required here if already defined globally):
`--cv-color-border`, `--cv-color-surface`, `--cv-color-text`, `--cv-color-text-muted`, `--cv-color-primary`, `--cv-color-danger`, `--cv-space-2`, `--cv-space-3`, `--cv-space-4`, `--cv-duration-fast`, `--cv-easing-standard`, `--cv-radius-sm`, `--cv-radius-md`.

## Visual States

| Host selector            | Description               |
| ------------------------ | ------------------------- |
| `:host([disabled])`      | Disabled, non-interactive |
| `:host([readonly])`      | Read-only input mode      |
| `:host([required])`      | Required marker active    |
| `:host([open])`          | Popup dialog visible      |
| `:host([size="small"])`  | Small size tokens used    |
| `:host([size="large"])`  | Large size tokens used    |
| `:host([input-invalid])` | Input value invalid state |
| `:host([has-value])`     | Committed value present   |

## ARIA Contract

| Element          | Attribute               | Value                                              |
| ---------------- | ----------------------- | -------------------------------------------------- |
| Input            | `role`                  | `combobox`                                         |
| Input            | `aria-haspopup`         | `dialog`                                           |
| Input            | `aria-expanded`         | `true` / `false`                                   |
| Input            | `aria-controls`         | Dialog id                                          |
| Input            | `aria-activedescendant` | Focused day id when dialog is open                 |
| Input            | `aria-invalid`          | `true` when input cannot be parsed or out of range |
| Input            | `aria-required`         | `true` when `required`                             |
| Input            | `aria-label`            | Provided `aria-label` string                       |
| Dialog           | `role`                  | `dialog`                                           |
| Dialog           | `aria-modal`            | `true`                                             |
| Dialog           | `aria-label`            | Provided `aria-label` or default text              |
| Calendar grid    | `role`                  | `grid`                                             |
| Calendar day     | `role`                  | `gridcell`                                         |
| Calendar day     | `tabindex`              | `0` / `-1`                                         |
| Calendar day     | `aria-selected`         | `true` / `false`                                   |
| Calendar day     | `aria-disabled`         | `true` when out of range / blocked                 |
| Calendar day     | `aria-current`          | `date` when current day                            |
| Month nav button | `role`                  | `button`                                           |
| Year nav button  | `role`                  | `button`                                           |
| Time inputs      | `type`                  | `text` in date-time mode                           |
| Time inputs      | `inputmode`             | `numeric` in date-time mode                        |
| Action buttons   | `role`                  | `button`                                           |

## Events

| Event       | Detail                                                                   | Description                                |
| ----------- | ------------------------------------------------------------------------ | ------------------------------------------ |
| `cv-input`  | `{ value: string, inputValue: string, open: boolean, invalid: boolean }` | Fires when the user changes the input text |
| `cv-change` | `{ value: string, previousValue: string, source: "input" \| "dialog" }`  | Fires when committed value changes         |

`cv-input` and `cv-change` are only emitted for user-modifiable state updates.

## Reactive State Mapping

`cv-date-picker` is a visual adapter over headless `createDatePicker`.

### UIKit properties to headless actions/options

| UIKit Property    | Direction          | Headless Binding                                               |
| ----------------- | ------------------ | -------------------------------------------------------------- |
| `value`           | attr → action      | `actions.setInputValue(value)` then `actions.commitInput()`    |
| `mode`            | attr → action      | `actions.setMode(normalizedMode)`                              |
| `open`            | attr → action      | `actions.open()` / `actions.close()`                           |
| `disabled`        | attr → action      | `actions.setDisabled(value)`                                   |
| `readonly`        | attr → action      | `actions.setReadonly(value)`                                   |
| `required`        | attr → action      | `actions.setRequired(value)`                                   |
| `placeholder`     | attr → action      | `actions.setPlaceholder(effectivePlaceholder)`                 |
| `locale`          | attr → action      | `actions.setLocale(value)`                                     |
| `time-zone`       | attr → action      | `actions.setTimeZone(value)`                                   |
| `min`             | attr → action      | `actions.setMin(value \|\| null)`                              |
| `max`             | attr → action      | `actions.setMax(value \|\| null)`                              |
| `minute-step`     | attr → action      | `actions.setMinuteStep(value)`                                 |
| `hour-cycle`      | attr → action      | `actions.setHourCycle(value as 12 \| 24)`                      |
| `close-on-escape` | attr → option      | Passed as `closeOnEscape` during `createDatePicker(...)` setup |
| `aria-label`      | attr → option      | Passed as `ariaLabel` during `createDatePicker(...)` setup     |
| `size`            | attr → DOM/styling | Local styling tokens only                                      |

### Headless state to DOM reflection

| Headless State                                                                                                | Direction      | DOM Reflection                                              |
| ------------------------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------- |
| `state.committedValue()`                                                                                      | state → attr   | `[value]` and input value text                              |
| `state.mode()`                                                                                                | state → attr   | `[mode]`; also controls time-row rendering                  |
| `state.isOpen()`                                                                                              | state → attr   | `[open]`                                                    |
| `state.disabled()`                                                                                            | state → attr   | `[disabled]`                                                |
| `state.readonly()`                                                                                            | state → attr   | `[readonly]`                                                |
| `state.required()`                                                                                            | state → attr   | `[required]`                                                |
| `state.hasCommittedSelection()`                                                                               | state → attr   | `[has-value]`                                               |
| `state.inputInvalid()`                                                                                        | state → attr   | `[input-invalid]`                                           |
| `state.min()`, `state.max()`, `state.locale()`, `state.timeZone()`, `state.hourCycle()`, `state.minuteStep()` | state → render | Applied to internal dialog/time controls and contract props |
| `state.visibleDays()`                                                                                         | state → render | Drives `[part="calendar-day"]` list                         |
| `state.focusedDate()`, `state.displayedMonth()`, `state.displayedYear()`                                      | state → render | Calendar focus/visible range rendering                      |

### Contract props spreading

- `contracts.getInputProps()` is spread onto `[part="input"]`, including input-click open behavior.
- `contracts.getDialogProps()` is spread onto `[part="dialog"]`.
- `contracts.getCalendarGridProps()` is spread onto `[part="calendar-grid"]`.
- `contracts.getMonthNavButtonProps()` and `contracts.getYearNavButtonProps()` are spread onto corresponding nav buttons.
- `contracts.getCalendarDayProps(date)` is spread onto each `[part="calendar-day"]`.
- `contracts.getHourInputProps()` / `contracts.getMinuteInputProps()` are spread onto `[part="hour-input"]` / `[part="minute-input"]` only in date-time mode.
- `contracts.getApplyButtonProps()` and `contracts.getCancelButtonProps()` are spread onto `[part="apply-button"]` / `[part="cancel-button"]`.
- `contracts.getClearButtonProps()` is spread onto `[part="clear-button"]`.
- `contracts.getVisibleDays()` provides the day matrix for rendering.

### UIKit-only concerns

UIKit owns rendering and animation only.

- Layout and spacing between input, calendar, and footer.
- Visual-only styling (`:host` states and CSS parts).
- Optional `dialog-caption` content text.

## Behavioral Contract

### Combobox + Dialog pattern

- Input opens/closes popup dialog with `ArrowDown`, `ArrowUp`, or `Space`.
- Input click opens the popup, including after `Apply` has closed a previous dialog.
- Dialog remains a separate popup surface bound via `aria-controls` / `aria-expanded`.
- Calendar selection updates draft state only while dialog is open.
- `Apply` commits draft, `Cancel` restores committed state.

### Mode behavior

- Missing or invalid `mode` defaults to `date-time`.
- `mode="date-time"` renders `[part="time-row"]`, hour/minute inputs, and emits `YYYY-MM-DDTHH:mm`.
- `mode="date"` hides `[part="time-row"]`, hour/minute inputs, and emits `YYYY-MM-DD`.
- In date mode, typed or external `YYYY-MM-DDTHH:mm` values normalize to `YYYY-MM-DD` at the public `value` boundary.
- In date mode, the default placeholder becomes `Select date` only when the consumer did not provide a custom placeholder.
- `Apply` / `Cancel` remain visible in both modes.

### Dual Commit (editable input + calendar)

- `commitInput()` and `commitDraft()` are the only ways to mutate committed value.
- Typing and `Enter` in closed state only affects input text until input commit succeeds.
- Calendar/time edits while open are isolated draft updates and are not committed until explicit `Apply`.
- `clear-button` clears committed value and input text via headless `clear()` action.

### Keyboard in open dialog

- `Escape` closes dialog (respecting `close-on-escape`).
- Calendar arrows/page keys use grid navigation as provided by headless contracts.
- `Enter`/`Space` on calendar day selects draft day.
- `Enter` in minute/hour inputs commits draft in date-time mode.

### Disabled / read-only

- `disabled` and `readonly` block all mutating actions and interactions.

## Usage

```html
<cv-date-picker
  mode="date"
  aria-label="Flight date"
  placeholder="Select departure date"
  min="2026-01-01"
  max="2026-12-31"
>
  <icon-calendar slot="prefix"></icon-calendar>
</cv-date-picker>

<cv-date-picker
  mode="date-time"
  aria-label="Flight date"
  placeholder="Select departure date and time"
  locale="en-US"
  minute-step="15"
  open
>
  <icon-calendar slot="prefix"></icon-calendar>
  <icon-clock slot="suffix"></icon-clock>
</cv-date-picker>

<cv-date-picker
  mode="date-time"
  time-zone="utc"
  hour-cycle="24"
  min="2026-01-01T00:00"
  max="2026-12-31T23:59"
  disabled
></cv-date-picker>

<cv-date-picker locale="ru-RU" size="large">
  <icon-schedule slot="suffix"></icon-schedule>
</cv-date-picker>
```
