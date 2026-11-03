import {parseDuration} from './parse-duration.util';

describe('parseDuration', () => {
  it.each([
    ['900', 900],
    ['30s', 30],
    ['15m', 900],
    ['12h', 43200],
    ['60d', 5184000],
  ])('%s -> %d masodperc', (input, expected) => {
    expect(parseDuration(input)).toBe(expected);
  });

  it('ervenytelen formatumra hibat dob', () => {
    expect(() => parseDuration('15 perc')).toThrow('Ervenytelen idotartam');
  });
});
