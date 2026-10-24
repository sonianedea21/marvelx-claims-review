import { twelfthsFor } from './ProgressBar';

describe('ProgressBar never overstates progress', () => {
  it.each([
    [0, 49, 0],
    [1, 49, 1], // any progress shows a sliver
    [47, 49, 11], // not full until everything is decided
    [48, 49, 11],
    [49, 49, 12],
    [0, 0, 0],
  ])('%i of %i → %i twelfths', (value, max, expected) => {
    expect(twelfthsFor(value, max)).toBe(expected);
  });
});
