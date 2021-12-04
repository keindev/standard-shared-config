// @see https://github.com/facebook/jest/issues/9430
// eslint-disable-next-line node/no-extraneous-import
import { jest } from '@jest/globals';
import { promises as fs } from 'fs';

import LocalConfig from '../../core/LocalConfig';

jest.useFakeTimers();

const CONFIG_CONTENT = `
overrideScripts:
  "build": "tsc --extendedDiagnostics"

ignoreDependencies: ['ts-jest', 'jest', 'jest', 'jest']
`;

jest.spyOn(fs, 'access').mockImplementation(() => Promise.resolve());
jest.spyOn(fs, 'readFile').mockImplementation(() => Promise.resolve(CONFIG_CONTENT));

describe('Config', () => {
  const config = new LocalConfig('.config');

  it('initialization', async () => {
    expect(config.isInitialized).toBeFalsy();

    await config.init();

    expect(config.isInitialized).toBeTruthy();
    expect(config.overrideScripts).toEqual([['build', 'tsc --extendedDiagnostics']]);
    expect(config.ignoreDependencies).toEqual(['ts-jest', 'jest']);
    expect(config.findScript('build')).toBe('tsc --extendedDiagnostics');
    expect(config.findScript('test')).toBeUndefined();
    expect(config.isIgnoreDependency('ts-jest')).toBeTruthy();
    expect(config.isIgnoreDependency('test')).toBeFalsy();
  });
});
