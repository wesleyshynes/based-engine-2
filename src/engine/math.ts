/**
 * Based Engine 2.0 - Math Utilities
 */

import type { Vec2 } from './types'

export const vec2 = {
  create(x = 0, y = 0): Vec2 {
    return { x, y }
  },

  clone(v: Vec2): Vec2 {
    return { x: v.x, y: v.y }
  },

  add(a: Vec2, b: Vec2): Vec2 {
    return { x: a.x + b.x, y: a.y + b.y }
  },

  subtract(a: Vec2, b: Vec2): Vec2 {
    return { x: a.x - b.x, y: a.y - b.y }
  },

  multiply(v: Vec2, scalar: number): Vec2 {
    return { x: v.x * scalar, y: v.y * scalar }
  },

  divide(v: Vec2, scalar: number): Vec2 {
    return { x: v.x / scalar, y: v.y / scalar }
  },

  length(v: Vec2): number {
    return Math.sqrt(v.x * v.x + v.y * v.y)
  },

  lengthSquared(v: Vec2): number {
    return v.x * v.x + v.y * v.y
  },

  normalize(v: Vec2, length = 1): Vec2 {
    const len = vec2.length(v)
    if (len === 0) return { x: 0, y: 0 }
    return { x: (v.x / len) * length, y: (v.y / len) * length }
  },

  distance(a: Vec2, b: Vec2): number {
    return vec2.length(vec2.subtract(a, b))
  },

  distanceSquared(a: Vec2, b: Vec2): number {
    return vec2.lengthSquared(vec2.subtract(a, b))
  },

  angle(a: Vec2, b: Vec2): number {
    return Math.atan2(b.y - a.y, b.x - a.x)
  },

  fromAngle(angle: number, length = 1): Vec2 {
    return {
      x: Math.cos(angle) * length,
      y: Math.sin(angle) * length
    }
  },

  rotate(v: Vec2, angle: number, origin: Vec2 = { x: 0, y: 0 }): Vec2 {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const dx = v.x - origin.x
    const dy = v.y - origin.y
    return {
      x: origin.x + dx * cos - dy * sin,
      y: origin.y + dx * sin + dy * cos
    }
  },

  lerp(a: Vec2, b: Vec2, t: number): Vec2 {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t
    }
  },

  dot(a: Vec2, b: Vec2): number {
    return a.x * b.x + a.y * b.y
  },

  cross(a: Vec2, b: Vec2): number {
    return a.x * b.y - a.y * b.x
  },

  perpendicular(v: Vec2): Vec2 {
    return { x: -v.y, y: v.x }
  },

  reflect(v: Vec2, normal: Vec2): Vec2 {
    const dot = vec2.dot(v, normal) * 2
    return {
      x: v.x - normal.x * dot,
      y: v.y - normal.y * dot
    }
  },

  equals(a: Vec2, b: Vec2, epsilon = 0.001): boolean {
    return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon
  },

  zero(): Vec2 {
    return { x: 0, y: 0 }
  }
}

// Angle utilities
export const angle = {
  toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  },

  toDegrees(radians: number): number {
    return radians * (180 / Math.PI)
  },

  normalize(angle: number): number {
    while (angle < 0) angle += Math.PI * 2
    while (angle >= Math.PI * 2) angle -= Math.PI * 2
    return angle
  },

  lerpAngle(a: number, b: number, t: number): number {
    const diff = b - a
    const shortestAngle = ((diff + Math.PI) % (Math.PI * 2)) - Math.PI
    return a + shortestAngle * t
  }
}

// Number utilities
export const num = {
  clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
  },

  lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
  },

  map(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
  },

  randomRange(min: number, max: number): number {
    return Math.random() * (max - min) + min
  },

  randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  },

  approach(current: number, target: number, maxDelta: number): number {
    if (current < target) {
      return Math.min(current + maxDelta, target)
    }
    return Math.max(current - maxDelta, target)
  },

  wrap(value: number, min: number, max: number): number {
    const range = max - min
    return ((((value - min) % range) + range) % range) + min
  }
}

// Easing functions
export const ease = {
  linear: (t: number) => t,
  quadIn: (t: number) => t * t,
  quadOut: (t: number) => t * (2 - t),
  quadInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  cubicIn: (t: number) => t * t * t,
  cubicOut: (t: number) => (--t) * t * t + 1,
  cubicInOut: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  elasticOut: (t: number) => Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1,
  bounceOut: (t: number) => {
    if (t < 1 / 2.75) return 7.5625 * t * t
    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375
  }
}

// Random utilities
export const random = {
  pick<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
  },

  shuffle<T>(array: T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  },

  chance(probability: number): boolean {
    return Math.random() < probability
  },

  uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }
}
