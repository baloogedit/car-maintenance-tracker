import expoConfig from 'eslint-config-expo/flat';
import prettier from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

// A mobile app az official "eslint-config-expo" flat presetjere epul
// (React / React Native / Expo Router specifikus szabalyok), nem a
// tipikus TypeScript-eslint "base" configra - azt mar tartalmazza.
// Csak az import-sort szabalyokat es a prettier-kompatibilitast adjuk hozza,
// hogy konzisztens legyen a backend-del.
export default [
  ...expoConfig,
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
  {
    ignores: ['android/**', 'ios/**', '.expo/**', 'scripts/reset-project.js'],
  },
];
