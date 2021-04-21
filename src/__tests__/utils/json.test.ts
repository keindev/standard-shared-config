import { merge } from '../../utils/json';

describe('JSON utils', () => {
  it('merge', () => {
    expect(
      merge({
        left: { a: { b: { c: 1 }, g: [1, 2, 3] }, f: 'test' },
        right: { a: { b: { c: 2 }, g: [3, 2] }, d: true, e: 23 },
        excludes: new Set(['a.b.c', 'a.g']),
      })
    ).toEqual({ a: { b: { c: 1 }, g: [3, 2, 3] }, d: true, e: 23 });
  });
});
