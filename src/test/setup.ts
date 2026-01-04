import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Automatyczne czyszczenie po każdym teście (standard dla React Testing Library)
afterEach(() => {
  cleanup();
});

