// A seedek felhasznaloi (mindegyik jelszava ugyanaz). Az e2e tesztek elott
// futtasd: npm run seed && npm run seed:2
export const TEST_PASSWORD = 'Teszt1234!';

export const SEED_USERS = {
  // seed.ts
  private: 'magan@teszt.hu',
  // seed-2.ts - "Gyors Futar Bt.": Fanni az admin, Gabor a tag
  companyAdmin: 'fanni@seed2.teszt.hu',
  companyMember: 'gabor@seed2.teszt.hu',
  // seed-2.ts - masik maganszemely, akinek a jarmuveit masok nem lathatjak
  otherPrivate: 'csaba@seed2.teszt.hu',
} as const;

// Egyedi e-mail a teszt sajat felhasznalojanak; a domain alapjan takaritunk.
export const TEST_EMAIL_DOMAIN = '@e2e.teszt.hu';

export function uniqueTestEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}${TEST_EMAIL_DOMAIN}`;
}
