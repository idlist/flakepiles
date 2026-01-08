import { moment } from 'obsidian'
import { faker } from '@faker-js/faker'
import { nanoid } from 'nanoid'

export interface Flake {
  id: string
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
    id: nanoid(16),
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
    id: nanoid(16),
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
  id: string
  flow: 'vertical' | 'horizontal'
  sortBy: 'name' | 'createdAt' | 'modifiedAt'
  sortOrder: 'asc' | 'desc'
  width: number
  elasticWidth: boolean
  enableMaxHeight: boolean
  maxHeight: number
  elasticHeight: boolean
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
    flakes: [],
  }
}

export const FLAKE_WIDTH = 320
