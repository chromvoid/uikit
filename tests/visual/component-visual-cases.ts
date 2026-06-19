import type {UikitVisualCase, UikitVisualExclusion} from './component-visual-types'
import {actionsFeedbackCases} from './cases/actions-feedback'
import {collectionsWorkspacesCases} from './cases/collections-workspaces'
import {foundationCases} from './cases/foundations'
import {inputsSelectionCases} from './cases/inputs-selection'
import {navigationDisclosureCases} from './cases/navigation-disclosure'
import {overlaysFloatingCases} from './cases/overlays-floating'

export const visualCases: readonly UikitVisualCase[] = [
  ...foundationCases,
  ...actionsFeedbackCases,
  ...inputsSelectionCases,
  ...navigationDisclosureCases,
  ...overlaysFloatingCases,
  ...collectionsWorkspacesCases,
]

export const visualExclusions: readonly UikitVisualExclusion[] = []

export const visualCaseById = new Map(visualCases.map((visualCase) => [visualCase.id, visualCase]))
