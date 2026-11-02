// Indulaskor ellenorzi, hogy a kotelezo kornyezeti valtozok meg vannak-e adva,
// igy egy hianyzo .env sor nem csak az elso kereskor derul ki.
const REQUIRED_ENV_VARS = ['DATABASE_URL', 'JWT_ACCESS_SECRET'] as const;

export function validateEnv(config: Record<string, unknown>) {
  const missing = REQUIRED_ENV_VARS.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(`Hianyzo kornyezeti valtozo(k) a .env-ben: ${missing.join(', ')}`);
  }
  return config;
}
