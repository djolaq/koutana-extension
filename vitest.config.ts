import { defineConfig } from 'vitest/config';

/**
 * Tests target `src/core/**` only, and `src/core/**` is written to be testable
 * without a browser: no `#imports`, no `browser.*`, no DOM beyond what happy-dom
 * provides. That constraint is the point — if a module cannot be tested here, it
 * has business logic in the wrong layer.
 *
 * Entrypoints are covered by the manual QA checklist in docs/testing.md and, from
 * milestone M5, by Playwright end-to-end runs against a real browser profile.
 */
export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
});
