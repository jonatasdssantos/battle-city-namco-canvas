import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    // Without this, `vite build` only picks up index.html and drops the WFC demo page.
    rollupOptions: {
      input: {
        main: 'index.html',
        wfc: 'wfc.html',
      },
    },
  },
})
