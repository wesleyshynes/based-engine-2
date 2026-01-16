/**
 * The Squeeze - Wall Entity
 */

import { GameObject, PhysicsBody, Draw, PhysicsWorld, BasedLevel } from '../../../engine'

export class Wall extends GameObject {
  body!: PhysicsBody
  width = 100
  height = 100
  color = '#555'

  create(): void {
    this.addTag('wall')
    this.depth = 0
  }

  initPhysics(physics: PhysicsWorld): void {
    this.body = physics.createRect(
      this.x + this.width / 2,
      this.y + this.height / 2,
      this.width,
      this.height,
      {
        isStatic: true,
        label: 'wall',
        friction: 0.5
      }
    )
  }

  draw(draw: Draw): void {
    draw.rect(this.x, this.y, this.width, this.height, {
      fill: this.color,
      stroke: '#333',
      strokeWidth: 2
    })
  }

  static createBoundary(
    level: BasedLevel,
    x: number,
    y: number,
    width: number,
    height: number,
    physics: PhysicsWorld
  ): Wall {
    const wall = new Wall(level)
    wall.x = x
    wall.y = y
    wall.width = width
    wall.height = height
    wall.initPhysics(physics)
    return wall
  }
}
