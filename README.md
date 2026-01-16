# Based Engine 2.0

A TypeScript game engine for web browsers. Built for simplicity, flexibility, and ease of use.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Creating a New Game

```bash
npm run new-game -- --name MyGame
```

This creates a scaffolded game in `src/games/my-game/` with:
- `index.ts` - Game entry point
- `levels/MainLevel.ts` - Starting level
- `entities/` - Directory for game objects

## Engine Architecture

### Core Concepts

- **Engine** - Main game loop, canvas management, level loading
- **Level** - Contains game logic, manages objects
- **GameObject** - Base class for all game entities
- **Draw** - Simplified drawing API

### Key Improvements from v1

1. **Automatic Camera Transforms** - No more manual `cameraPos` everywhere
2. **Cleaner Drawing API** - Simple, consistent methods
3. **Better UI Components** - Fewer fields, auto-positioning helpers
4. **Unified Input System** - Keyboard, mouse, touch in one place
5. **Simple Save System** - localStorage with type safety
6. **Vite Build** - Fast development, easy bundling

## API Overview

### Engine Setup

```typescript
import { BasedEngine } from './engine'
import { MyLevel } from './levels/MyLevel'

const engine = new BasedEngine({
  containerId: 'game-container',
  backgroundColor: '#1a1a2e',
  debug: true
})

engine.registerLevels([
  { key: 'main', levelClass: MyLevel }
])

engine.start('main')
```

### Creating a Level

```typescript
import { BasedLevel, Draw } from '../engine'

export class MyLevel extends BasedLevel {
  async preload() {
    // Load assets
    this.engine.setLoadingProgress(0.5, 'Loading...')
  }

  create() {
    // Initialize level
    this.camera.setPosition(400, 300)
  }

  update(delta: number) {
    // Game logic (delta in seconds)
  }

  draw(draw: Draw) {
    // World drawing (camera applied)
    draw.circle(100, 100, 50, { fill: 'red' })
  }

  drawUI(draw: Draw) {
    // UI drawing (screen coordinates)
    draw.text('Score: 0', 10, 10, { color: '#fff' })
  }

  resize() {
    // Handle window resize
  }
}
```

### Creating Game Objects

```typescript
import { GameObject, Draw } from '../engine'

export class Player extends GameObject {
  speed = 200

  create() {
    this.addTag('player')
  }

  update(delta: number) {
    const move = this.input.moveVector
    this.x += move.x * this.speed * delta
    this.y += move.y * this.speed * delta
  }

  draw(draw: Draw) {
    draw.circle(this.x, this.y, 20, {
      fill: '#4CAF50',
      stroke: '#fff',
      strokeWidth: 2
    })
  }
}

// In your level:
const player = new Player(this, 'player')
player.setPosition(100, 100)
this.addObject(player)
```

### Input System

```typescript
// Keyboard
if (this.input.key('Space')) { /* held */ }
if (this.input.keyPressed('Space')) { /* just pressed */ }
if (this.input.keyReleased('Space')) { /* just released */ }

// Movement helpers
const move = this.input.moveVector  // Normalized WASD/Arrow input
const h = this.input.horizontalAxis // -1 to 1
const v = this.input.verticalAxis   // -1 to 1

// Mouse/Touch
const pos = this.input.pointerScreen // Screen coordinates
const worldPos = this.input.pointerWorld // World coordinates
if (this.input.pointerPressed) { /* just clicked/tapped */ }
if (this.input.pointerDown) { /* held */ }
```

### Drawing API

```typescript
// Shapes
draw.rect(x, y, width, height, { fill, stroke, strokeWidth })
draw.rectCentered(x, y, width, height, options)
draw.circle(x, y, radius, { fill, stroke, strokeWidth })
draw.ellipse(x, y, radiusX, radiusY, options)
draw.line(x1, y1, x2, y2, { color, width })
draw.polygon(points, { fill, stroke })
draw.roundRect(x, y, width, height, radius, options)

// Text
draw.text('Hello', x, y, {
  size: 16,
  font: 'sans-serif',
  color: '#fff',
  align: 'center',  // 'left' | 'center' | 'right'
  baseline: 'middle' // 'top' | 'middle' | 'bottom'
})
draw.textMultiline(text, x, y, { lineHeight: 24, ...options })

// Images
const img = await loadImage('/sprites/player.png')
draw.image(img, x, y, { width, height, rotation, flipX, flipY })
draw.sprite(img, x, y, {
  frameX: 0,
  frameY: 0,
  frameWidth: 32,
  frameHeight: 32
})

// Transforms
draw.rotated(x, y, angle, () => {
  draw.rect(-25, -25, 50, 50, { fill: 'red' })
})
```

### Camera

```typescript
// Position
this.camera.setPosition(x, y)
this.camera.setTarget({ x, y })  // Smooth move

// Following
this.camera.follow(player.position, 5)  // speed = 5
this.camera.stopFollowing()

// Zoom
this.camera.setZoom(1.5)

// Bounds
this.camera.setBounds(levelWidth, levelHeight)

// Screen shake
this.camera.shake(10, 200)  // intensity, duration ms

// Coordinate conversion
const screenPos = this.camera.worldToScreen(worldPos)
const worldPos = this.camera.screenToWorld(screenPos)
```

### Physics (Matter.js)

```typescript
import { PhysicsWorld } from '../engine'

// In level create():
this.physics = new PhysicsWorld({ gravity: { x: 0, y: 1 } })

// Create bodies
const body = this.physics.createCircle(x, y, radius, {
  friction: 0.1,
  restitution: 0.5,
  label: 'player'
})

const wall = this.physics.createRect(x, y, width, height, {
  isStatic: true,
  label: 'wall'
})

// Collisions
body.onCollisionStart((other, pair) => {
  if (other.label === 'wall') {
    console.log('Hit wall!')
  }
})

// Update in level update():
this.physics.update(delta)
```

### UI Components

```typescript
import { Button, Label, TouchKnob, ProgressBar } from '../engine'

// Button
const btn = new Button(this.engine, {
  x: 100, y: 100,
  width: 150, height: 40,
  text: 'Click Me',
  onClick: () => console.log('Clicked!')
})
btn.centerX()  // Center horizontally
btn.fromRight(20)  // 20px from right edge

// Label
const label = new Label(this.engine, {
  text: 'Score: 0',
  style: { fontSize: 24, color: '#fff' }
})
label.centerX().y = 50

// Touch joystick
const knob = new TouchKnob(this.engine)
knob.bottomLeft(30)  // Position in bottom-left

// In update:
btn.update()
knob.update()
const dir = knob.direction  // { x: -1 to 1, y: -1 to 1 }

// In drawUI:
btn.draw(draw)
knob.draw(draw)
```

### Sound

```typescript
// Load
await this.sound.loadSound('/sounds/jump.mp3', 'jump')
await this.sound.loadMusic('/music/theme.mp3', 'theme')

// Play
this.sound.play('jump')
this.sound.play('jump', { volume: 0.5 })

// Music
this.sound.playMusic('theme', { fadeIn: 1000 })
this.sound.stopMusic(500)  // Fade out

// Synth sounds (no loading needed)
this.sound.playNote(440, 0.2, 'sine')  // A4 note
```

### Save System

```typescript
// Save
this.save.save('highscore', 1000)
this.save.save('settings', { sound: true, music: true })

// Load
const score = this.save.load('highscore', 0)  // default: 0
const settings = this.save.load('settings', { sound: true, music: true })

// Check/Delete
if (this.save.has('highscore')) { ... }
this.save.delete('highscore')
this.save.clear()  // Clear all
```

### Math Utilities

```typescript
import { vec2, angle, num, random, ease } from '../engine'

// Vectors
const v = vec2.create(10, 20)
const dist = vec2.distance(a, b)
const normalized = vec2.normalize(v)
const lerped = vec2.lerp(a, b, 0.5)

// Angles
const rad = angle.toRadians(90)
const deg = angle.toDegrees(Math.PI)

// Numbers
const clamped = num.clamp(value, 0, 100)
const mapped = num.map(value, 0, 1, 0, 255)
const approached = num.approach(current, target, speed * delta)

// Random
const item = random.pick(['a', 'b', 'c'])
const shuffled = random.shuffle([1, 2, 3])
if (random.chance(0.5)) { /* 50% chance */ }

// Easing
const t = ease.quadOut(progress)  // 0 to 1
```

## Project Structure

```
based-engine-2/
├── src/
│   ├── engine/           # Core engine code
│   │   ├── Camera.ts
│   │   ├── Draw.ts
│   │   ├── Engine.ts
│   │   ├── GameObject.ts
│   │   ├── Input.ts
│   │   ├── Level.ts
│   │   ├── Physics.ts
│   │   ├── Save.ts
│   │   ├── Sound.ts
│   │   ├── UI.ts
│   │   ├── math.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── games/            # Your games
│   │   └── the-squeeze/
│   │       ├── entities/
│   │       ├── levels/
│   │       └── index.ts
│   └── main.ts           # Entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## License

MIT
