/**
 * Based Engine 2.0 - Sound Manager
 * Simplified audio management for music and sound effects
 */

export class SoundManager {
  private _ctx: AudioContext | null = null
  private _masterGain: GainNode | null = null
  private _musicGain: GainNode | null = null
  private _sfxGain: GainNode | null = null

  private _sounds = new Map<string, AudioBuffer>()
  private _music = new Map<string, AudioBuffer>()
  private _currentMusic: AudioBufferSourceNode | null = null
  private _currentMusicKey: string | null = null

  private _masterVolume = 1
  private _musicVolume = 0.5
  private _sfxVolume = 1
  private _enabled = true

  constructor() {
    // Initialize audio context on first user interaction
    const initAudio = () => {
      if (!this._ctx) {
        this._initContext()
      }
      document.removeEventListener('click', initAudio)
      document.removeEventListener('keydown', initAudio)
      document.removeEventListener('touchstart', initAudio)
    }

    document.addEventListener('click', initAudio)
    document.addEventListener('keydown', initAudio)
    document.addEventListener('touchstart', initAudio)
  }

  private _initContext(): void {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    this._ctx = new AudioContextClass()

    this._masterGain = this._ctx.createGain()
    this._masterGain.connect(this._ctx.destination)
    this._masterGain.gain.value = this._masterVolume

    this._musicGain = this._ctx.createGain()
    this._musicGain.connect(this._masterGain)
    this._musicGain.gain.value = this._musicVolume

    this._sfxGain = this._ctx.createGain()
    this._sfxGain.connect(this._masterGain)
    this._sfxGain.gain.value = this._sfxVolume
  }

  private _ensureContext(): AudioContext {
    if (!this._ctx) {
      this._initContext()
    }
    // Resume if suspended (browser autoplay policy)
    if (this._ctx!.state === 'suspended') {
      this._ctx!.resume()
    }
    return this._ctx!
  }

  /**
   * Load a sound effect
   */
  async loadSound(url: string, key: string): Promise<void> {
    const ctx = this._ensureContext()
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
    this._sounds.set(key, audioBuffer)
  }

  /**
   * Load music track
   */
  async loadMusic(url: string, key: string): Promise<void> {
    const ctx = this._ensureContext()
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
    this._music.set(key, audioBuffer)
  }

  /**
   * Load multiple sounds at once
   */
  async loadSounds(sounds: { url: string; key: string }[]): Promise<void> {
    await Promise.all(sounds.map(s => this.loadSound(s.url, s.key)))
  }

  /**
   * Play a sound effect
   */
  play(key: string, options: { volume?: number; loop?: boolean; rate?: number } = {}): AudioBufferSourceNode | null {
    if (!this._enabled) return null

    const buffer = this._sounds.get(key)
    if (!buffer) {
      console.warn(`Sound "${key}" not found`)
      return null
    }

    const ctx = this._ensureContext()
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = options.loop ?? false
    source.playbackRate.value = options.rate ?? 1

    // Create individual gain for this sound
    const gainNode = ctx.createGain()
    gainNode.gain.value = options.volume ?? 1
    source.connect(gainNode)
    gainNode.connect(this._sfxGain!)

    source.start()
    return source
  }

  /**
   * Play one of multiple sounds randomly
   */
  playRandom(keys: string[], options: { volume?: number } = {}): void {
    const key = keys[Math.floor(Math.random() * keys.length)]
    this.play(key, options)
  }

  /**
   * Play music track
   */
  playMusic(key: string, options: { volume?: number; fadeIn?: number } = {}): void {
    if (!this._enabled) return

    // Stop current music if playing different track
    if (this._currentMusicKey === key && this._currentMusic) {
      return // Already playing this track
    }

    if (this._currentMusic) {
      this.stopMusic(options.fadeIn ? 500 : 0)
    }

    const buffer = this._music.get(key)
    if (!buffer) {
      console.warn(`Music "${key}" not found`)
      return
    }

    const ctx = this._ensureContext()
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true

    const gainNode = ctx.createGain()
    gainNode.gain.value = options.volume ?? 1

    if (options.fadeIn) {
      gainNode.gain.setValueAtTime(0, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(options.volume ?? 1, ctx.currentTime + options.fadeIn / 1000)
    }

    source.connect(gainNode)
    gainNode.connect(this._musicGain!)

    source.start()
    this._currentMusic = source
    this._currentMusicKey = key
  }

  /**
   * Stop currently playing music
   */
  stopMusic(fadeOut = 0): void {
    if (!this._currentMusic) return

    const source = this._currentMusic
    this._currentMusic = null
    this._currentMusicKey = null

    if (fadeOut > 0 && this._ctx) {
      // Fade out then stop
      const gainNode = this._ctx.createGain()
      gainNode.gain.setValueAtTime(1, this._ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0, this._ctx.currentTime + fadeOut / 1000)
      setTimeout(() => {
        try { source.stop() } catch {}
      }, fadeOut)
    } else {
      try { source.stop() } catch {}
    }
  }

  /**
   * Stop all sounds
   */
  stopAll(): void {
    this.stopMusic()
    // Note: individual sound effects will stop on their own
  }

  /**
   * Play a synthesized note (useful for retro sounds)
   */
  playNote(
    frequency: number,
    duration: number,
    type: OscillatorType = 'square',
    options: { volume?: number } = {}
  ): void {
    if (!this._enabled) return

    const ctx = this._ensureContext()
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.value = frequency

    const gainNode = ctx.createGain()
    gainNode.gain.setValueAtTime(options.volume ?? 0.3, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.01, ctx.currentTime + duration)

    osc.connect(gainNode)
    gainNode.connect(this._sfxGain!)

    osc.start()
    osc.stop(ctx.currentTime + duration)
  }

  // Volume controls
  get masterVolume(): number { return this._masterVolume }
  set masterVolume(v: number) {
    this._masterVolume = Math.max(0, Math.min(1, v))
    if (this._masterGain) {
      this._masterGain.gain.value = this._masterVolume
    }
  }

  get musicVolume(): number { return this._musicVolume }
  set musicVolume(v: number) {
    this._musicVolume = Math.max(0, Math.min(1, v))
    if (this._musicGain) {
      this._musicGain.gain.value = this._musicVolume
    }
  }

  get sfxVolume(): number { return this._sfxVolume }
  set sfxVolume(v: number) {
    this._sfxVolume = Math.max(0, Math.min(1, v))
    if (this._sfxGain) {
      this._sfxGain.gain.value = this._sfxVolume
    }
  }

  get enabled(): boolean { return this._enabled }
  set enabled(v: boolean) { this._enabled = v }

  /**
   * Check if a sound is loaded
   */
  hasSound(key: string): boolean {
    return this._sounds.has(key)
  }

  /**
   * Check if music is loaded
   */
  hasMusic(key: string): boolean {
    return this._music.has(key)
  }

  /**
   * Check if music is currently playing
   */
  get isMusicPlaying(): boolean {
    return this._currentMusic !== null
  }

  /**
   * Get currently playing music key
   */
  get currentMusicKey(): string | null {
    return this._currentMusicKey
  }
}
