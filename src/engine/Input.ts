/**
 * Based Engine 2.0 - Input Manager
 * Handles keyboard, mouse, and touch input with unified API
 */

import type { InputState, Vec2 } from './types'

export class InputManager {
  private _keys = new Set<string>()
  private _keysJustPressed = new Set<string>()
  private _keysJustReleased = new Set<string>()
  
  private _mouse = {
    x: 0,
    y: 0,
    worldX: 0,
    worldY: 0,
    down: false,
    justPressed: false,
    justReleased: false,
    button: 0
  }
  
  private _touches = new Map<number, { x: number; y: number; worldX: number; worldY: number }>()
  private _isTouchDevice = false
  private _canvas: HTMLCanvasElement
  private _worldTransform: (screen: Vec2) => Vec2 = (p) => p

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas
    this._isTouchDevice = 'ontouchstart' in window
    this._setupListeners()
  }

  private _setupListeners(): void {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      if (!this._keys.has(e.code)) {
        this._keysJustPressed.add(e.code)
      }
      this._keys.add(e.code)
      // Prevent default for game keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault()
      }
    })

    window.addEventListener('keyup', (e) => {
      this._keys.delete(e.code)
      this._keysJustReleased.add(e.code)
    })

    // Mouse
    this._canvas.addEventListener('mousemove', (e) => {
      this._updateMousePosition(e)
      this._isTouchDevice = false
    })

    this._canvas.addEventListener('mousedown', (e) => {
      this._updateMousePosition(e)
      this._mouse.down = true
      this._mouse.justPressed = true
      this._mouse.button = e.button
      this._isTouchDevice = false
    })

    this._canvas.addEventListener('mouseup', (e) => {
      this._updateMousePosition(e)
      this._mouse.down = false
      this._mouse.justReleased = true
      this._isTouchDevice = false
    })

    this._canvas.addEventListener('mouseleave', () => {
      this._mouse.down = false
    })

    // Touch
    this._canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      this._isTouchDevice = true
      this._updateTouches(e)
      // Mirror first touch to mouse
      if (e.touches.length > 0) {
        this._mouse.justPressed = true
        this._mouse.down = true
      }
    }, { passive: false })

    this._canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()
      this._updateTouches(e)
    }, { passive: false })

    this._canvas.addEventListener('touchend', (e) => {
      e.preventDefault()
      this._updateTouches(e)
      if (e.touches.length === 0) {
        this._mouse.down = false
        this._mouse.justReleased = true
      }
    }, { passive: false })

    this._canvas.addEventListener('touchcancel', (e) => {
      this._updateTouches(e)
      this._mouse.down = false
    })

    // Prevent context menu on right-click
    this._canvas.addEventListener('contextmenu', (e) => e.preventDefault())
  }

  private _updateMousePosition(e: MouseEvent): void {
    const rect = this._canvas.getBoundingClientRect()
    this._mouse.x = e.clientX - rect.left
    this._mouse.y = e.clientY - rect.top
    const world = this._worldTransform({ x: this._mouse.x, y: this._mouse.y })
    this._mouse.worldX = world.x
    this._mouse.worldY = world.y
  }

  private _updateTouches(e: TouchEvent): void {
    const rect = this._canvas.getBoundingClientRect()
    
    // Clear and rebuild touch map
    this._touches.clear()
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i]
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top
      const world = this._worldTransform({ x, y })
      this._touches.set(touch.identifier, { x, y, worldX: world.x, worldY: world.y })
    }

    // Update mouse position to first touch
    if (e.touches.length > 0) {
      const firstTouch = e.touches[0]
      this._mouse.x = firstTouch.clientX - rect.left
      this._mouse.y = firstTouch.clientY - rect.top
      const world = this._worldTransform({ x: this._mouse.x, y: this._mouse.y })
      this._mouse.worldX = world.x
      this._mouse.worldY = world.y
    }
  }

  /**
   * Set the transform function to convert screen to world coordinates
   */
  setWorldTransform(transform: (screen: Vec2) => Vec2): void {
    this._worldTransform = transform
  }

  /**
   * Call at the end of each frame to clear just pressed/released states
   */
  update(): void {
    this._keysJustPressed.clear()
    this._keysJustReleased.clear()
    this._mouse.justPressed = false
    this._mouse.justReleased = false
  }

  /**
   * Check if a key is currently held down
   */
  key(code: string): boolean {
    return this._keys.has(code)
  }

  /**
   * Check if a key was just pressed this frame
   */
  keyPressed(code: string): boolean {
    return this._keysJustPressed.has(code)
  }

  /**
   * Check if a key was just released this frame
   */
  keyReleased(code: string): boolean {
    return this._keysJustReleased.has(code)
  }

  /**
   * Check if any of the given keys are held
   */
  anyKey(...codes: string[]): boolean {
    return codes.some(code => this._keys.has(code))
  }

  /**
   * Get horizontal axis (-1 to 1) from WASD/Arrow keys
   */
  get horizontalAxis(): number {
    let axis = 0
    if (this.anyKey('KeyA', 'ArrowLeft')) axis -= 1
    if (this.anyKey('KeyD', 'ArrowRight')) axis += 1
    return axis
  }

  /**
   * Get vertical axis (-1 to 1) from WASD/Arrow keys
   */
  get verticalAxis(): number {
    let axis = 0
    if (this.anyKey('KeyW', 'ArrowUp')) axis -= 1
    if (this.anyKey('KeyS', 'ArrowDown')) axis += 1
    return axis
  }

  /**
   * Get movement vector from WASD/Arrow keys (normalized)
   */
  get moveVector(): Vec2 {
    const x = this.horizontalAxis
    const y = this.verticalAxis
    const len = Math.sqrt(x * x + y * y)
    if (len === 0) return { x: 0, y: 0 }
    return { x: x / len, y: y / len }
  }

  /**
   * Get current input state (for compatibility with old API)
   */
  get state(): InputState {
    return {
      keys: new Set(this._keys),
      mouse: { ...this._mouse },
      touches: new Map(this._touches),
      isTouchDevice: this._isTouchDevice
    }
  }

  /**
   * Quick access to mouse state
   */
  get mouse() {
    return this._mouse
  }

  /**
   * Quick access to touch info
   */
  get touches() {
    return this._touches
  }

  /**
   * Is this a touch device?
   */
  get isTouchDevice(): boolean {
    return this._isTouchDevice
  }

  /**
   * Was mouse/touch just pressed this frame?
   */
  get pointerPressed(): boolean {
    return this._mouse.justPressed
  }

  /**
   * Was mouse/touch just released this frame?
   */
  get pointerReleased(): boolean {
    return this._mouse.justReleased
  }

  /**
   * Is mouse/touch currently down?
   */
  get pointerDown(): boolean {
    return this._mouse.down
  }

  /**
   * Get pointer position in screen coordinates
   */
  get pointerScreen(): Vec2 {
    return { x: this._mouse.x, y: this._mouse.y }
  }

  /**
   * Get pointer position in world coordinates
   */
  get pointerWorld(): Vec2 {
    return { x: this._mouse.worldX, y: this._mouse.worldY }
  }
}
