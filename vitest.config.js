import { defineConfig } from 'vitest/config';

// Standalone config so unit tests don't load the SvelteKit/Vite plugin chain.
export default defineConfig({
  test: {
    include: ['scripts/**/*.test.js', 'src/**/*.test.js']
  }
});
