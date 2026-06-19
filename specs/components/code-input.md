# cv-code-input

Segmented short-code entry for PIN, OTP, pairing, and recovery codes.

**Headless:** [`createCodeInput`](https://github.com/chromvoid/headless-ui/blob/main/specs/components/code-input.md)

## Attributes

| Attribute      | Type     | Default       | Description                    |
| -------------- | -------- | ------------- | ------------------------------ | ---------------------- | ------------ | ---------------------- |
| `length`       | Number   | `6`           | Segment count                  |
| `value`        | String   | `""`          | Normalized code value          |
| `purpose`      | `pin     | otp           | pairing                        | recovery`              | `otp`        | Semantic input purpose |
| `charset`      | `numeric | alphanumeric` | `numeric`                      | Accepted character set |
| `mask`         | Boolean  | `false`       | Masks visible segment values   |
| `disabled`     | Boolean  | `false`       | Blocks interaction             |
| `readonly`     | Boolean  | `false`       | Blocks editing but keeps focus |
| `required`     | Boolean  | `false`       | Form validation required flag  |
| `autocomplete` | String   | purpose-based | Native autocomplete hint       |
| `name`         | String   | `""`          | Form name                      |
| `size`         | `small   | medium        | large`                         | `medium`               | Segment size |

## Events

| Event         | Detail                |
| ------------- | --------------------- |
| `cv-input`    | `{ value, complete }` |
| `cv-change`   | `{ value, complete }` |
| `cv-complete` | `{ value }`           |
| `cv-clear`    | `{}`                  |
| `cv-focus`    | `{ index }`           |
| `cv-blur`     | `{ index }`           |
