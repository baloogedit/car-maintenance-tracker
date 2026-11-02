// "15m", "12h", "60d" vagy masodpercben megadott szam -> masodperc
const UNIT_SECONDS: Record<string, number> = {'': 1, s: 1, m: 60, h: 3600, d: 86400};

export function parseDuration(value: string): number {
  const match = /^(\d+)\s*([smhd]?)$/.exec(value.trim());
  if (!match) {
    throw new Error(`Ervenytelen idotartam: "${value}" (pl. 15m, 12h, 60d)`);
  }
  return Number(match[1]) * UNIT_SECONDS[match[2]];
}
