import {componentItems} from '../../docs/.vitepress/component-catalog.mjs'
import {visualCases, visualExclusions} from './component-visual-cases'

export const visualComponentMatrix = componentItems.map((item) => ({
  component: item.name,
  groupId: item.groupId,
  slug: item.slug,
  cases: visualCases.filter((visualCase) => visualCase.component === item.name),
  exclusion: visualExclusions.find((exclusion) => exclusion.component === item.name) ?? null,
}))
