import { moment } from 'obsidian'
import { nanoid } from 'nanoid'

export type FlakeType = 'text' | 'image' | 'code'

export interface Flake {
  id: string
  createdAt: number
  modifiedAt: number
  theme: string
  name: string
  type: FlakeType
  content: string
  /** When `type` is `image`, hide title bar. */
  imageOnly: boolean
  /** When `type` is `code`, the highlight of the code  */
  codeLang: string
  codeWrap: boolean
  labels: string[]
}

export const createFlake = (): Flake => {
  return {
    id: nanoid(16),
    createdAt: moment.now(),
    modifiedAt: moment.now(),
    theme: 'default',
    name: 'New Flake',
    type: 'text',
    content: '',
    imageOnly: false,
    codeLang: '',
    codeWrap: false,
    labels: [],
  }
}

export interface FlakeLabel {
  id: string
  name: string
  color: string
}

export interface FlakeTheme {
  name: string
  colorBg: string
  colorText: string
}

export type PileFlow = 'vertical' | 'horizontal'

export type PileAdaptiveFlow = PileFlow | 'mobile'

export interface Flakepile {
  id: string
  flow: PileFlow
  sortBy: 'name' | 'createdAt' | 'modifiedAt'
  sortOrder: 'asc' | 'desc'
  width: number
  elasticWidth: boolean
  enableMaxHeight: boolean
  maxHeight: number
  elasticHeight: boolean
  labels: FlakeLabel[]
  flakes: Flake[]
}

export const createFlakepile = (): Flakepile => {
  return {
    id: nanoid(16),
    flow: 'horizontal',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    width: 1,
    elasticWidth: false,
    enableMaxHeight: false,
    maxHeight: 1,
    elasticHeight: false,
    labels: [],
    flakes: [],
  }
}
