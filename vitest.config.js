import { defineConfig } from 'vitest/config';

export default defineConfig({
  test:{
    environment:'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://127.0.0.1:5500/'
      }
    },
    setupFiles: [
      'dotenv/config',
      './test/setupUnit.js',
      'vitest-webgl-canvas-mock'
    ],
    include: [
      './test/**/*.test.{ts,js}'
    ],
    coverage: {
      provider: 'v8',
      exclude: ['node_modules/', 'dist/'],
      all: true,
      include: ['test'],
      reporter: ['json','html'],
      reportsDirectory: './coverage'
    }
  }
})
