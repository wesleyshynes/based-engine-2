/**
 * Based Engine 2.0 - Main Engine
 * The core game engine class
 */

import type { GameConfig, LevelConfig } from './types'
import { InputManager } from './Input'
import { Camera } from './Camera'
import { SoundManager } from './Sound'
import { SaveManager } from './Save'
import { Draw } from './Draw'
import { BasedLevel } from './Level'

export class BasedEngine {
  // Canvas
  private _canvas: HTMLCanvasElement
  private _ctx: CanvasRenderingContext2D
  private _width = 800
  private _height = 600
  private _backgroundColor = '#000'

  // Core systems
  private _input: InputManager
  private _camera: Camera
  private _sound: SoundManager
  private _save: SaveManager
  private _draw: Draw

  // Timing
  private _lastTime = 0
  private _delta = 0
  private _time = 0
  private _fps = 0
  private _frameCount = 0
  private _fpsTime = 0
  private _running = false
  private _animFrame = 0

  // Levels
  private _levels = new Map<string, new (engine: BasedEngine) => BasedLevel>()
  private _currentLevel: BasedLevel | null = null
  private _currentLevelKey = ''
  private _isLoading = false
  private _loadingProgress = 0
  private _loadingMessage = ''

  // Debug
  private _debug = false

  constructor(config: GameConfig = {}) {
    // Create canvas
    this._canvas = document.createElement('canvas')
    this._canvas.width = config.width ?? window.innerWidth
    this._canvas.height = config.height ?? window.innerHeight
    this._width = this._canvas.width
    this._height = this._canvas.height
    this._backgroundColor = config.backgroundColor ?? '#000'
    
    // Pixel-perfect rendering
    if (config.pixelPerfect) {
      this._canvas.style.imageRendering = 'pixelated'
    }

    // Get context
    this._ctx = this._canvas.getContext('2d')!
    
    // Attach to container
    const container = config.containerId 
      ? document.getElementById(config.containerId)
      : document.body
    container?.appendChild(this._canvas)

    // Initialize systems
    this._input = new InputManager(this._canvas)
    this._camera = new Camera()
    this._sound = new SoundManager()
    this._save = new SaveManager()
    this._draw = new Draw(this._ctx, this._width, this._height)

    // Set up camera screen size
    this._camera.setScreenSize(this._width, this._height)

    // Set up input world transform
    this._input.setWorldTransform((screen) => this._camera.screenToWorld(screen))

    // Handle resize
    window.addEventListener('resize', () => this._handleResize())

    // Debug mode
    this._debug = config.debug ?? false

    // Bind methods
    this._gameLoop = this._gameLoop.bind(this)
  }

  // ============================================
  // Public API
  // ============================================

  /**
   * Register a level
   */
  registerLevel(key: string, levelClass: new (engine: BasedEngine) => BasedLevel): this {
    this._levels.set(key, levelClass)
    return this
  }

  /**
   * Register multiple levels
   */
  registerLevels(levels: LevelConfig[]): this {
    for (const { key, levelClass } of levels) {
      this.registerLevel(key, levelClass)
    }
    return this
  }

  /**
   * Start the game with an initial level
   */
  async start(initialLevel: string): Promise<void> {
    if (this._running) return

    this._running = true
    this._lastTime = performance.now()
    
    await this.loadLevel(initialLevel)
    
    this._animFrame = requestAnimationFrame(this._gameLoop)
  }

  /**
   * Stop the game
   */
  stop(): void {
    this._running = false
    if (this._animFrame) {
      cancelAnimationFrame(this._animFrame)
    }
  }

  /**
   * Load a level by key
   */
  async loadLevel(key: string): Promise<void> {
    const LevelClass = this._levels.get(key)
    if (!LevelClass) {
      console.error(`Level "${key}" not found`)
      return
    }

    this._isLoading = true
    this._loadingMessage = 'Loading...'
    this._loadingProgress = 0

    // Destroy current level
    if (this._currentLevel) {
      this._currentLevel._destroy()
    }

    // Create and initialize new level
    this._currentLevel = new LevelClass(this)
    this._currentLevelKey = key

    try {
      await this._currentLevel._init()
      this._currentLevel._resize()
    } catch (e) {
      console.error('Error loading level:', e)
    }

    this._isLoading = false
  }

  /**
   * Set loading progress (0-1)
   */
  setLoadingProgress(progress: number, message?: string): void {
    this._loadingProgress = Math.max(0, Math.min(1, progress))
    if (message) this._loadingMessage = message
  }

  /**
   * Reload current level
   */
  async reloadLevel(): Promise<void> {
    if (this._currentLevelKey) {
      await this.loadLevel(this._currentLevelKey)
    }
  }

  // ============================================
  // Getters
  // ============================================

  get canvas(): HTMLCanvasElement { return this._canvas }
  get ctx(): CanvasRenderingContext2D { return this._ctx }
  get width(): number { return this._width }
  get height(): number { return this._height }
  get delta(): number { return this._delta }
  get time(): number { return this._time }
  get fps(): number { return this._fps }
  get isLoading(): boolean { return this._isLoading }
  get loadingProgress(): number { return this._loadingProgress }
  get debug(): boolean { return this._debug }

  get input(): InputManager { return this._input }
  get camera(): Camera { return this._camera }
  get sound(): SoundManager { return this._sound }
  get save(): SaveManager { return this._save }
  get draw(): Draw { return this._draw }

  get currentLevel(): BasedLevel | null { return this._currentLevel }
  get currentLevelKey(): string { return this._currentLevelKey }

  // ============================================
  // Private methods
  // ============================================

  private _gameLoop(currentTime: number): void {
    if (!this._running) return

    // Calculate delta (in seconds)
    this._delta = Math.min((currentTime - this._lastTime) / 1000, 0.1) // Cap at 100ms
    this._lastTime = currentTime
    this._time += this._delta

    // Update FPS counter
    this._frameCount++
    this._fpsTime += this._delta
    if (this._fpsTime >= 1) {
      this._fps = this._frameCount
      this._frameCount = 0
      this._fpsTime = 0
    }

    // Update
    this._update()

    // Draw
    this._render()

    // Clear input just-pressed states
    this._input.update()

    // Next frame
    this._animFrame = requestAnimationFrame(this._gameLoop)
  }

  private _update(): void {
    // Update camera
    this._camera.update(this._delta)

    // Update current level
    if (this._currentLevel && !this._isLoading) {
      this._currentLevel._update(this._delta)
    }
  }

  private _render(): void {
    // Clear canvas
    this._draw.clear(this._backgroundColor)

    if (this._isLoading) {
      this._drawLoadingScreen()
      return
    }

    if (!this._currentLevel) return

    // Apply camera transform for world drawing
    this._ctx.save()
    this._camera.applyTransform(this._ctx)

    // Draw level (in world coordinates)
    this._currentLevel._draw(this._draw)

    // Reset camera transform
    this._ctx.restore()

    // Draw UI (in screen coordinates)
    this._currentLevel._drawUI(this._draw)

    // Debug info
    if (this._debug) {
      this._drawDebug()
    }
  }

  private _drawLoadingScreen(): void {
    const centerX = this._width / 2
    const centerY = this._height / 2
    const barWidth = 200
    const barHeight = 20

    // Background bar
    this._draw.rect(
      centerX - barWidth / 2,
      centerY - barHeight / 2,
      barWidth,
      barHeight,
      { fill: '#333', stroke: '#fff', strokeWidth: 2 }
    )

    // Progress bar
    this._draw.rect(
      centerX - barWidth / 2 + 2,
      centerY - barHeight / 2 + 2,
      (barWidth - 4) * this._loadingProgress,
      barHeight - 4,
      { fill: '#4CAF50' }
    )

    // Loading text
    this._draw.text(this._loadingMessage, centerX, centerY - 30, {
      size: 16,
      align: 'center',
      baseline: 'middle',
      color: '#fff'
    })
  }

  private _drawDebug(): void {
    const debugText = [
      `FPS: ${this._fps}`,
      `Delta: ${(this._delta * 1000).toFixed(1)}ms`,
      `Camera: (${this._camera.x.toFixed(0)}, ${this._camera.y.toFixed(0)})`,
      `Zoom: ${this._camera.zoom.toFixed(2)}`,
      `Level: ${this._currentLevelKey}`
    ].join('\n')

    this._draw.textMultiline(debugText, 10, 10, {
      size: 12,
      color: '#0f0',
      stroke: '#000',
      strokeWidth: 2
    })
  }

  private _handleResize(): void {
    this._width = window.innerWidth
    this._height = window.innerHeight
    this._canvas.width = this._width
    this._canvas.height = this._height

    this._camera.setScreenSize(this._width, this._height)
    this._draw.setSize(this._width, this._height)

    if (this._currentLevel) {
      this._currentLevel._resize()
    }
  }
}
