/**
 * Based Engine 2.0 - Save Manager
 * Simple localStorage-based save system with type safety
 */

export class SaveManager {
  private _prefix: string

  constructor(prefix = 'based-engine') {
    this._prefix = prefix
  }

  private _key(key: string): string {
    return `${this._prefix}:${key}`
  }

  /**
   * Save data to localStorage
   */
  save<T>(key: string, data: T): void {
    try {
      localStorage.setItem(this._key(key), JSON.stringify(data))
    } catch (e) {
      console.warn('Failed to save data:', e)
    }
  }

  /**
   * Load data from localStorage
   */
  load<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(this._key(key))
      if (item === null) return defaultValue
      return JSON.parse(item) as T
    } catch (e) {
      console.warn('Failed to load data:', e)
      return defaultValue
    }
  }

  /**
   * Delete a saved item
   */
  delete(key: string): void {
    localStorage.removeItem(this._key(key))
  }

  /**
   * Check if a key exists
   */
  has(key: string): boolean {
    return localStorage.getItem(this._key(key)) !== null
  }

  /**
   * Clear all saved data for this game
   */
  clear(): void {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(this._prefix + ':')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }

  /**
   * Get all saved keys for this game
   */
  keys(): string[] {
    const result: string[] = []
    const prefixLen = this._prefix.length + 1
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(this._prefix + ':')) {
        result.push(key.substring(prefixLen))
      }
    }
    return result
  }

  /**
   * Change the save prefix (useful for different games)
   */
  setPrefix(prefix: string): void {
    this._prefix = prefix
  }
}
