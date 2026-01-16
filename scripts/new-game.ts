/**
 * Script to scaffold a new game
 * Usage: npm run new-game -- --name MyGame
 */

import * as fs from 'fs'
import * as path from 'path'

const args = process.argv.slice(2)
const nameIndex = args.indexOf('--name')
const gameName = nameIndex >= 0 ? args[nameIndex + 1] : null

if (!gameName) {
  console.error('Usage: npm run new-game -- --name MyGame')
  process.exit(1)
}

const kebabName = gameName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
const gamesDir = path.join(process.cwd(), 'src', 'games', kebabName)

if (fs.existsSync(gamesDir)) {
  console.error(`Game "${kebabName}" already exists!`)
  process.exit(1)
}

// Create directory structure
fs.mkdirSync(gamesDir, { recursive: true })
fs.mkdirSync(path.join(gamesDir, 'entities'), { recursive: true })
fs.mkdirSync(path.join(gamesDir, 'levels'), { recursive: true })

// Create index.ts
const indexContent = `/**
 * ${gameName} - Game Entry Point
 */

import { BasedEngine } from '../../engine'
import { MainLevel } from './levels/MainLevel'

export function start${gameName}(): BasedEngine {
  const engine = new BasedEngine({
    containerId: 'game-container',
    backgroundColor: '#1a1a2e',
    debug: true
  })

  engine.registerLevels([
    { key: 'main', levelClass: MainLevel },
  ])

  engine.start('main')

  return engine
}
`

fs.writeFileSync(path.join(gamesDir, 'index.ts'), indexContent)

// Create MainLevel.ts
const levelContent = `/**
 * ${gameName} - Main Level
 */

import { BasedLevel, Draw } from '../../../engine'

export class MainLevel extends BasedLevel {
  async preload(): Promise<void> {
    this.engine.setLoadingProgress(0.5, 'Loading assets...')
    // Load your assets here
  }

  create(): void {
    // Setup your level here
    console.log('${gameName} started!')
  }

  update(delta: number): void {
    // Update game logic here
  }

  draw(draw: Draw): void {
    // Draw world content here (camera applied)
    draw.text('Hello ${gameName}!', 400, 300, {
      size: 32,
      align: 'center',
      baseline: 'middle',
      color: '#fff'
    })
  }

  drawUI(draw: Draw): void {
    // Draw UI here (screen coordinates)
    draw.text('Press any key to start', this.width / 2, this.height - 50, {
      size: 16,
      align: 'center',
      color: 'rgba(255,255,255,0.5)'
    })
  }
}
`

fs.writeFileSync(path.join(gamesDir, 'levels', 'MainLevel.ts'), levelContent)

console.log(`✓ Created game "${kebabName}" at src/games/${kebabName}/`)
console.log('')
console.log('To run your game, update src/main.ts:')
console.log('')
console.log(`  import { start${gameName} } from './games/${kebabName}'`)
console.log(`  start${gameName}()`)
console.log('')
