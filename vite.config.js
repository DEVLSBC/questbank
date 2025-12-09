import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Se o seu repo chama "questbank", coloque '/questbank/'
export default defineConfig({
  plugins: [react()],
  base: '/questbank/',
})