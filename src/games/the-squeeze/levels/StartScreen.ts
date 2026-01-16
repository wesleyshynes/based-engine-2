/**
 * The Squeeze - Start Screen
 */

import { BasedLevel, Button, Label, Draw } from '../../../engine'

export class StartScreen extends BasedLevel {
  titleLabel!: Label
  startButton!: Button
  creditsButton!: Button

  create(): void {
    // Title
    this.titleLabel = new Label(this.engine, {
      text: 'THE SQUEEZE',
      style: {
        fontSize: 48,
        color: '#ff9500',
        align: 'center',
        baseline: 'middle'
      }
    })

    // Start button
    this.startButton = new Button(this.engine, {
      text: 'Start Game',
      width: 200,
      height: 50,
      style: {
        fill: '#4CAF50',
        hoverFill: '#66BB6A',
        fontSize: 20
      },
      onClick: () => this.engine.loadLevel('level-01')
    })

    // Credits button
    this.creditsButton = new Button(this.engine, {
      text: 'Credits',
      width: 200,
      height: 50,
      style: {
        fill: '#2196F3',
        hoverFill: '#42A5F5',
        fontSize: 20
      },
      onClick: () => this.engine.loadLevel('credits')
    })

    this._positionUI()
  }

  private _positionUI(): void {
    this.titleLabel.x = this.width / 2
    this.titleLabel.y = this.height / 3

    this.startButton.centerX().y = this.height / 2
    this.creditsButton.centerX().y = this.height / 2 + 70
  }

  update(): void {
    this.startButton.update()
    this.creditsButton.update()
  }

  draw(): void {
    // Handled by drawUI since no world content
  }

  drawUI(draw: Draw): void {
    // Background
    draw.rect(0, 0, this.width, this.height, {
      fill: '#1a1a2e'
    })

    // Decorative circles
    for (let i = 0; i < 5; i++) {
      const x = (this.width / 6) * (i + 1)
      const y = this.height * 0.75
      const radius = 30 + Math.sin(this.time * 2 + i) * 10
      draw.circle(x, y, radius, {
        fill: `rgba(255, 150, 50, ${0.3 - i * 0.05})`,
        stroke: '#ff9500',
        strokeWidth: 2
      })
    }

    // Title
    this.titleLabel.draw(draw)

    // Subtitle
    draw.text('Shrink to fit, grow to push', this.width / 2, this.titleLabel.y + 50, {
      size: 18,
      color: 'rgba(255,255,255,0.7)',
      align: 'center'
    })

    // Buttons
    this.startButton.draw(draw)
    this.creditsButton.draw(draw)
  }

  resize(): void {
    this._positionUI()
  }
}
