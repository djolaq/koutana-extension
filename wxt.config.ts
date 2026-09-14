import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// Docs: https://wxt.dev/api/config.html
//
// One config, two stores. WXT generates a Chrome MV3 manifest and a Firefox MV3
// manifest from this single source. Anything browser-specific is expressed as a
// function of `browser` below — never as a hand-edited manifest.json.
export default defineConfig({
  srcDir: 'src',
  // Firefox accepts MV3 too; shipping one manifest version everywhere keeps
  // the two builds comparable and avoids maintaining MV2 fallbacks.
  manifestVersion: 3,
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],

  vite: () => ({
    plugins: [tailwindcss()],
  }),

  manifest: ({ browser }) => ({
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',

    // Requested up-front because every feature needs them.
    permissions: [
      'storage', // settings + credentials (local only, never sync)
      'contextMenus', // right-click entry points
      'activeTab', // read the page the user explicitly acted on
      'scripting', // inject the overlay on demand
      ...(browser === 'chrome' ? ['sidePanel'] : []),
    ],

    // The ONLY host we talk to. Declared statically so reviewers can verify it.
    host_permissions: ['https://api.infomaniak.com/*'],

    // Full-page translation needs to read the DOM of the current tab. It is an
    // optional permission so the extension installs with a minimal prompt and
    // asks only when the user first uses that feature.
    optional_host_permissions: ['<all_urls>'],

    commands: {
      'open-side-panel': {
        suggested_key: { default: 'Alt+Shift+S' },
        description: '__MSG_cmdOpenSidePanel__',
      },
      'translate-selection': {
        suggested_key: { default: 'Alt+Shift+T' },
        description: '__MSG_cmdTranslateSelection__',
      },
    },

    ...(browser === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              id: 'kounata@laqua.fr',
              strict_min_version: '128.0',
              // Required by AMO since Nov 2025. Page text and selections are
              // sent to the user's OWN Infomaniak AI product to be processed;
              // we declare that honestly rather than claiming 'none'.
              data_collection_permissions: {
                required: ['none'],
                optional: ['browsingActivity'],
              },
            },
          },
        }
      : {}),
  }),

  // Firefox MV3 uses an event page, not a service worker. WXT handles the
  // translation; we only need to keep background code free of SW-only APIs.
  zip: {
    excludeSources: ['**/*.md', 'docs/**', '.github/**'],
  },
});
