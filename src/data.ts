import { moment } from 'obsidian'
import { faker } from '@faker-js/faker'

export interface Flake {
  createdAt: number
  modifiedAt: number
  theme: string
  name: string
  type: 'text' | 'image' | 'code'
  content: string
  labels: string[]
}

export const createFlake = (): Flake => {
  return {
    createdAt: moment.now(),
    modifiedAt: moment.now(),
    theme: 'default',
    name: 'New Flake',
    type: 'text',
    content: '',
    labels: [],
  }
}

export const createDummyFlake = (): Flake => {
  return {
    createdAt: moment.now(),
    modifiedAt: moment.now(),
    theme: 'default',
    name: faker.lorem.words(),
    type: 'text',
    content: faker.lorem.lines(),
    labels: [],
  }
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
  sortBy: 'title' | 'createdAt' | 'modifiedAt'
  sortOrder: 'asc' | 'desc'
  width: number
  widthStretch: boolean
  maxHeightUsed: boolean
  maxHeight: number
  flakes: Flake[]
}

export const createFlakepile = (): Flakepile => {
  return {
    flow: 'vertical',
    sortBy: 'title',
    sortOrder: 'desc',
    width: 1,
    widthStretch: false,
    maxHeightUsed: false,
    maxHeight: 2,
    flakes: [],
  }
}

export const FLAKE_WIDTH = 320
