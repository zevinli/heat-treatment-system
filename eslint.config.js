const tseslint = require('typescript-eslint');
let eslintPresetsOfSimple = { client: [], server: [] };
try {
  ({ eslintPresetsOfSimple } = require('@lark-apaas/fullstack-presets'));
} catch {
  // The open-source/local package does not ship the platform-only preset.
  // TypeScript parsing still runs; CI environments that provide the preset
  // automatically receive the full platform rule set.
}

module.exports = tseslint.config(
  { ignores: ['dist', 'node_modules', 'client/src/api/gen', 'server/scripts/clean-orphan-batches.ts', 'server/scripts/fix-inventory-record-types.ts'] },
  // Client configuration
  {
    files: ['client/**/*.{ts,tsx}', 'shared/**/*.{ts,tsx}'],
    extends: [
      ...eslintPresetsOfSimple.client,
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.app.json',
      },
    },
    settings: {
      'import/resolver': {
        alias: {
          map: [
            ['@', './client/src'],
            ['@client', './client'],
            ['@shared', './shared'],
          ],
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
  },
  // Server configuration
  {
    files: ['server/**/*.{ts,tsx}', 'shared/**/*.{ts,tsx}'],
    extends: [
      ...eslintPresetsOfSimple.server,
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.node.json',
      }
    },
    settings: {
      'import/resolver': {
        alias: {
          map: [['@server', './server'], ['@shared', './shared']],
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      }
    }
  },
);
