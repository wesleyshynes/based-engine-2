/**
 * The Squeeze - Level 01
 */

import { SqueezeLevel, LevelData } from './SqueezeLevel'

export class Level01 extends SqueezeLevel {
  getLevelData(): LevelData {
    return {
      width: 800,
      height: 600,
      playerStart: { x: 100, y: 300 },
      walls: [
        // Corridor walls
        { x: 250, y: 0, width: 50, height: 200 },
        { x: 250, y: 400, width: 50, height: 200 },
        // Narrow passage
        { x: 450, y: 0, width: 50, height: 250 },
        { x: 450, y: 350, width: 50, height: 250 },
      ],
      exits: [
        { x: 700, y: 300, maxRadius: 40 }
      ]
    }
  }

  getNextLevel(): string {
    return 'level-02'
  }
}
