import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    // 5173 y 5174 se los lleva mapa_FDI cuando está corriendo, y las tres apps van a
    // convivir en la misma máquina. `strictPort` para que un choque se vea, en vez de
    // que Vite salte de puerto en silencio y uno termine mirando la app equivocada.
    port: 5180,
    strictPort: true,
    host: true
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'scripts/**/*.test.mjs']
  }
})
