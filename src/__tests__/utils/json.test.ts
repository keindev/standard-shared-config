import { merge } from '../../utils/json';

describe('JSON utils', () => {
  it('merge', () => {
    expect(
      merge({
        left: { a: { b: { c: 1 }, g: [1, 2, 3, { test: 11 }] }, f: 'test' },
        right: { a: { b: { c: 2 }, g: [3, 2, 4, { test: 11 }, { test: 12 }] }, d: true, e: 23 },
        excludes: new Set(['a.b.c', 'a.g']),
      })
    ).toEqual({ a: { b: { c: 1 }, g: [3, 2, 4, { test: 11 }, { test: 12 }, 1] }, d: true, e: 23 });
  });
});
