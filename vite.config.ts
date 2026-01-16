import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@engine': resolve(__dirname, './src/engine'),
      '@games': resolve(__dirname, './src/games'),
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        // Add more games here as separate entry points
        // 'the-squeeze': resolve(__dirname, 'games/the-squeeze/index.html'),
      }
    }
  },
  server: {
    open: true
  }
})
