/**
 * Based Engine 2.0 - UI System
 * Simple, declarative UI components
 */

import type { BasedEngine } from './Engine'
import type { Vec2 } from './types'
import { Draw } from './Draw'

// ============================================
// Button
// ============================================

export interface ButtonStyle {
  fill?: string
  hoverFill?: string
  pressFill?: string
  stroke?: string
  strokeWidth?: number
  textColor?: string
  textHoverColor?: string
  font?: string
  fontSize?: number
  radius?: number
}

const defaultButtonStyle: Required<ButtonStyle> = {
  fill: '#444',
  hoverFill: '#666',
  pressFill: '#333',
  stroke: '#888',
  strokeWidth: 2,
  textColor: '#fff',
  textHoverColor: '#fff',
  font: 'sans-serif',
  fontSize: 16,
  radius: 4
}

export class Button {
  x = 0
  y = 0
  width = 100
  height = 40
  text = 'Button'
  style: Required<ButtonStyle>
  visible = true
  enabled = true

  private _hovered = false
  private _pressed = false
  private _engine: BasedEngine

  onClick?: () => void
  onHold?: () => void

  constructor(engine: BasedEngine, options: Partial<{
    x: number
    y: number
    width: number
    height: number
    text: string
    style: ButtonStyle
    onClick: () => void
    onHold: () => void
  }> = {}) {
    this._engine = engine
    this.x = options.x ?? 0
    this.y = options.y ?? 0
    this.width = options.width ?? 100
    this.height = options.height ?? 40
    this.text = options.text ?? 'Button'
    this.style = { ...defaultButtonStyle, ...options.style }
    this.onClick = options.onClick
    this.onHold = options.onHold
  }

  update(): void {
    if (!this.visible || !this.enabled) {
      this._hovered = false
      this._pressed = false
      return
    }

    const input = this._engine.input
    const mx = input.mouse.x
    const my = input.mouse.y

    // Check hover
    this._hovered = mx >= this.x && mx <= this.x + this.width &&
                    my >= this.y && my <= this.y + this.height

    // Check click
    if (this._hovered) {
      if (input.pointerDown) {
        this._pressed = true
        if (this.onHold) {
          this.onHold()
        }
      } else if (this._pressed && input.pointerReleased) {
        this._pressed = false
        if (this.onClick) {
          this.onClick()
        }
      }
    } else {
      this._pressed = false
    }

    if (!input.pointerDown) {
      this._pressed = false
    }
  }

  draw(draw: Draw): void {
    if (!this.visible) return

    const s = this.style
    const fill = !this.enabled ? '#333' :
                 this._pressed ? s.pressFill :
                 this._hovered ? s.hoverFill : s.fill
    const textColor = this._hovered ? s.textHoverColor : s.textColor

    // Background
    draw.roundRect(this.x, this.y, this.width, this.height, s.radius, {
      fill,
      stroke: s.stroke,
      strokeWidth: s.strokeWidth
    })

    // Text
    draw.text(this.text, this.x + this.width / 2, this.y + this.height / 2, {
      size: s.fontSize,
      font: s.font,
      color: this.enabled ? textColor : '#666',
      align: 'center',
      baseline: 'middle'
    })
  }

  get hovered(): boolean { return this._hovered }
  get pressed(): boolean { return this._pressed }

  /**
   * Center the button horizontally on screen
   */
  centerX(): this {
    this.x = (this._engine.width - this.width) / 2
    return this
  }

  /**
   * Center the button vertically on screen
   */
  centerY(): this {
    this.y = (this._engine.height - this.height) / 2
    return this
  }

  /**
   * Set position
   */
  setPosition(x: number, y: number): this {
    this.x = x
    this.y = y
    return this
  }

  /**
   * Position relative to screen edge
   */
  fromRight(offset: number): this {
    this.x = this._engine.width - this.width - offset
    return this
  }

  fromBottom(offset: number): this {
    this.y = this._engine.height - this.height - offset
    return this
  }
}

// ============================================
// Label (Text)
// ============================================

export interface LabelStyle {
  color?: string
  font?: string
  fontSize?: number
  align?: CanvasTextAlign
  baseline?: CanvasTextBaseline
  stroke?: string
  strokeWidth?: number
}

const defaultLabelStyle: Required<LabelStyle> = {
  color: '#fff',
  font: 'sans-serif',
  fontSize: 16,
  align: 'left',
  baseline: 'top',
  stroke: '',
  strokeWidth: 0
}

export class Label {
  x = 0
  y = 0
  text = ''
  style: Required<LabelStyle>
  visible = true

  private _engine: BasedEngine

  constructor(engine: BasedEngine, options: Partial<{
    x: number
    y: number
    text: string
    style: LabelStyle
  }> = {}) {
    this._engine = engine
    this.x = options.x ?? 0
    this.y = options.y ?? 0
    this.text = options.text ?? ''
    this.style = { ...defaultLabelStyle, ...options.style }
  }

  draw(draw: Draw): void {
    if (!this.visible || !this.text) return

    const s = this.style
    draw.text(this.text, this.x, this.y, {
      size: s.fontSize,
      font: s.font,
      color: s.color,
      align: s.align,
      baseline: s.baseline,
      stroke: s.stroke || undefined,
      strokeWidth: s.strokeWidth
    })
  }

  centerX(): this {
    this.style.align = 'center'
    this.x = this._engine.width / 2
    return this
  }

  centerY(): this {
    this.style.baseline = 'middle'
    this.y = this._engine.height / 2
    return this
  }
}

// ============================================
// Panel (Container)
// ============================================

export interface PanelStyle {
  fill?: string
  stroke?: string
  strokeWidth?: number
  radius?: number
  padding?: number
}

const defaultPanelStyle: Required<PanelStyle> = {
  fill: 'rgba(0, 0, 0, 0.7)',
  stroke: '#fff',
  strokeWidth: 2,
  radius: 8,
  padding: 16
}

export class Panel {
  x = 0
  y = 0
  width = 200
  height = 150
  style: Required<PanelStyle>
  visible = true

  private _engine: BasedEngine

  constructor(engine: BasedEngine, options: Partial<{
    x: number
    y: number
    width: number
    height: number
    style: PanelStyle
  }> = {}) {
    this._engine = engine
    this.x = options.x ?? 0
    this.y = options.y ?? 0
    this.width = options.width ?? 200
    this.height = options.height ?? 150
    this.style = { ...defaultPanelStyle, ...options.style }
  }

  draw(draw: Draw): void {
    if (!this.visible) return

    const s = this.style
    draw.roundRect(this.x, this.y, this.width, this.height, s.radius, {
      fill: s.fill,
      stroke: s.stroke,
      strokeWidth: s.strokeWidth
    })
  }

  centerX(): this {
    this.x = (this._engine.width - this.width) / 2
    return this
  }

  centerY(): this {
    this.y = (this._engine.height - this.height) / 2
    return this
  }
}

// ============================================
// Touch Knob (Virtual Joystick)
// ============================================

export interface TouchKnobStyle {
  baseColor?: string
  knobColor?: string
  baseRadius?: number
  knobRadius?: number
  alpha?: number
}

const defaultKnobStyle: Required<TouchKnobStyle> = {
  baseColor: 'rgba(255, 255, 255, 0.3)',
  knobColor: 'rgba(255, 255, 255, 0.6)',
  baseRadius: 60,
  knobRadius: 25,
  alpha: 1
}

export class TouchKnob {
  x = 0
  y = 0
  style: Required<TouchKnobStyle>
  visible = true
  enabled = true
  maxOffset = 50

  private _engine: BasedEngine
  private _active = false
  private _knobX = 0
  private _knobY = 0
  private _touchId: number | null = null

  constructor(engine: BasedEngine, options: Partial<{
    x: number
    y: number
    style: TouchKnobStyle
    maxOffset: number
  }> = {}) {
    this._engine = engine
    this.x = options.x ?? 100
    this.y = options.y ?? 100
    this.style = { ...defaultKnobStyle, ...options.style }
    this.maxOffset = options.maxOffset ?? 50
  }

  update(): void {
    if (!this.visible || !this.enabled) {
      this._active = false
      return
    }

    const input = this._engine.input
    
    if (!input.isTouchDevice) {
      this._active = false
      return
    }

    // Handle touch
    if (!this._active && input.pointerPressed) {
      const mx = input.mouse.x
      const my = input.mouse.y
      const dist = Math.sqrt((mx - this.x) ** 2 + (my - this.y) ** 2)
      
      if (dist <= this.style.baseRadius) {
        this._active = true
        // Find touch ID
        for (const [id] of input.touches) {
          this._touchId = id
          break
        }
      }
    }

    if (this._active) {
      const touch = this._touchId !== null ? input.touches.get(this._touchId) : null
      
      if (touch || input.pointerDown) {
        const mx = touch?.x ?? input.mouse.x
        const my = touch?.y ?? input.mouse.y
        
        let dx = mx - this.x
        let dy = my - this.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        if (dist > this.maxOffset) {
          const ratio = this.maxOffset / dist
          dx *= ratio
          dy *= ratio
        }
        
        this._knobX = dx
        this._knobY = dy
      } else {
        this._active = false
        this._knobX = 0
        this._knobY = 0
        this._touchId = null
      }
    }
  }

  draw(draw: Draw): void {
    if (!this.visible) return

    const s = this.style

    // Base circle
    draw.circle(this.x, this.y, s.baseRadius, {
      fill: s.baseColor,
      alpha: s.alpha
    })

    // Knob
    draw.circle(this.x + this._knobX, this.y + this._knobY, s.knobRadius, {
      fill: s.knobColor,
      alpha: s.alpha
    })
  }

  /**
   * Get normalized direction (-1 to 1)
   */
  get direction(): Vec2 {
    if (!this._active) return { x: 0, y: 0 }
    return {
      x: this._knobX / this.maxOffset,
      y: this._knobY / this.maxOffset
    }
  }

  get active(): boolean {
    return this._active
  }

  /**
   * Position in bottom-left
   */
  bottomLeft(padding = 20): this {
    this.x = this.style.baseRadius + padding
    this.y = this._engine.height - this.style.baseRadius - padding
    return this
  }

  /**
   * Position in bottom-right
   */
  bottomRight(padding = 20): this {
    this.x = this._engine.width - this.style.baseRadius - padding
    this.y = this._engine.height - this.style.baseRadius - padding
    return this
  }
}

// ============================================
// Progress Bar
// ============================================

export class ProgressBar {
  x = 0
  y = 0
  width = 100
  height = 20
  value = 0  // 0 to 1
  visible = true

  fillColor = '#4CAF50'
  backgroundColor = '#333'
  borderColor = '#fff'
  borderWidth = 2

  constructor(_engine: BasedEngine, options: Partial<{
    x: number
    y: number
    width: number
    height: number
    value: number
    fillColor: string
    backgroundColor: string
    borderColor: string
  }> = {}) {
    Object.assign(this, options)
  }

  draw(draw: Draw): void {
    if (!this.visible) return

    // Background
    draw.rect(this.x, this.y, this.width, this.height, {
      fill: this.backgroundColor,
      stroke: this.borderColor,
      strokeWidth: this.borderWidth
    })

    // Fill
    const fillWidth = (this.width - this.borderWidth * 2) * Math.max(0, Math.min(1, this.value))
    if (fillWidth > 0) {
      draw.rect(
        this.x + this.borderWidth,
        this.y + this.borderWidth,
        fillWidth,
        this.height - this.borderWidth * 2,
        { fill: this.fillColor }
      )
    }
  }
}
