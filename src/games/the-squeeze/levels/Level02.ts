/**
 * The Squeeze - Level 02
 */

import { SqueezeLevel, LevelData } from './SqueezeLevel'

export class Level02 extends SqueezeLevel {
  getLevelData(): LevelData {
    return {
      width: 1000,
      height: 800,
      playerStart: { x: 100, y: 400 },
      walls: [
        // Maze-like structure
        { x: 200, y: 0, width: 50, height: 300 },
        { x: 200, y: 500, width: 50, height: 300 },
        
        { x: 400, y: 200, width: 50, height: 400 },
        
        { x: 600, y: 0, width: 50, height: 350 },
        { x: 600, y: 550, width: 50, height: 250 },
        
        { x: 800, y: 300, width: 50, height: 300 },
        
        // Center obstacles
        { x: 350, y: 350, width: 80, height: 80 },
        { x: 550, y: 500, width: 60, height: 60 },
      ],
      exits: [
        { x: 900, y: 200, maxRadius: 35 }
      ]
    }
  }

  getNextLevel(): string {
    return 'credits'
  }
}
