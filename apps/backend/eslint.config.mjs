import tseslint from 'typescript-eslint';

import base from '../../eslint.config.base.mjs';

export default tseslint.config(
  ...base,

  // "typed linting" bekapcsolasa: a no-floating-promises szabaly tipus-
  // informaciot igenyel (tudnia kell, hogy egy kifejezes Promise-e vagy nem),
  // ehhez a typescript-eslint-nek latnia kell a tsconfig-ot.
  ...tseslint.configs.recommendedTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        process: 'readonly',
      },
    },
    rules: {
      // atemelve a korabbi oxlint.json-bol: NestJS-ben (DI, decorator-ok,
      // Prisma payload-ok) gyakori az any hasznalata, ezt nem buntetjuk
      '@typescript-eslint/no-explicit-any': 'off',
      // figyelmeztetes, de nem hiba - sok helyen szandekosan nem await-elt
      // "fire and forget" hivas van (pl. logging)
      '@typescript-eslint/no-floating-promises': 'warn',
    },
  },
);
