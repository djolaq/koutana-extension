import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['.output', '.wxt', 'node_modules', 'coverage'] },
  {
    files: ['scripts/**/*.mjs', '*.config.{js,ts}'],
    languageOptions: { globals: { console: 'readonly', process: 'readonly', URL: 'readonly' } },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // Architecture guard rails. These are the rules that keep the layering
      // honest; see AGENTS.md § Boundaries.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/core/settings/secrets', '**/core/auth/*'],
              importNames: ['*'],
              message:
                'Credentials are background-only. UI and content scripts must go through core/messaging.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message: 'Network I/O belongs in core/ai/client.ts, called from the background script.',
        },
      ],
    },
  },
  {
    // The client and the background script are the exceptions, by design.
    files: ['src/core/ai/client.ts', 'src/entrypoints/background.ts', 'src/core/auth/*.ts'],
    rules: { 'no-restricted-imports': 'off', 'no-restricted-globals': 'off' },
  },
);
