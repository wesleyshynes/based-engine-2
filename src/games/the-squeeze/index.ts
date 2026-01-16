/**
 * The Squeeze - Game Entry Point
 */

import { BasedEngine } from '../../engine'
import { StartScreen } from './levels/StartScreen'
import { CreditsScreen } from './levels/CreditsScreen'
import { Level01 } from './levels/Level01'
import { Level02 } from './levels/Level02'

export function startTheSqueeze(): BasedEngine {
  const engine = new BasedEngine({
    containerId: 'game-container',
    backgroundColor: '#1a1a2e',
    debug: false
  })

  // Register all levels
  engine.registerLevels([
    { key: 'start-screen', levelClass: StartScreen },
    { key: 'credits', levelClass: CreditsScreen },
    { key: 'level-01', levelClass: Level01 },
    { key: 'level-02', levelClass: Level02 },
  ])

  // Start the game
  engine.start('start-screen')

  return engine
}
