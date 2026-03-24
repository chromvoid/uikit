import UnoCSS from 'unocss/vite'
import {defineConfig} from 'vite'

export default defineConfig({
  root: 'demo',
  plugins: [UnoCSS()],
  server: {
    host: '127.0.0.1',
    port: 4173,
  },
  build: {
    target: 'es2022',
    outDir: '../dist-demo',
    emptyOutDir: true,
  },
})
