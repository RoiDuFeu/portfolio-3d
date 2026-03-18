import type { AnimatableValue } from '../types/studio'
import { lerp } from './math'

export function resolveValue(prop: AnimatableValue, evolution: number): number {
  return lerp(prop.base, prop.evolved, evolution)
}
