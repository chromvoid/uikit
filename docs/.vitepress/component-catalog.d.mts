export type ComponentCatalogGroup = {
  id: string
  title: string
  description: string
  items: readonly ComponentCatalogGroupItem[]
}

export type ComponentCatalogGroupItem = {
  name: string
  slug: string
  spec: string
}

export type ComponentCatalogItem = ComponentCatalogGroupItem & {
  groupId: string
  groupTitle: string
}

export declare const componentGroups: readonly ComponentCatalogGroup[]
export declare const componentItems: readonly ComponentCatalogItem[]
export declare const componentCount: number
