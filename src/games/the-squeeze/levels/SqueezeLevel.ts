/**
 * The Squeeze - Base Level
 * Common functionality for all squeeze levels
 */

import { 
  BasedLevel, 
  PhysicsWorld, 
  Button, 
  Label, 
  TouchKnob,
  Draw,
  random
} from '../../../engine'
import { Player } from '../entities/Player'
import { Wall } from '../entities/Wall'
import { ExitDoor } from '../entities/ExitDoor'

export interface LevelData {
  width: number
  height: number
  playerStart: { x: number; y: number }
  walls: { x: number; y: number; width: number; height: number }[]
  exits: { x: number; y: number; maxRadius?: number }[]
}

export abstract class SqueezeLevel extends BasedLevel {
  // Physics
  physics!: PhysicsWorld

  // Level dimensions
  levelWidth = 800
  levelHeight = 600

  // Entities
  player!: Player
  walls: Wall[] = []
  exits: ExitDoor[] = []

  // UI
  resetButton!: Button
  zoomButton!: Button
  moveKnob!: TouchKnob
  shrinkButton!: Button
  growButton!: Button
  instructionLabel!: Label

  // State
  gameState: 'playing' | 'complete' = 'playing'
  nextLevel = ''
  miniMapActive = false

  // Must implement
  abstract getLevelData(): LevelData
  abstract getNextLevel(): string

  async preload(): Promise<void> {
    this.engine.setLoadingProgress(0.5, 'Loading level...')
    // Load sounds here if needed
  }

  create(): void {
    const data = this.getLevelData()
    this.levelWidth = data.width
    this.levelHeight = data.height
    this.nextLevel = this.getNextLevel()

    // Initialize physics
    this.physics = new PhysicsWorld({ gravity: { x: 0, y: 0 } })

    // Create player
    this.player = new Player(this, 'player')
    console.log('Level data player start:', data.playerStart)
    this.player.setPosition(data.playerStart.x, data.playerStart.y)
    console.log('Creating player at:', data.playerStart.x, data.playerStart.y)
    this.player.initPhysics(this.physics)
    this.player.onWallHit = () => this._playWallSound()
    this.player.onStep = () => this._playStepSound()
    this.addObject(this.player)

    // Create level boundaries
    this._createBoundaries()

    // Create walls
    for (const wallData of data.walls) {
      const wall = new Wall(this, `wall_${random.uuid()}`)
      wall.x = wallData.x
      wall.y = wallData.y
      wall.width = wallData.width
      wall.height = wallData.height
      wall.initPhysics(this.physics)
      this.walls.push(wall)
      this.addObject(wall)
    }

    console.log(this.walls)

    // Create exits
    for (const exitData of data.exits) {
      const exit = new ExitDoor(this, `exit_${random.uuid()}`)
      exit.x = exitData.x
      exit.y = exitData.y
      if (exitData.maxRadius) exit.maxRadius = exitData.maxRadius
      exit.initPhysics(this.physics)
      exit.onPlayerEnter = () => this._completeLevel()
      this.exits.push(exit)
      this.addObject(exit)
    }

    // Setup camera
    this.camera.setBounds(this.levelWidth, this.levelHeight)
    this.camera.setPosition(this.player.x, this.player.y)
    this.camera.follow(this.player, 8)  // Pass player object so camera tracks live position

    // Setup UI
    this._setupUI()

    this.gameState = 'playing'

    console.log('PLAYER =====>', this.player)
  }

  private _createBoundaries(): void {
    const thickness = 50

    // Top
    const topWall = Wall.createBoundary(this, 0, -thickness, this.levelWidth, thickness, this.physics)
    this.walls.push(topWall)
    this.addObject(topWall)

    // Bottom
    const bottomWall = Wall.createBoundary(this, 0, this.levelHeight, this.levelWidth, thickness, this.physics)
    this.walls.push(bottomWall)
    this.addObject(bottomWall)

    // Left
    const leftWall = Wall.createBoundary(this, -thickness, 0, thickness, this.levelHeight, this.physics)
    this.walls.push(leftWall)
    this.addObject(leftWall)

    // Right
    const rightWall = Wall.createBoundary(this, this.levelWidth, 0, thickness, this.levelHeight, this.physics)
    this.walls.push(rightWall)
    this.addObject(rightWall)
  }

  private _setupUI(): void {
    // Reset button
    this.resetButton = new Button(this.engine, {
      text: 'Reset',
      width: 70,
      height: 35,
      style: { fill: 'rgba(0,0,0,0.7)' },
      onClick: () => this._resetLevel()
    })

    // Zoom button
    this.zoomButton = new Button(this.engine, {
      text: 'Zoom',
      width: 70,
      height: 35,
      style: { fill: 'rgba(0,0,0,0.7)' },
      onClick: () => {
        this.miniMapActive = !this.miniMapActive
        this.zoomButton.text = this.miniMapActive ? 'Full' : 'Zoom'
      }
    })

    // Touch controls (only shown on touch devices)
    this.moveKnob = new TouchKnob(this.engine, {
      maxOffset: 50
    })

    this.shrinkButton = new Button(this.engine, {
      text: '-',
      width: 60,
      height: 60,
      style: {
        fill: 'rgba(0, 100, 255, 0.5)',
        hoverFill: 'rgba(0, 100, 255, 0.7)',
        fontSize: 24,
        radius: 30
      }
    })

    this.growButton = new Button(this.engine, {
      text: '+',
      width: 60,
      height: 60,
      style: {
        fill: 'rgba(255, 100, 0, 0.5)',
        hoverFill: 'rgba(255, 100, 0, 0.7)',
        fontSize: 24,
        radius: 30
      }
    })

    // Instructions
    this.instructionLabel = new Label(this.engine, {
      text: 'Move: WASD/Arrows | Shrink: Z | Grow: X | Reset: R',
      style: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        align: 'center'
      }
    })

    this._positionUI()
  }

  private _positionUI(): void {
    const padding = 10

    // Top right buttons
    this.resetButton.fromRight(padding).y = padding
    this.zoomButton.fromRight(padding + this.resetButton.width + 5).y = padding

    // Touch controls
    this.moveKnob.bottomLeft(30)
    this.shrinkButton.fromRight(90).fromBottom(30)
    this.growButton.fromRight(20).fromBottom(30)

    // Instructions
    this.instructionLabel.centerX().y = this.height - 30
  }

  update(delta: number): void {
    if (this.gameState !== 'playing') return

    // Update physics
    this.physics.update(delta)

    // Camera automatically follows the player (set in create)

    // Handle zoom
    if (this.miniMapActive) {
      const zoomToFit = Math.min(
        this.width / this.levelWidth,
        this.height / this.levelHeight
      ) * 0.95
      this.camera.setZoom(zoomToFit)
    } else {
      this.camera.setZoom(this.input.isTouchDevice ? 0.7 : 1)
    }

    // Check exits
    for (const exit of this.exits) {
      exit.checkPlayer(this.player)
    }

    // Reset key
    if (this.input.keyPressed('KeyR')) {
      this._resetLevel()
    }

    // Update UI
    this.resetButton.update()
    this.zoomButton.update()

    if (this.input.isTouchDevice) {
      this.moveKnob.update()
      this.shrinkButton.update()
      this.growButton.update()

      // Apply touch controls to player
      if (this.moveKnob.active) {
        const dir = this.moveKnob.direction
        this.player.body.setVelocity(dir.x * 8, dir.y * 8)
      }
    }
  }

  draw(draw: Draw): void {
    // Background
    draw.rect(0, 0, this.levelWidth, this.levelHeight, {
      fill: '#1a1a2e'
    })

    // Grid pattern
    const gridSize = 50
    for (let x = 0; x <= this.levelWidth; x += gridSize) {
      draw.line(x, 0, x, this.levelHeight, {
        color: 'rgba(255,255,255,0.05)',
        width: 1
      })
    }
    for (let y = 0; y <= this.levelHeight; y += gridSize) {
      draw.line(0, y, this.levelWidth, y, {
        color: 'rgba(255,255,255,0.05)',
        width: 1
      })
    }

    // Debug: manually draw the player from here
    // if (this.player) {
    //   // console.log('Player exists, pos:', this.player.x, this.player.y, 'visible:', this.player.visible)
    //   draw.circle(this.player.x, this.player.y, this.player.radius, {
    //     fill: 'orange',
    //     stroke: 'black',
    //     strokeWidth: 3
    //   })
    // }
  }

  drawUI(draw: Draw): void {
    // Buttons
    this.resetButton.draw(draw)
    this.zoomButton.draw(draw)

    // Touch controls
    if (this.input.isTouchDevice) {
      this.moveKnob.draw(draw)
      this.shrinkButton.draw(draw)
      this.growButton.draw(draw)
    } else {
      this.instructionLabel.draw(draw)
    }

    // Level complete overlay
    if (this.gameState === 'complete') {
      draw.rect(0, 0, this.width, this.height, {
        fill: 'rgba(0, 0, 0, 0.7)'
      })
      draw.text('Level Complete!', this.width / 2, this.height / 2 - 20, {
        size: 32,
        align: 'center',
        baseline: 'middle',
        color: '#4CAF50'
      })
      draw.text('Click to continue', this.width / 2, this.height / 2 + 20, {
        size: 16,
        align: 'center',
        baseline: 'middle',
        color: '#fff'
      })
    }
  }

  resize(): void {
    this._positionUI()
  }

  private _resetLevel(): void {
    const data = this.getLevelData()
    this.player.reset(data.playerStart.x, data.playerStart.y)
    this.gameState = 'playing'
  }

  private _completeLevel(): void {
    this.gameState = 'complete'
    this.sound.playNote(440, 0.3, 'sine')
    setTimeout(() => this.sound.playNote(550, 0.3, 'sine'), 100)
    setTimeout(() => this.sound.playNote(660, 0.4, 'sine'), 200)
  }

  private _playWallSound(): void {
    const freq = 100 + Math.random() * 50
    this.sound.playNote(freq, 0.1, 'square')
  }

  private _playStepSound(): void {
    const freq = 200 + Math.random() * 100
    this.sound.playNote(freq, 0.05, 'sine')
  }
}
