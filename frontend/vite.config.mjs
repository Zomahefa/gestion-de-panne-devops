import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/setupTests.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'src/assets/**',
        '**/*.css',
        '**/*.png',
        '**/*.jpg',
        '**/*.svg',
        '**/*.jpeg',
        '**/*.gif',
      ],
    },
  },
});
