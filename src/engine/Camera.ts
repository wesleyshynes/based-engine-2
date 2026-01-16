/**
 * Based Engine 2.0 - Camera System
 * Handles camera position, zoom, rotation, shake, and following
 */

import type { Vec2 } from './types'
import { num } from './math'

export class Camera {
  x = 0
  y = 0
  zoom = 1
  rotation = 0

  private _targetX = 0
  private _targetY = 0
  private _targetZoom = 1
  private _followTarget: { x: number; y: number } | null = null
  private _followSpeed = 5
  private _bounds: { width: number; height: number } | null = null

  private _shakeIntensity = 0
  private _shakeDuration = 0
  private _shakeTime = 0
  private _shakeOffset: Vec2 = { x: 0, y: 0 }

  private _screenWidth = 800
  private _screenHeight = 600

  /**
   * Set screen dimensions (called by engine on resize)
   */
  setScreenSize(width: number, height: number): void {
    this._screenWidth = width
    this._screenHeight = height
  }

  /**
   * Set the camera to follow a target (object with x/y properties)
   * Pass the actual object reference so we can track position changes
   */
  follow(target: { x: number; y: number }, speed = 5): void {
    this._followTarget = target
    this._followSpeed = speed
  }

  /**
   * Stop following the current target
   */
  stopFollowing(): void {
    this._followTarget = null
  }

  /**
   * Instantly set the camera position
   */
  setPosition(x: number, y: number): void {
    this.x = x
    this.y = y
    this._targetX = x
    this._targetY = y
  }

  /**
   * Set target position to smoothly move to
   */
  setTarget(target: Vec2): void {
    this._targetX = target.x
    this._targetY = target.y
  }

  /**
   * Set zoom level (1 = 100%)
   */
  setZoom(zoom: number): void {
    this._targetZoom = Math.max(0.1, zoom)
  }

  /**
   * Instantly set zoom
   */
  setZoomImmediate(zoom: number): void {
    this.zoom = Math.max(0.1, zoom)
    this._targetZoom = this.zoom
  }

  /**
   * Set level bounds for camera clamping
   */
  setBounds(width: number, height: number): void {
    this._bounds = { width, height }
  }

  /**
   * Clear bounds
   */
  clearBounds(): void {
    this._bounds = null
  }

  /**
   * Shake the camera
   */
  shake(intensity: number, duration = 200): void {
    this._shakeIntensity = intensity
    this._shakeDuration = duration
    this._shakeTime = 0
  }

  /**
   * Update camera (called each frame)
   */
  update(delta: number): void {
    // Follow target
    if (this._followTarget) {
      this._targetX = this._followTarget.x
      this._targetY = this._followTarget.y
    }

    // Smooth movement
    const moveSpeed = this._followSpeed * delta
    this.x = num.approach(this.x, this._targetX, Math.abs(this._targetX - this.x) * moveSpeed)
    this.y = num.approach(this.y, this._targetY, Math.abs(this._targetY - this.y) * moveSpeed)

    // Smooth zoom
    this.zoom = num.approach(this.zoom, this._targetZoom, Math.abs(this._targetZoom - this.zoom) * 5 * delta)

    // Clamp to bounds if set
    if (this._bounds) {
      const halfScreenW = (this._screenWidth / 2) / this.zoom
      const halfScreenH = (this._screenHeight / 2) / this.zoom

      // If screen is wider than level, center horizontally
      if (halfScreenW * 2 >= this._bounds.width) {
        this.x = this._bounds.width / 2
      } else {
        this.x = num.clamp(this.x, halfScreenW, this._bounds.width - halfScreenW)
      }

      // If screen is taller than level, center vertically
      if (halfScreenH * 2 >= this._bounds.height) {
        this.y = this._bounds.height / 2
      } else {
        this.y = num.clamp(this.y, halfScreenH, this._bounds.height - halfScreenH)
      }
    }

    // Update shake
    if (this._shakeTime < this._shakeDuration) {
      this._shakeTime += delta * 1000
      const progress = 1 - (this._shakeTime / this._shakeDuration)
      const intensity = this._shakeIntensity * progress
      this._shakeOffset = {
        x: (Math.random() * 2 - 1) * intensity,
        y: (Math.random() * 2 - 1) * intensity
      }
    } else {
      this._shakeOffset = { x: 0, y: 0 }
    }
  }

  /**
   * Get the camera position including shake offset
   */
  get position(): Vec2 {
    return {
      x: this.x + this._shakeOffset.x,
      y: this.y + this._shakeOffset.y
    }
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(point: Vec2): Vec2 {
    const pos = this.position
    return {
      x: (point.x - pos.x) * this.zoom + this._screenWidth / 2,
      y: (point.y - pos.y) * this.zoom + this._screenHeight / 2
    }
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(point: Vec2): Vec2 {
    const pos = this.position
    return {
      x: (point.x - this._screenWidth / 2) / this.zoom + pos.x,
      y: (point.y - this._screenHeight / 2) / this.zoom + pos.y
    }
  }

  /**
   * Get the visible world bounds
   */
  getVisibleBounds(): { x: number; y: number; width: number; height: number } {
    const halfW = (this._screenWidth / 2) / this.zoom
    const halfH = (this._screenHeight / 2) / this.zoom
    const pos = this.position
    return {
      x: pos.x - halfW,
      y: pos.y - halfH,
      width: halfW * 2,
      height: halfH * 2
    }
  }

  /**
   * Check if a point is visible on screen
   */
  isVisible(point: Vec2, margin = 0): boolean {
    const bounds = this.getVisibleBounds()
    return (
      point.x >= bounds.x - margin &&
      point.x <= bounds.x + bounds.width + margin &&
      point.y >= bounds.y - margin &&
      point.y <= bounds.y + bounds.height + margin
    )
  }

  /**
   * Check if a rectangle is visible on screen
   */
  isRectVisible(x: number, y: number, width: number, height: number, margin = 0): boolean {
    const bounds = this.getVisibleBounds()
    return !(
      x + width < bounds.x - margin ||
      x > bounds.x + bounds.width + margin ||
      y + height < bounds.y - margin ||
      y > bounds.y + bounds.height + margin
    )
  }

  /**
   * Apply camera transform to canvas context
   */
  applyTransform(ctx: CanvasRenderingContext2D): void {
    const pos = this.position
    ctx.translate(this._screenWidth / 2, this._screenHeight / 2)
    ctx.scale(this.zoom, this.zoom)
    ctx.rotate(this.rotation)
    ctx.translate(-pos.x, -pos.y)
  }

  /**
   * Reset canvas transform
   */
  resetTransform(ctx: CanvasRenderingContext2D): void {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
  }
}
