// see https://prettier.io/docs/en/options.html for more options
// see https://prettier.io/docs/en/configuration.html for more configuration options
//
// Megjegyzes: az eredeti pelda-config tartalmazott egy "prettier-plugin-tailwindcss"
// plugint es egy "tailwindStylesheet" utat (apps/frontend/src/index.css).
// Ez a projekt NEM hasznal Tailwind/NativeWind-ot, es az "apps/frontend" mappa
// sem letezik itt (a mobil app "apps/mobile" neven fut) - ezert ezt a ket
// mezot szandekosan kihagytam. Ha kesobb NativeWind-ot vezetnetek be a mobil
// app-ban, telepitsd a "prettier-plugin-tailwindcss"-t, es add vissza a plugins
// tombot + a tailwindStylesheet-et az "apps/mobile/src/global.css"-re allitva.

module.exports = {
  // single quotes for standard JS strings
  singleQuote: true,

  // trailing commas wherever possible
  trailingComma: 'all',

  // number of spaces per indentation-level
  tabWidth: 2,

  // print semicolons at the ends of statements
  semi: true,

  // line length that the printer will wrap on
  printWidth: 80,

  // put spaces between brackets in object literals
  bracketSpacing: false,

  // puts closing > on next line (multi-line JSX elements)
  bracketSameLine: false,

  // keep as multi-line when possible
  objectWrap: 'preserve',

  // handle line endings automatically based on the operating system
  endOfLine: 'auto',

  // Prettier will ignore files with a special comment -> "@noprettier", "@noformat"
  checkIgnorePragma: true,

  // format and preserve spaces in HTML files based on the CSS display property
  htmlWhitespaceSensitivity: 'css',
};
