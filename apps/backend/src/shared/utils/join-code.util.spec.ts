import {JOIN_CODE_ALPHABET, JOIN_CODE_LENGTH} from '../constants/company.constants';
import {generateJoinCode} from './join-code.util';

describe('generateJoinCode', () => {
  it('a megadott hosszu kodot adja', () => {
    expect(generateJoinCode()).toHaveLength(JOIN_CODE_LENGTH);
    expect(generateJoinCode(12)).toHaveLength(12);
  });

  it('csak az engedelyezett jeleket hasznalja', () => {
    const code = generateJoinCode(200);
    expect([...code].every((ch) => JOIN_CODE_ALPHABET.includes(ch))).toBe(true);
  });

  it('ket kod szinte biztosan kulonbozik', () => {
    expect(generateJoinCode()).not.toBe(generateJoinCode());
  });
});
