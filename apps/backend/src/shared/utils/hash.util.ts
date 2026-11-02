import {createHash} from 'crypto';

// SHA-256 hex. A refresh tokenbol csak ez kerul az adatbazisba, igy egy
// kiszivargott tabla nem ad hasznalhato tokent.
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
