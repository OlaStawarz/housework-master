/// <reference types="vitest" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    // Używamy jsdom, aby symulować środowisko przeglądarki dla komponentów React
    environment: 'jsdom',
    // Plik setup uruchamiany przed testami
    setupFiles: './src/test/setup.ts',
    // Globalne API vitest (describe, it, expect) bez konieczności importowania
    globals: true,
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});

