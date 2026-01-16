/**
 * Based Engine 2.0 - Game Object
 * Base class for all game entities
 */

import type { BasedEngine } from './Engine'
import type { BasedLevel } from './Level'
import type { Vec2 } from './types'
import { Draw } from './Draw'
import { random } from './math'

export class GameObject {
  readonly id: string
  readonly engine: BasedEngine
  readonly level: BasedLevel

  // Transform
  x = 0
  y = 0
  rotation = 0
  scaleX = 1
  scaleY = 1

  // State
  active = true
  visible = true
  depth = 0  // Lower values draw first (behind)

  // Tags for querying
  private _tags = new Set<string>()

  constructor(level: BasedLevel, id?: string) {
    this.id = id ?? random.uuid()
    this.level = level
    this.engine = level.engine
  }

  // ============================================
  // Lifecycle - Override these
  // ============================================

  /**
   * Called when added to level
   */
  create(): void {}

  /**
   * Called every frame
   */
  update(_delta: number): void {}

  /**
   * Draw the object (in world coordinates)
   */
  draw(_draw: Draw): void {}

  /**
   * Draw UI for this object (in screen coordinates)
   */
  drawUI(_draw: Draw): void {}

  /**
   * Called on screen resize
   */
  resize(): void {}

  /**
   * Called when removed from level
   */
  destroy(): void {}

  // ============================================
  // Position helpers
  // ============================================

  get position(): Vec2 {
    return { x: this.x, y: this.y }
  }

  set position(pos: Vec2) {
    this.x = pos.x
    this.y = pos.y
  }

  setPosition(x: number, y: number): this {
    this.x = x
    this.y = y
    return this
  }

  /**
   * Get position in screen coordinates
   */
  get screenPosition(): Vec2 {
    return this.engine.camera.worldToScreen(this.position)
  }

  /**
   * Move by delta
   */
  move(dx: number, dy: number): this {
    this.x += dx
    this.y += dy
    return this
  }

  /**
   * Move towards a target
   */
  moveTowards(target: Vec2, speed: number, delta: number): this {
    const dx = target.x - this.x
    const dy = target.y - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    
    if (dist <= speed * delta) {
      this.x = target.x
      this.y = target.y
    } else {
      const ratio = (speed * delta) / dist
      this.x += dx * ratio
      this.y += dy * ratio
    }
    
    return this
  }

  /**
   * Get distance to another object or point
   */
  distanceTo(target: Vec2 | GameObject): number {
    const pos = target instanceof GameObject ? target.position : target
    const dx = pos.x - this.x
    const dy = pos.y - this.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Get angle to another object or point
   */
  angleTo(target: Vec2 | GameObject): number {
    const pos = target instanceof GameObject ? target.position : target
    return Math.atan2(pos.y - this.y, pos.x - this.x)
  }

  /**
   * Look at a target (set rotation)
   */
  lookAt(target: Vec2 | GameObject): this {
    this.rotation = this.angleTo(target)
    return this
  }

  // ============================================
  // Tags
  // ============================================

  addTag(tag: string): this {
    this._tags.add(tag)
    return this
  }

  removeTag(tag: string): this {
    this._tags.delete(tag)
    return this
  }

  hasTag(tag: string): boolean {
    return this._tags.has(tag)
  }

  get tags(): string[] {
    return Array.from(this._tags)
  }

  // ============================================
  // Convenience accessors
  // ============================================

  get input() { return this.engine.input }
  get camera() { return this.engine.camera }
  get sound() { return this.engine.sound }
  get save() { return this.engine.save }
  get time() { return this.engine.time }

  // ============================================
  // Internal
  // ============================================

  /** @internal */
  _init(): void {
    this.create()
  }
}
