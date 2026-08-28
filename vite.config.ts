import { defineConfig, loadEnv } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'

const config = defineConfig(async ({ mode }) => {
  const loaded = loadEnv(mode, process.cwd(), '')
  for (const [key, value] of Object.entries(loaded)) {
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }

  // Validate env at Vite startup so missing/invalid values fail fast.
  const { env } = await import('./src/env.ts')
  void env

  return {
    resolve: { tsconfigPaths: true },
    plugins: [tailwindcss(), tanstackStart(), viteReact()],
  }
})

export default config
