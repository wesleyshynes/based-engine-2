/**
 * Based Engine 2.0
 * A TypeScript game engine for web browsers
 */

// Core
export { BasedEngine } from './Engine'
export { BasedLevel } from './Level'
export { GameObject } from './GameObject'

// Systems
export { Camera } from './Camera'
export { InputManager } from './Input'
export { SoundManager } from './Sound'
export { SaveManager } from './Save'

// Drawing
export { Draw, loadImage, getImage, color } from './Draw'

// UI
export { Button, Label, Panel, TouchKnob, ProgressBar } from './UI'
export type { ButtonStyle, LabelStyle, PanelStyle, TouchKnobStyle } from './UI'

// Physics
export { PhysicsWorld, PhysicsBody } from './Physics'
export type { BodyOptions, CollisionCallback } from './Physics'

// Math utilities
export { vec2, angle, num, ease, random } from './math'

// Types
export type {
  Vec2,
  Rect,
  Color,
  GameConfig,
  LevelConfig,
  InputState
} from './types'
