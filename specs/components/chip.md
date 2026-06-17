# cv-chip and cv-chip-group

Action, removable, and selectable chip primitives.

`cv-chip` renders one chip. `cv-chip-group` owns generic chip selection and roving focus state for a group of slotted chips.

## Anatomy

```
<cv-chip-group selection-mode="multiple">
  <cv-chip value="photos">Photos</cv-chip>
  <cv-chip value="docs" removable>Docs</cv-chip>
</cv-chip-group>
```

`cv-chip` shadow structure:

```
<cv-chip> (host)
└── <span part="base" role="button">
    ├── <span part="prefix">
    ├── <span part="label">
    ├── <span part="suffix">
    └── <button part="remove-button"> optional
```

## Attributes

### cv-chip

| Attribute   | Type    | Default     | Description                          |
| ----------- | ------- | ----------- | ------------------------------------ |
| `value`     | String  | `""`        | Value used by chip-group selection   |
| `selected`  | Boolean | `false`     | Selected state                       |
| `disabled`  | Boolean | `false`     | Blocks chip action and remove events |
| `removable` | Boolean | `false`     | Shows remove button                  |
| `variant`   | String  | `"neutral"` | Visual variant                       |
| `size`      | String  | `"medium"`  | `"small"`, `"medium"`, or `"large"`  |
| `pill`      | Boolean | `false`     | Fully rounded chip shape             |

### cv-chip-group

| Attribute        | Type    | Default        | Description                                         |
| ---------------- | ------- | -------------- | --------------------------------------------------- |
| `selection-mode` | String  | `"none"`       | `"none"`, `"single"`, or `"multiple"`               |
| `value`          | String  | `""`           | Single value or space-separated multiple values     |
| `orientation`    | String  | `"horizontal"` | `"horizontal"` or `"vertical"` roving key direction |
| `disabled`       | Boolean | `false`        | Disables group selection and child chip interaction |

## Slots

`cv-chip` slots:

| Slot        | Description      |
| ----------- | ---------------- |
| `(default)` | Chip label       |
| `prefix`    | Leading content  |
| `suffix`    | Trailing content |

`cv-chip-group` has one default slot for `cv-chip` children.

## CSS Parts

| Component       | Part            | Description            |
| --------------- | --------------- | ---------------------- |
| `cv-chip`       | `base`          | Action surface         |
| `cv-chip`       | `prefix`        | Prefix slot wrapper    |
| `cv-chip`       | `label`         | Default slot wrapper   |
| `cv-chip`       | `suffix`        | Suffix slot wrapper    |
| `cv-chip`       | `remove-button` | Remove action button   |
| `cv-chip-group` | `base`          | Group layout container |

## Events

| Event            | Detail                                             | Description                             |
| ---------------- | -------------------------------------------------- | --------------------------------------- |
| `cv-chip-action` | `{ value: string, source: "click" \| "keyboard" }` | Emitted by a chip activation            |
| `cv-chip-remove` | `{ value: string }`                                | Emitted by a chip remove button         |
| `cv-input`       | `{ value, changedValue, selected, source }`        | Emitted by group before/at user commit  |
| `cv-change`      | `{ value, changedValue, selected, source }`        | Emitted by group after selection commit |

`cv-chip-group` emits user events only from user interaction. Programmatic `value` updates sync selected chips without emitting events.

## Keyboard

| Key           | Behavior                                   |
| ------------- | ------------------------------------------ |
| `Enter`/Space | Activates the focused chip                 |
| Arrow keys    | Move roving focus according to orientation |
| `Home`/`End`  | Move focus to first or last chip           |

## Usage

```html
<cv-chip value="tag">Tag</cv-chip>

<cv-chip-group selection-mode="single" value="all">
  <cv-chip value="all">All</cv-chip>
  <cv-chip value="images">Images</cv-chip>
  <cv-chip value="videos">Videos</cv-chip>
</cv-chip-group>
```
