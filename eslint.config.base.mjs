// see https://eslint.org/docs/latest/use/configure/configuration-files for more options
//
// Kozos, megosztott ESLint alapkonfiguracio. A backend es a mobile app
// sajat eslint.config.mjs-e importalja ezt, es ra epiti a sajat
// (Nest-specifikus / Expo-specifikus) szabalyait.

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/node_modules/**',
      '**/.expo/**',
      '**/android/**',
      '**/ios/**',
      '**/coverage/**',
    ],
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },

  prettier,
);
