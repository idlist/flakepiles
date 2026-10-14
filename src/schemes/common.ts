import { type FlakepilePreV1, updateFromPreToV1 } from './pre'
import type { Flakepile } from './v1'

export interface WithVersion {
  version: number
}

export function parseFlakepile(raw: string): Flakepile {
  let parsed = JSON.parse(raw) as FlakepilePreV1 | Flakepile

  // Data without a version comes pre-v1 version.
  if (!('version' in parsed)) {
    parsed = updateFromPreToV1(parsed)
  }

  return parsed
}
