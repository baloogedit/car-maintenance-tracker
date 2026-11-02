import {randomInt} from 'crypto';

import {JOIN_CODE_ALPHABET, JOIN_CODE_LENGTH} from '../constants/company.constants';

// Veletlen csatlakozasi kod a JOIN_CODE_ALPHABET jeleibol. A crypto.randomInt
// kriptografiailag eros, igy a kod nem talalhato ki.
export function generateJoinCode(length: number = JOIN_CODE_LENGTH): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += JOIN_CODE_ALPHABET[randomInt(JOIN_CODE_ALPHABET.length)];
  }
  return code;
}
