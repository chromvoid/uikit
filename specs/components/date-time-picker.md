# cv-date-time-picker

Public alias for the existing `cv-date-picker` date-time behavior.

`cv-date-time-picker` intentionally subclasses/reuses `cv-date-picker`; it does not fork the date picker implementation. Use this tag when consumers need a clearer date-time name while preserving the existing `YYYY-MM-DDTHH:mm` contract.

## Anatomy

Same as [`cv-date-picker`](./date-picker.md).

## Attributes

Same as `cv-date-picker`.

## Slots

Same as `cv-date-picker`.

## CSS Parts

Same as `cv-date-picker`.

## Events

Same as `cv-date-picker`:

| Event       | Description                       |
| ----------- | --------------------------------- |
| `cv-input`  | User input text changed           |
| `cv-change` | Committed date-time value changed |

## Usage

```html
<cv-date-time-picker name="expires-at"></cv-date-time-picker>
```
