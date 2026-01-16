/**
 * The Squeeze - Credits Screen
 */

import { BasedLevel, Button, Draw } from '../../../engine'

export class CreditsScreen extends BasedLevel {
  backButton!: Button

  create(): void {
    this.backButton = new Button(this.engine, {
      text: 'Back to Menu',
      width: 200,
      height: 50,
      onClick: () => this.engine.loadLevel('start-screen')
    })
    this._positionUI()
  }

  private _positionUI(): void {
    this.backButton.centerX().fromBottom(50)
  }

  update(): void {
    this.backButton.update()
  }

  drawUI(draw: Draw): void {
    // Background
    draw.rect(0, 0, this.width, this.height, {
      fill: '#1a1a2e'
    })

    // Title
    draw.text('Credits', this.width / 2, 80, {
      size: 36,
      color: '#ff9500',
      align: 'center'
    })

    // Credits content
    const credits = [
      'THE SQUEEZE',
      '',
      'A puzzle game about changing size',
      '',
      'Made with Based Engine 2.0',
      '',
      '---',
      '',
      'Game Design & Programming',
      'You!',
      '',
      'Engine',
      'Based Engine 2.0',
      '',
      '---',
      '',
      'Thanks for playing!'
    ]

    let y = 150
    for (const line of credits) {
      draw.text(line, this.width / 2, y, {
        size: line.startsWith('---') ? 12 : (line === 'THE SQUEEZE' ? 24 : 16),
        color: line === 'THE SQUEEZE' ? '#ff9500' : 'rgba(255,255,255,0.8)',
        align: 'center'
      })
      y += line === '' ? 15 : 25
    }

    // Back button
    this.backButton.draw(draw)
  }

  resize(): void {
    this._positionUI()
  }
}
