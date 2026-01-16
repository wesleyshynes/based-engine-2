/**
 * The Squeeze - Exit Door Entity
 */

import { GameObject, PhysicsBody, Draw } from '../../../engine'

export class ExitDoor extends GameObject {
  body!: PhysicsBody
  width = 80
  height = 80
  maxRadius = 50  // Player must be this size or smaller to exit
  
  // Visual
  pulsePhase = 0
  
  // Callback
  onPlayerEnter?: () => void

  create(): void {
    this.addTag('exit')
    this.depth = -1
  }

  initPhysics(physics: import('../../../engine').PhysicsWorld): void {
    this.body = physics.createRect(
      this.x,
      this.y,
      this.width,
      this.height,
      {
        isStatic: true,
        isSensor: true,
        label: 'exit'
      }
    )
  }

  checkPlayer(player: import('./Player').Player): boolean {
    const dx = Math.abs(player.x - this.x)
    const dy = Math.abs(player.y - this.y)
    const inRange = dx < this.width / 2 && dy < this.height / 2
    const smallEnough = player.radius <= this.maxRadius

    if (inRange && smallEnough) {
      this.onPlayerEnter?.()
      return true
    }

    return false
  }

  update(delta: number): void {
    this.pulsePhase += delta * 3
  }

  draw(draw: Draw): void {
    const pulse = Math.sin(this.pulsePhase) * 0.2 + 0.8
    const alpha = pulse

    // Glow effect
    draw.circle(this.x, this.y, this.maxRadius + 10, {
      fill: `rgba(0, 255, 100, ${alpha * 0.3})`
    })

    // Door outline
    draw.rect(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height,
      {
        stroke: `rgba(0, 255, 100, ${alpha})`,
        strokeWidth: 3
      }
    )

    // Size indicator
    draw.circle(this.x, this.y, this.maxRadius, {
      stroke: `rgba(255, 255, 255, ${alpha * 0.5})`,
      strokeWidth: 2
    })

    // Arrow indicator
    const arrowSize = 15
    draw.polygon([
      { x: this.x, y: this.y - arrowSize },
      { x: this.x - arrowSize, y: this.y + arrowSize / 2 },
      { x: this.x + arrowSize, y: this.y + arrowSize / 2 }
    ], {
      fill: `rgba(0, 255, 100, ${alpha})`
    })
  }
}
