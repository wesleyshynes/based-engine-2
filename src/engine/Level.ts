/**
 * Based Engine 2.0 - Base Level
 * Levels contain game logic and manage game objects
 */

import type { BasedEngine } from './Engine'
import type { GameObject } from './GameObject'
import { Draw } from './Draw'

export abstract class BasedLevel {
  readonly engine: BasedEngine
  private _objects: Map<string, GameObject> = new Map()
  private _objectsToAdd: GameObject[] = []
  private _objectsToRemove: Set<string> = new Set()
  private _initialized = false

  constructor(engine: BasedEngine) {
    this.engine = engine
  }

  // ============================================
  // Lifecycle methods - Override these in your levels
  // ============================================

  /**
   * Async preload - load assets here
   * Called before create()
   */
  async preload(): Promise<void> {}

  /**
   * Initialize level - create objects and set up state
   * Called after preload completes
   */
  create(): void {}

  /**
   * Update game logic
   * Called every frame with delta time in seconds
   */
  update(_delta: number): void {}

  /**
   * Draw the level
   * Camera transform is already applied
   */
  draw(_draw: Draw): void {}

  /**
   * Draw UI/HUD elements
   * Camera transform is NOT applied - use screen coordinates
   */
  drawUI(_draw: Draw): void {}

  /**
   * Called when the screen is resized
   */
  resize(): void {}

  /**
   * Clean up when leaving level
   */
  destroy(): void {}

  // ============================================
  // Object Management
  // ============================================

  /**
   * Add a game object to the level
   */
  addObject(object: GameObject): void {
    this._objectsToAdd.push(object)
  }

  /**
   * Remove a game object from the level
   */
  removeObject(id: string): void {
    this._objectsToRemove.add(id)
  }

  /**
   * Get an object by ID
   */
  getObject<T extends GameObject>(id: string): T | undefined {
    return this._objects.get(id) as T | undefined
  }

  /**
   * Get all objects
   */
  getObjects(): GameObject[] {
    return Array.from(this._objects.values())
  }

  /**
   * Get objects by tag
   */
  getObjectsByTag(tag: string): GameObject[] {
    return this.getObjects().filter(obj => obj.hasTag(tag))
  }

  /**
   * Find first object matching predicate
   */
  findObject<T extends GameObject>(predicate: (obj: GameObject) => boolean): T | undefined {
    for (const obj of this._objects.values()) {
      if (predicate(obj)) return obj as T
    }
    return undefined
  }

  /**
   * Find all objects matching predicate
   */
  findObjects<T extends GameObject>(predicate: (obj: GameObject) => boolean): T[] {
    const result: T[] = []
    for (const obj of this._objects.values()) {
      if (predicate(obj)) result.push(obj as T)
    }
    return result
  }

  // ============================================
  // Internal methods - Called by engine
  // ============================================

  /** @internal */
  async _init(): Promise<void> {
    if (this._initialized) return
    await this.preload()
    this.create()
    this._initialized = true
  }

  /** @internal */
  _update(delta: number): void {
    // Add pending objects
    for (const obj of this._objectsToAdd) {
      this._objects.set(obj.id, obj)
      obj._init()
    }
    this._objectsToAdd = []

    // Remove pending objects
    for (const id of this._objectsToRemove) {
      const obj = this._objects.get(id)
      if (obj) {
        obj.destroy()
        this._objects.delete(id)
      }
    }
    this._objectsToRemove.clear()

    // Update level logic FIRST (so physics runs before objects read positions)
    this.update(delta)

    // Update all objects AFTER level update (so physics has been stepped)
    for (const obj of this._objects.values()) {
      if (obj.active) {
        obj.update(delta)
      }
    }
  }

  /** @internal */
  _draw(draw: Draw): void {
    // Draw level background first
    this.draw(draw)

    // Draw all visible objects (sorted by depth)
    const sortedObjects = Array.from(this._objects.values())
      .filter(obj => obj.visible)
      .sort((a, b) => a.depth - b.depth)

    // console.log('Drawing objects:', sortedObjects.length, sortedObjects.map(o => o.id))

    for (const obj of sortedObjects) {
      obj.draw(draw)
    }
  }

  /** @internal */
  _drawUI(draw: Draw): void {
    // Draw UI for objects
    const sortedObjects = Array.from(this._objects.values())
      .filter(obj => obj.visible)
      .sort((a, b) => a.depth - b.depth)

    for (const obj of sortedObjects) {
      obj.drawUI(draw)
    }

    // Draw level UI
    this.drawUI(draw)
  }

  /** @internal */
  _resize(): void {
    for (const obj of this._objects.values()) {
      obj.resize()
    }
    this.resize()
  }

  /** @internal */
  _destroy(): void {
    for (const obj of this._objects.values()) {
      obj.destroy()
    }
    this._objects.clear()
    this.destroy()
    this._initialized = false
  }

  // ============================================
  // Convenience accessors
  // ============================================

  get input() { return this.engine.input }
  get camera() { return this.engine.camera }
  get sound() { return this.engine.sound }
  get save() { return this.engine.save }
  get width() { return this.engine.width }
  get height() { return this.engine.height }
  get time() { return this.engine.time }
}
