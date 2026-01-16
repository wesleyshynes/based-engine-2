/**
 * Based Engine 2.0 - Type Definitions
 */

export interface Vec2 {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Color {
  r: number
  g: number
  b: number
  a?: number
}

export interface GameConfig {
  containerId?: string
  width?: number
  height?: number
  backgroundColor?: string
  pixelPerfect?: boolean
  debug?: boolean
}

export interface LevelConfig {
  key: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  levelClass: new (engine: any) => any
}

export type InputState = {
  keys: Set<string>
  mouse: {
    x: number
    y: number
    worldX: number
    worldY: number
    down: boolean
    button: number
  }
  touches: Map<number, { x: number; y: number; worldX: number; worldY: number }>
  isTouchDevice: boolean
}

// Forward declarations for circular references
export interface BasedEngine {
  readonly ctx: CanvasRenderingContext2D
  readonly canvas: HTMLCanvasElement
  readonly width: number
  readonly height: number
  readonly input: InputState
  readonly delta: number
  readonly time: number
  readonly camera: Camera
  readonly sound: SoundManager
  readonly save: SaveManager
  loadLevel(key: string): Promise<void>
}

export interface BasedLevel {
  readonly engine: BasedEngine
  preload(): Promise<void>
  create(): void
  update(delta: number): void
  draw(ctx: CanvasRenderingContext2D): void
  resize(): void
  destroy(): void
}

export interface Camera {
  x: number
  y: number
  zoom: number
  rotation: number
  shake(intensity: number, duration?: number): void
  follow(target: Vec2, speed?: number): void
  setTarget(target: Vec2): void
  setBounds(width: number, height: number): void
  worldToScreen(point: Vec2): Vec2
  screenToWorld(point: Vec2): Vec2
}

export interface SoundManager {
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  loadSound(url: string, key: string): Promise<void>
  loadMusic(url: string, key: string): Promise<void>
  play(key: string, options?: { volume?: number; loop?: boolean }): void
  playMusic(key: string, options?: { volume?: number; fadeIn?: number }): void
  stopMusic(fadeOut?: number): void
  stopAll(): void
}

export interface SaveManager {
  save<T>(key: string, data: T): void
  load<T>(key: string, defaultValue: T): T
  delete(key: string): void
  clear(): void
  has(key: string): boolean
}
