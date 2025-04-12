import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom for DOM APIs.
    environment: 'jsdom',

    // Enables global variables like "describe" and "test"
    globals: true,

    // Optional: Path to a setup file which can import additional matchers
    setupFiles: ['./src/setupTests.js'],
  },
});