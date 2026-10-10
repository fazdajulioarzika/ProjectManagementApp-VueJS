import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./tests/globalSetup.js'],
    setupFiles: ['./tests/setup.js'],
    // Semua file tes berbagi satu database, jadi dijalankan bergantian
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 120000, // pertama kali, MongoDB in-memory perlu mengunduh binary
  },
});
