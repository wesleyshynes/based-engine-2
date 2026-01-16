/**
 * The Squeeze - Player Entity
 * Ported to Based Engine 2.0
 */

import { GameObject, PhysicsBody, Draw, num, PhysicsWorld } from '../../../engine'
import Matter from 'matter-js'

export class Player extends GameObject {
  // Physics
  body!: PhysicsBody

  x: number = 300
  y: number = 300
  
  // Size
  radius = 50
  originalRadius = 50
  minRadius = 25
  maxRadius = 100
  activeMaxRadius = 100
  sizeSpeed = 3
  
  // Movement
  baseSpeed = 8
  
  // Visual
  color = { r: 255, g: 150, b: 50 }
  minColor = { r: 255, g: 193, b: 0 }
  maxColor = { r: 255, g: 77, b: 0 }
  
  // State
  wallCount = 0
  lastStepTime = 0
  stepInterval = 200
  
  // Callbacks
  onWallHit?: () => void
  onStep?: () => void

  create(): void {
    this.addTag('player')
    this.depth = 10
  }

  initPhysics(physics: PhysicsWorld): void {
    console.log('Player initPhysics at:', this.x, this.y, this.radius)
    this.body = physics.createCircle(this.x, this.y, this.radius, {
      label: 'player',
      friction: 0,
      frictionAir: 0.05,
      restitution: 0.3,
    })
    this.body.setPosition(this.x, this.y)
    console.log('Body created, position:', this.body.x, this.body.y)

    this.body.onCollisionStart((other) => {
      if (other.label === 'wall' || other.label === 'box') {
        this.wallCount++
        if (this.wallCount > 1) {
          this.maxRadius = this.radius
        }
        this.onWallHit?.()
        this.engine.camera.shake(5 * (this.radius / this.originalRadius))
      }
    })

    this.body.onCollisionEnd((other) => {
      if (other.label === 'wall' || other.label === 'box') {
        this.wallCount = Math.max(0, this.wallCount - 1)
        if (this.wallCount === 0) {
          this.maxRadius = this.activeMaxRadius
        }
      }
    })
  }

  update(delta: number): void {
    if (!this.body) {
      console.log('Player update called but body not initialized yet')
      return
    }

    const input = this.input
    let moveX = 0
    let moveY = 0
    let scale = 0

    // Debug log input state
    if (input.anyKey('KeyH')) {
      console.log('KeyH pressed')
      console.log(this)
    }

    // Movement
    if (input.anyKey('KeyA', 'ArrowLeft')) moveX -= 1
    if (input.anyKey('KeyD', 'ArrowRight')) moveX += 1
    if (input.anyKey('KeyW', 'ArrowUp')) moveY -= 1
    if (input.anyKey('KeyS', 'ArrowDown')) moveY += 1

    // Size change
    if (input.key('KeyZ')) scale -= 1
    if (input.key('KeyX') && this.wallCount < 2) scale += 1

    // console.log(`Player input: moveX=${moveX}, moveY=${moveY}, scale=${scale}`)

    // Apply movement via physics - use Matter.Body.setVelocity directly
    if (moveX !== 0 || moveY !== 0) {
      const len = Math.sqrt(moveX * moveX + moveY * moveY)
      const vx = (moveX / len) * this.baseSpeed
      const vy = (moveY / len) * this.baseSpeed
      Matter.Body.setVelocity(this.body._matterBody, { x: vx, y: vy })
      
      // Play step sound
      if (this.time - this.lastStepTime > this.stepInterval) {
        this.onStep?.()
        this.lastStepTime = this.time
      }
    } else {
      // Dampen velocity when not moving
      const vel = this.body._matterBody.velocity
      Matter.Body.setVelocity(this.body._matterBody, { x: vel.x * 0.8, y: vel.y * 0.8 })
    }

    // Apply size change
    if (scale !== 0) {
      const newRadius = num.clamp(
        this.radius + scale * this.sizeSpeed * delta * 60,
        this.minRadius,
        this.maxRadius
      )
      
      if (newRadius !== this.radius) {
        const scaleFactor = newRadius / this.radius
        Matter.Body.scale(this.body._matterBody, scaleFactor, scaleFactor)
        this.radius = newRadius
        this.body._radius = newRadius
      }
    }

    // Update position from physics body
    this.x = this.body._matterBody.position.x
    this.y = this.body._matterBody.position.y

    // Update color based on size
    this._updateColor()
  }

  private _updateColor(): void {
    const t = (this.radius - this.minRadius) / (this.maxRadius - this.minRadius)
    this.color = {
      r: Math.round(num.lerp(this.minColor.r, this.maxColor.r, t)),
      g: Math.round(num.lerp(this.minColor.g, this.maxColor.g, t)),
      b: Math.round(num.lerp(this.minColor.b, this.maxColor.b, t))
    }
  }

  draw(draw: Draw): void {
    // Debug log position
    // console.log('Player draw:', this.x, this.y, this.radius)
    
    // Simple bright circle for debugging
    draw.circle(this.x, this.y, this.radius, {
      fill: '#ff6600',
      stroke: '#ffffff',
      strokeWidth: 4
    })

    // Face (eyes)
    const eyeOffset = this.radius * 0.3
    const eyeRadius = this.radius * 0.15
    
    draw.circle(this.x - eyeOffset, this.y - eyeOffset * 0.5, eyeRadius, {
      fill: '#fff'
    })
    draw.circle(this.x + eyeOffset, this.y - eyeOffset * 0.5, eyeRadius, {
      fill: '#fff'
    })
    
    // Pupils
    const pupilRadius = eyeRadius * 0.5
    draw.circle(this.x - eyeOffset, this.y - eyeOffset * 0.5, pupilRadius, {
      fill: '#000'
    })
    draw.circle(this.x + eyeOffset, this.y - eyeOffset * 0.5, pupilRadius, {
      fill: '#000'
    })
  }

  reset(x: number, y: number): void {
    this.x = x
    this.y = y
    this.radius = this.originalRadius
    this.maxRadius = this.activeMaxRadius
    this.wallCount = 0
    if (this.body) {
      this.body.setPosition(x, y)
      this.body.setVelocity(0, 0)
    }
  }
}
