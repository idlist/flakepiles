export interface Flake {
  createdAt: number
  modifiedAt: number
  theme: string
  name: string
  type: 'text' | 'image' | 'code'
  content: string
  labels: string[]
}

export interface FlakeLabel {
  name: string
  color: string
}

export interface FlakeTheme {
  name: string
  colorBg: string
  colorText: string
}

export interface Flakepile {
  flow: 'vertical' | 'horizontal'
  sorting: 'title' | 'createdAt' | 'modifiedAt'
  flakeWidth: number
  flakes: Flake[]
}

export const createFlakepile = (): Flakepile => {
  return {
    flow: 'vertical',
    sorting: 'title',
    flakeWidth: 1,
    flakes: [],
  }
}
