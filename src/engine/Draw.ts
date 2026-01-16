/**
 * Based Engine 2.0 - Draw System
 * Simplified drawing API with automatic camera transforms
 * 
 * All draw functions work in WORLD coordinates by default.
 * Use the screen: true option for UI/HUD elements.
 */

import type { Vec2, Color } from './types'
// Utilities

export interface DrawOptions {
  screen?: boolean  // If true, draw in screen coordinates (for UI)
}

export interface ShapeOptions extends DrawOptions {
  fill?: string
  stroke?: string
  strokeWidth?: number
  alpha?: number
}

export interface TextOptions extends DrawOptions {
  font?: string
  size?: number
  color?: string
  align?: CanvasTextAlign
  baseline?: CanvasTextBaseline
  stroke?: string
  strokeWidth?: number
  maxWidth?: number
}

export interface ImageOptions extends DrawOptions {
  width?: number
  height?: number
  originX?: number  // 0-1, default 0.5 (center)
  originY?: number  // 0-1, default 0.5 (center)
  rotation?: number // radians
  flipX?: boolean
  flipY?: boolean
  alpha?: number
}

export interface SpriteOptions extends ImageOptions {
  frameX?: number
  frameY?: number
  frameWidth: number
  frameHeight: number
}

// Sprite/Image cache
const imageCache = new Map<string, HTMLImageElement>()

/**
 * Load an image and cache it
 */
export async function loadImage(url: string): Promise<HTMLImageElement> {
  if (imageCache.has(url)) {
    return imageCache.get(url)!
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      imageCache.set(url, img)
      resolve(img)
    }
    img.onerror = reject
    img.src = url
  })
}

/**
 * Get a cached image
 */
export function getImage(url: string): HTMLImageElement | undefined {
  return imageCache.get(url)
}

/**
 * Drawing helper class - provides simplified drawing API
 */
export class Draw {
  private ctx: CanvasRenderingContext2D
  private _width: number
  private _height: number

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx
    this._width = width
    this._height = height
  }

  /**
   * Update dimensions
   */
  setSize(width: number, height: number): void {
    this._width = width
    this._height = height
  }

  /**
   * Clear the entire canvas
   */
  clear(color?: string): void {
    if (color) {
      this.ctx.fillStyle = color
      this.ctx.fillRect(0, 0, this._width, this._height)
    } else {
      this.ctx.clearRect(0, 0, this._width, this._height)
    }
  }

  /**
   * Draw a rectangle
   */
  rect(x: number, y: number, width: number, height: number, options: ShapeOptions = {}): void {
    const { fill, stroke, strokeWidth = 1, alpha = 1 } = options

    this.ctx.save()
    this.ctx.globalAlpha = alpha

    if (fill) {
      this.ctx.fillStyle = fill
      this.ctx.fillRect(x, y, width, height)
    }

    if (stroke) {
      this.ctx.strokeStyle = stroke
      this.ctx.lineWidth = strokeWidth
      this.ctx.strokeRect(x, y, width, height)
    }

    this.ctx.restore()
  }

  /**
   * Draw a rectangle centered at position
   */
  rectCentered(x: number, y: number, width: number, height: number, options: ShapeOptions = {}): void {
    this.rect(x - width / 2, y - height / 2, width, height, options)
  }

  /**
   * Draw a circle
   */
  circle(x: number, y: number, radius: number, options: ShapeOptions = {}): void {
    const { fill, stroke, strokeWidth = 1, alpha = 1 } = options

    this.ctx.save()
    this.ctx.globalAlpha = alpha
    this.ctx.beginPath()
    this.ctx.arc(x, y, radius, 0, Math.PI * 2)

    if (fill) {
      this.ctx.fillStyle = fill
      this.ctx.fill()
    }

    if (stroke) {
      this.ctx.strokeStyle = stroke
      this.ctx.lineWidth = strokeWidth
      this.ctx.stroke()
    }

    this.ctx.restore()
  }

  /**
   * Draw an ellipse
   */
  ellipse(x: number, y: number, radiusX: number, radiusY: number, options: ShapeOptions & { rotation?: number } = {}): void {
    const { fill, stroke, strokeWidth = 1, alpha = 1, rotation = 0 } = options

    this.ctx.save()
    this.ctx.globalAlpha = alpha
    this.ctx.beginPath()
    this.ctx.ellipse(x, y, radiusX, radiusY, rotation, 0, Math.PI * 2)

    if (fill) {
      this.ctx.fillStyle = fill
      this.ctx.fill()
    }

    if (stroke) {
      this.ctx.strokeStyle = stroke
      this.ctx.lineWidth = strokeWidth
      this.ctx.stroke()
    }

    this.ctx.restore()
  }

  /**
   * Draw a line
   */
  line(x1: number, y1: number, x2: number, y2: number, options: { color?: string; width?: number; alpha?: number; dash?: number[] } = {}): void {
    const { color = '#fff', width = 1, alpha = 1, dash } = options

    this.ctx.save()
    this.ctx.globalAlpha = alpha
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = width
    
    if (dash) {
      this.ctx.setLineDash(dash)
    }

    this.ctx.beginPath()
    this.ctx.moveTo(x1, y1)
    this.ctx.lineTo(x2, y2)
    this.ctx.stroke()

    this.ctx.restore()
  }

  /**
   * Draw a polygon from array of points
   */
  polygon(points: Vec2[], options: ShapeOptions = {}): void {
    if (points.length < 2) return

    const { fill, stroke, strokeWidth = 1, alpha = 1 } = options

    this.ctx.save()
    this.ctx.globalAlpha = alpha
    this.ctx.beginPath()
    this.ctx.moveTo(points[0].x, points[0].y)

    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y)
    }

    this.ctx.closePath()

    if (fill) {
      this.ctx.fillStyle = fill
      this.ctx.fill()
    }

    if (stroke) {
      this.ctx.strokeStyle = stroke
      this.ctx.lineWidth = strokeWidth
      this.ctx.stroke()
    }

    this.ctx.restore()
  }

  /**
   * Draw text
   */
  text(text: string, x: number, y: number, options: TextOptions = {}): void {
    const {
      font = 'sans-serif',
      size = 16,
      color = '#fff',
      align = 'left',
      baseline = 'top',
      stroke,
      strokeWidth = 2,
      maxWidth
    } = options

    this.ctx.save()
    this.ctx.font = `${size}px ${font}`
    this.ctx.textAlign = align
    this.ctx.textBaseline = baseline

    if (stroke) {
      this.ctx.strokeStyle = stroke
      this.ctx.lineWidth = strokeWidth
      this.ctx.lineJoin = 'round'
      if (maxWidth) {
        this.ctx.strokeText(text, x, y, maxWidth)
      } else {
        this.ctx.strokeText(text, x, y)
      }
    }

    this.ctx.fillStyle = color
    if (maxWidth) {
      this.ctx.fillText(text, x, y, maxWidth)
    } else {
      this.ctx.fillText(text, x, y)
    }

    this.ctx.restore()
  }

  /**
   * Draw multiline text
   */
  textMultiline(text: string, x: number, y: number, options: TextOptions & { lineHeight?: number } = {}): void {
    const { lineHeight = (options.size ?? 16) * 1.2, ...textOptions } = options
    const lines = text.split('\n')
    
    lines.forEach((line, i) => {
      this.text(line, x, y + i * lineHeight, textOptions)
    })
  }

  /**
   * Measure text width
   */
  measureText(text: string, options: { font?: string; size?: number } = {}): number {
    const { font = 'sans-serif', size = 16 } = options
    this.ctx.save()
    this.ctx.font = `${size}px ${font}`
    const width = this.ctx.measureText(text).width
    this.ctx.restore()
    return width
  }

  /**
   * Draw an image
   */
  image(img: HTMLImageElement | HTMLCanvasElement, x: number, y: number, options: ImageOptions = {}): void {
    const {
      width = img.width,
      height = img.height,
      originX = 0.5,
      originY = 0.5,
      rotation = 0,
      flipX = false,
      flipY = false,
      alpha = 1
    } = options

    this.ctx.save()
    this.ctx.globalAlpha = alpha

    // Move to position
    this.ctx.translate(x, y)

    // Apply rotation
    if (rotation !== 0) {
      this.ctx.rotate(rotation)
    }

    // Apply flip
    this.ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1)

    // Draw centered on origin
    this.ctx.drawImage(img, -width * originX, -height * originY, width, height)

    this.ctx.restore()
  }

  /**
   * Draw a sprite from a spritesheet
   */
  sprite(img: HTMLImageElement, x: number, y: number, options: SpriteOptions): void {
    const {
      frameX = 0,
      frameY = 0,
      frameWidth,
      frameHeight,
      width = frameWidth,
      height = frameHeight,
      originX = 0.5,
      originY = 0.5,
      rotation = 0,
      flipX = false,
      flipY = false,
      alpha = 1
    } = options

    this.ctx.save()
    this.ctx.globalAlpha = alpha

    // Move to position
    this.ctx.translate(x, y)

    // Apply rotation
    if (rotation !== 0) {
      this.ctx.rotate(rotation)
    }

    // Apply flip
    this.ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1)

    // Draw sprite frame
    this.ctx.drawImage(
      img,
      frameX * frameWidth,
      frameY * frameHeight,
      frameWidth,
      frameHeight,
      -width * originX,
      -height * originY,
      width,
      height
    )

    this.ctx.restore()
  }

  /**
   * Draw with rotation around a point
   */
  rotated(x: number, y: number, rotation: number, drawFn: () => void): void {
    this.ctx.save()
    this.ctx.translate(x, y)
    this.ctx.rotate(rotation)
    this.ctx.translate(-x, -y)
    drawFn()
    this.ctx.restore()
  }

  /**
   * Draw with custom transform
   */
  transformed(transform: { x?: number; y?: number; rotation?: number; scaleX?: number; scaleY?: number }, drawFn: () => void): void {
    const { x = 0, y = 0, rotation = 0, scaleX = 1, scaleY = 1 } = transform

    this.ctx.save()
    this.ctx.translate(x, y)
    this.ctx.rotate(rotation)
    this.ctx.scale(scaleX, scaleY)
    drawFn()
    this.ctx.restore()
  }

  /**
   * Set global alpha for subsequent draws
   */
  setAlpha(alpha: number): void {
    this.ctx.globalAlpha = alpha
  }

  /**
   * Reset alpha to 1
   */
  resetAlpha(): void {
    this.ctx.globalAlpha = 1
  }

  /**
   * Get the underlying context for advanced operations
   */
  get context(): CanvasRenderingContext2D {
    return this.ctx
  }

  /**
   * Draw a rounded rectangle
   */
  roundRect(x: number, y: number, width: number, height: number, radius: number, options: ShapeOptions = {}): void {
    const { fill, stroke, strokeWidth = 1, alpha = 1 } = options

    this.ctx.save()
    this.ctx.globalAlpha = alpha
    this.ctx.beginPath()
    this.ctx.roundRect(x, y, width, height, radius)

    if (fill) {
      this.ctx.fillStyle = fill
      this.ctx.fill()
    }

    if (stroke) {
      this.ctx.strokeStyle = stroke
      this.ctx.lineWidth = strokeWidth
      this.ctx.stroke()
    }

    this.ctx.restore()
  }

  /**
   * Draw an arc
   */
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, options: ShapeOptions = {}): void {
    const { fill, stroke, strokeWidth = 1, alpha = 1 } = options

    this.ctx.save()
    this.ctx.globalAlpha = alpha
    this.ctx.beginPath()
    this.ctx.arc(x, y, radius, startAngle, endAngle)

    if (fill) {
      this.ctx.fillStyle = fill
      this.ctx.lineTo(x, y)
      this.ctx.closePath()
      this.ctx.fill()
    }

    if (stroke) {
      this.ctx.strokeStyle = stroke
      this.ctx.lineWidth = strokeWidth
      this.ctx.stroke()
    }

    this.ctx.restore()
  }

  /**
   * Draw a path
   */
  path(commands: (ctx: CanvasRenderingContext2D) => void, options: ShapeOptions = {}): void {
    const { fill, stroke, strokeWidth = 1, alpha = 1 } = options

    this.ctx.save()
    this.ctx.globalAlpha = alpha
    this.ctx.beginPath()
    commands(this.ctx)

    if (fill) {
      this.ctx.fillStyle = fill
      this.ctx.fill()
    }

    if (stroke) {
      this.ctx.strokeStyle = stroke
      this.ctx.lineWidth = strokeWidth
      this.ctx.stroke()
    }

    this.ctx.restore()
  }
}

/**
 * Color utilities
 */
export const color = {
  rgb(r: number, g: number, b: number): string {
    return `rgb(${r}, ${g}, ${b})`
  },

  rgba(r: number, g: number, b: number, a: number): string {
    return `rgba(${r}, ${g}, ${b}, ${a})`
  },

  hsl(h: number, s: number, l: number): string {
    return `hsl(${h}, ${s}%, ${l}%)`
  },

  hsla(h: number, s: number, l: number, a: number): string {
    return `hsla(${h}, ${s}%, ${l}%, ${a})`
  },

  lerp(color1: Color, color2: Color, t: number): Color {
    return {
      r: Math.round(color1.r + (color2.r - color1.r) * t),
      g: Math.round(color1.g + (color2.g - color1.g) * t),
      b: Math.round(color1.b + (color2.b - color1.b) * t),
      a: (color1.a ?? 1) + ((color2.a ?? 1) - (color1.a ?? 1)) * t
    }
  },

  toRgb(color: Color): string {
    if (color.a !== undefined && color.a < 1) {
      return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
    }
    return `rgb(${color.r}, ${color.g}, ${color.b})`
  },

  fromHex(hex: string): Color {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : { r: 0, g: 0, b: 0 }
  }
}
