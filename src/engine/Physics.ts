/**
 * Based Engine 2.0 - Physics System
 * Built on Matter.js with simplified API
 */

import Matter from 'matter-js'
import type { Vec2 } from './types'

// Debug: Check if Matter loaded correctly
console.log('Matter.js loaded:', Matter)
console.log('Matter.Bodies:', Matter.Bodies)
console.log('Matter.Engine:', Matter.Engine)

export type CollisionCallback = (other: PhysicsBody, pair: Matter.Pair) => void

export interface BodyOptions {
  isStatic?: boolean
  isSensor?: boolean
  friction?: number
  frictionAir?: number
  frictionStatic?: number
  restitution?: number
  density?: number
  mass?: number
  angle?: number
  label?: string
  inertia?: number
}

export class PhysicsWorld {
  private _engine: Matter.Engine
  private _world: Matter.World
  private _bodies = new Map<string, PhysicsBody>()
  private _nextId = 0
  private _physicsRate = 1000 / 60  // Fixed timestep like original

  gravity: Vec2 = { x: 0, y: 1 }

  constructor(options: { gravity?: Vec2 } = {}) {
    // Create engine - same as original: Physics.Engine.create()
    this._engine = Matter.Engine.create()
    this._world = this._engine.world

    if (options.gravity) {
      this.gravity = options.gravity
    }
    this._world.gravity.x = this.gravity.x
    this._world.gravity.y = this.gravity.y

    // Set up collision events - same pattern as original
    Matter.Events.on(this._engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) {
        const bodyA = this._getBodyFromMatter(pair.bodyA)
        const bodyB = this._getBodyFromMatter(pair.bodyB)

        if (bodyA && bodyB) {
          bodyA._onCollisionStart(bodyB, pair)
          bodyB._onCollisionStart(bodyA, pair)
        }
      }
    })

    Matter.Events.on(this._engine, 'collisionEnd', (event) => {
      for (const pair of event.pairs) {
        const bodyA = this._getBodyFromMatter(pair.bodyA)
        const bodyB = this._getBodyFromMatter(pair.bodyB)

        if (bodyA && bodyB) {
          bodyA._onCollisionEnd(bodyB, pair)
          bodyB._onCollisionEnd(bodyA, pair)
        }
      }
    })

    console.log('PhysicsWorld created, engine:', this._engine, 'world:', this._world)
  }

  private _getBodyFromMatter(matterBody: Matter.Body): PhysicsBody | undefined {
    const plugin = matterBody.plugin as { physicsBody?: PhysicsBody }
    return plugin?.physicsBody
  }

  private _generateId(): string {
    return `body_${this._nextId++}`
  }

  /**
   * Update physics simulation - use fixed timestep like original
   */
  update(_delta: number): void {

    // Use fixed timestep like original: Physics.Engine.update(this.physics, this.physicsRate)
    Matter.Engine.update(this._engine, this._physicsRate)

  }

  /**
   * Set gravity
   */
  setGravity(x: number, y: number): void {
    this.gravity = { x, y }
    this._world.gravity.x = x
    this._world.gravity.y = y
  }

  /**
   * Create a circle body
   */
  createCircle(x: number, y: number, radius: number, options: BodyOptions = {}): PhysicsBody {
    const body = new PhysicsBody(this._generateId())
    const matterBody = Matter.Bodies.circle(x, y, radius, {
      ...this._convertOptions(options),
      plugin: { physicsBody: body }
    })
    body._matterBody = matterBody
    body._radius = radius
    body._type = 'circle'

    this._bodies.set(body.id, body)
    // Add to world - same as original: Physics.Composite.add(this.physics.world, bodyRef)
    Matter.Composite.add(this._world, matterBody)

    return body
  }

  /**
   * Create a rectangle body
   */
  createRect(x: number, y: number, width: number, height: number, options: BodyOptions = {}): PhysicsBody {
    const body = new PhysicsBody(this._generateId())
    body._matterBody = Matter.Bodies.rectangle(x, y, width, height, {
      ...this._convertOptions(options),
      plugin: { physicsBody: body }
    })
    body._width = width
    body._height = height
    body._type = 'rect'

    this._bodies.set(body.id, body)
    Matter.Composite.add(this._world, body._matterBody)

    return body
  }

  /**
   * Create a polygon body
   */
  createPolygon(x: number, y: number, sides: number, radius: number, options: BodyOptions = {}): PhysicsBody {
    const body = new PhysicsBody(this._generateId())
    body._matterBody = Matter.Bodies.polygon(x, y, sides, radius, {
      ...this._convertOptions(options),
      plugin: { physicsBody: body }
    })
    body._radius = radius
    body._type = 'polygon'

    this._bodies.set(body.id, body)
    Matter.Composite.add(this._world, body._matterBody)

    return body
  }

  /**
   * Create body from vertices
   */
  createFromVertices(x: number, y: number, vertices: Vec2[], options: BodyOptions = {}): PhysicsBody {
    const body = new PhysicsBody(this._generateId())
    body._matterBody = Matter.Bodies.fromVertices(x, y, [vertices as Matter.Vector[]], {
      ...this._convertOptions(options),
      plugin: { physicsBody: body }
    })
    body._type = 'vertices'

    this._bodies.set(body.id, body)
    Matter.Composite.add(this._world, body._matterBody)

    return body
  }

  /**
   * Remove a body from the world
   */
  removeBody(body: PhysicsBody): void {
    this._bodies.delete(body.id)
    Matter.Composite.remove(this._world, body._matterBody)
  }

  /**
   * Get all bodies
   */
  getBodies(): PhysicsBody[] {
    return Array.from(this._bodies.values())
  }

  /**
   * Find bodies by label
   */
  getBodiesByLabel(label: string): PhysicsBody[] {
    return this.getBodies().filter(b => b.label === label)
  }

  /**
   * Query bodies in a region
   */
  queryRect(x: number, y: number, width: number, height: number): PhysicsBody[] {
    const bounds = {
      min: { x, y },
      max: { x: x + width, y: y + height }
    }
    const found = Matter.Query.region(
      Array.from(this._bodies.values()).map(b => b._matterBody),
      bounds
    )
    return found.map(b => (b.plugin as { physicsBody: PhysicsBody }).physicsBody).filter(Boolean)
  }

  /**
   * Cast a ray and get intersections
   */
  raycast(start: Vec2, end: Vec2): { body: PhysicsBody; point: Vec2 }[] {
    const bodies = Array.from(this._bodies.values()).map(b => b._matterBody)
    const collisions = Matter.Query.ray(bodies, start as Matter.Vector, end as Matter.Vector)

    return collisions.map(c => ({
      body: (c.bodyA.plugin as { physicsBody: PhysicsBody }).physicsBody,
      point: { x: c.bodyA.position.x, y: c.bodyA.position.y }
    }))
  }

  private _convertOptions(options: BodyOptions): Matter.IChamferableBodyDefinition {
    const result: Matter.IChamferableBodyDefinition = {
      isStatic: options.isStatic ?? false,
      isSensor: options.isSensor ?? false,
      friction: options.friction ?? 0.1,
      frictionAir: options.frictionAir ?? 0.01,
      frictionStatic: options.frictionStatic ?? 0.5,
      restitution: options.restitution ?? 0,
      angle: options.angle ?? 0,
      label: options.label ?? '',
    }

    // Only include these if explicitly set, as undefined values can cause NaN issues
    if (options.density !== undefined) result.density = options.density
    if (options.mass !== undefined) result.mass = options.mass
    if (options.inertia !== undefined) result.inertia = options.inertia

    return result
  }

  /**
   * Get underlying Matter.js engine (for advanced use)
   */
  get matterEngine(): Matter.Engine {
    return this._engine
  }
}

export class PhysicsBody {
  readonly id: string

  _matterBody!: Matter.Body
  _type: 'circle' | 'rect' | 'polygon' | 'vertices' = 'rect'
  _radius = 0
  _width = 0
  _height = 0

  private _collisionStartCallbacks: CollisionCallback[] = []
  private _collisionEndCallbacks: CollisionCallback[] = []

  // User data
  data: Record<string, unknown> = {}

  constructor(id: string) {
    this.id = id
  }

  // Position
  get x(): number {
    if (!this._matterBody) {
      console.warn('PhysicsBody._matterBody is undefined!')
      return 0
    }
    return this._matterBody.position.x
  }
  set x(v: number) { Matter.Body.setPosition(this._matterBody, { x: v, y: this.y }) }

  get y(): number {
    if (!this._matterBody) {
      console.warn('PhysicsBody._matterBody is undefined!')
      return 0
    }
    return this._matterBody.position.y
  }
  set y(v: number) { Matter.Body.setPosition(this._matterBody, { x: this.x, y: v }) }

  get position(): Vec2 { return { x: this.x, y: this.y } }
  set position(pos: Vec2) { Matter.Body.setPosition(this._matterBody, pos as Matter.Vector) }

  setPosition(x: number, y: number): this {
    Matter.Body.setPosition(this._matterBody, { x, y })
    return this
  }

  // Velocity
  get velocity(): Vec2 {
    return { x: this._matterBody.velocity.x, y: this._matterBody.velocity.y }
  }

  set velocity(vel: Vec2) {
    Matter.Body.setVelocity(this._matterBody, vel as Matter.Vector)
  }

  setVelocity(x: number, y: number): this {
    Matter.Body.setVelocity(this._matterBody, { x, y })
    return this
  }

  // Angular
  get angle(): number { return this._matterBody.angle }
  set angle(v: number) { Matter.Body.setAngle(this._matterBody, v) }

  get angularVelocity(): number { return this._matterBody.angularVelocity }
  set angularVelocity(v: number) { Matter.Body.setAngularVelocity(this._matterBody, v) }

  // Properties
  get isStatic(): boolean { return this._matterBody.isStatic }
  set isStatic(v: boolean) { Matter.Body.setStatic(this._matterBody, v) }

  get isSensor(): boolean { return this._matterBody.isSensor }

  get label(): string { return this._matterBody.label }
  set label(v: string) { this._matterBody.label = v }

  get mass(): number { return this._matterBody.mass }

  // Dimensions (for rendering)
  get radius(): number { return this._radius }
  get width(): number { return this._width }
  get height(): number { return this._height }
  get type(): string { return this._type }

  get vertices(): Vec2[] {
    return this._matterBody.vertices.map(v => ({ x: v.x, y: v.y }))
  }

  // Forces
  applyForce(force: Vec2, point?: Vec2): this {
    const pos = point ?? this.position
    Matter.Body.applyForce(this._matterBody, pos as Matter.Vector, force as Matter.Vector)
    return this
  }

  applyImpulse(impulse: Vec2): this {
    Matter.Body.setVelocity(this._matterBody, {
      x: this._matterBody.velocity.x + impulse.x / this.mass,
      y: this._matterBody.velocity.y + impulse.y / this.mass
    })
    return this
  }

  // Scale
  scale(scaleX: number, scaleY?: number, point?: Vec2): this {
    Matter.Body.scale(this._matterBody, scaleX, scaleY ?? scaleX, point as Matter.Vector)
    if (this._type === 'circle') {
      this._radius *= scaleX
    } else if (this._type === 'rect') {
      this._width *= scaleX
      this._height *= (scaleY ?? scaleX)
    }
    return this
  }

  // Collision callbacks
  onCollisionStart(callback: CollisionCallback): this {
    this._collisionStartCallbacks.push(callback)
    return this
  }

  onCollisionEnd(callback: CollisionCallback): this {
    this._collisionEndCallbacks.push(callback)
    return this
  }

  /** @internal */
  _onCollisionStart(other: PhysicsBody, pair: Matter.Pair): void {
    for (const cb of this._collisionStartCallbacks) {
      cb(other, pair)
    }
  }

  /** @internal */
  _onCollisionEnd(other: PhysicsBody, pair: Matter.Pair): void {
    for (const cb of this._collisionEndCallbacks) {
      cb(other, pair)
    }
  }
}
